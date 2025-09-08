import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import {
  Phone,
  ArrowLeft,
  Video,
  Info,
  ImageIcon,
  Camera,
  Mic,
  Smile,
  Send,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3050";

const Chat = ({
  chatId,
  activeMembers,
  setActiveMembers,
  setOpenDetail,
  isMobile,
  onBackToList,
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const { user, authToken } = useContext(AuthContext);
  const endRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  // Fetch chatroom, active members & messages
  useEffect(() => {
    if (!chatId || !user?.id || !authToken) return;

    const fetchChatData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get chatroom details
        const { data: chatRoomData } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/chatserver/chat/chatrooms/${chatId}`
        );
        setChatRoom(chatRoomData);

        if (chatRoomData.id !== chatId) {
          console.warn("Chatroom ID mismatch!");
          return;
        }

        // 2️⃣ Get active members (users in this chatroom)
        const { data: members } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/chatserver/chat/chatrooms/${chatId}/members`
        );

        // Filter out current user from active members for display
        const otherMembers = members.filter(
          (member) => member.userId !== user.id
        );
        setActiveMembers(otherMembers);

        // 3️⃣ Get messages
        const { data: msgs } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/chatserver/chat/chatrooms/${chatId}/messages`
        );
        setMessages(msgs);
      } catch (err) {
        console.error("Error loading chat data:", err);
        // If chatroom doesn't exist or user doesn't have access
        if (err.response?.status === 404 || err.response?.status === 403) {
          setMessages([]);
          setActiveMembers([]);
          setChatRoom(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, user?.id, authToken]);

  useEffect(() => {
    if (!chatId || !user?.id) return;
    // Connect to socket.io server
    const s = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket"],
      withCredentials: true,
    });
    setSocket(s);

    // Join chat room
    s.emit("joinRoom", { chatRoomId: chatId });

    // Listen for new messages
    s.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.emit("leaveRoom", { chatRoomId: chatId });
      s.disconnect();
    };
  }, [chatId, user?.id]);

  const sendMessage = async () => {
    if (!text.trim() || !chatId || !user?.id) return;

    try {
      // Send message to backend (persist)
      const { data: newMsg } = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/chatserver/chat/chatrooms/${chatId}/messages`,
        { senderId: user.id, content: text.trim() },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          withCredentials: true,
        }
      );

      // Emit message via socket for real-time update
      if (socket) {
        socket.emit("sendMessage", {
          chatRoomId: chatId,
          message: newMsg,
        });
      }

      setMessages((prev) => [...prev, newMsg]);
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center border-l border-r border-white/10 backdrop-blur-md bg-black/20">
        <div className="text-white/60">Loading chat...</div>
      </div>
    );
  }

  // Show empty state when no chat is selected
  if (!chatId) {
    return (
      <div className="flex-1 h-full flex items-center justify-center border-l border-r border-white/10 backdrop-blur-md bg-black/20">
        <div className="text-center text-white/60">
          <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col justify-between border-l border-r border-white/10 backdrop-blur-md bg-black/20">
      {/* Chat Header */}
      <div className="flex p-2 sm:p-3 justify-between items-center border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Back button (mobile only) */}
          {isMobile && onBackToList && (
            <button
              onClick={onBackToList}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Avatar */}
          {activeMembers[0] && (
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-1 ring-white/20">
              <AvatarImage
                src={activeMembers[0].user?.avatar || "/placeholder.svg"}
              />
              <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                {activeMembers[0].user?.firstName?.[0] || "U"}
                {activeMembers[0].user?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Name + status */}
          <div className="flex flex-col leading-tight">
            <span className="text-sm sm:text-base font-medium text-white truncate max-w-[120px] sm:max-w-[160px]">
              {activeMembers.length > 0
                ? activeMembers
                    .map(
                      (m) =>
                        `${m.user?.firstName || "Unknown"} ${
                          m.user?.lastName || "User"
                        }`
                    )
                    .join(", ")
                : "Loading..."}
            </span>
            <p className="text-[11px] sm:text-xs text-green-400 font-medium">
              Online
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white" />
          <Video className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white" />
          <Info
            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white"
            onClick={() => setOpenDetail(true)}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="p-2 sm:p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 flex flex-col gap-2 sm:gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60 text-sm">
              <p>No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar only for received */}
                {!isOwnMessage && (
                  <Avatar className="w-6 h-6 ring-1 ring-white/10 flex-shrink-0">
                    <AvatarImage
                      src={message.sender?.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                      {message.sender?.firstName?.[0] || "U"}
                      {message.sender?.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message bubble */}
                <div className="max-w-[80%] sm:max-w-[65%]">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap break-words border ${
                      isOwnMessage
                        ? "bg-white/15 text-white border-white/30 rounded-br-sm ml-auto"
                        : "bg-white/10 text-white border-white/20 rounded-bl-sm"
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image || "/placeholder.svg"}
                        className="w-full object-cover rounded-lg mb-2 max-h-[160px] sm:max-h-[220px]"
                        alt="attachment"
                      />
                    )}
                    <p>{message.content || message.text}</p>
                  </div>

                  {/* Timestamp */}
                  <span
                    className={`text-[10px] text-white/50 mt-1 block ${
                      isOwnMessage ? "text-right" : "text-left"
                    }`}
                  >
                    {new Date(
                      message.createdAt || Date.now()
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef}></div>
      </div>

      {/* Message Input */}
      <div className="flex border-t border-white/10 items-center mt-auto gap-2 sm:gap-3 p-2 sm:p-3 backdrop-blur-sm bg-white/5">
        {/* Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:flex gap-2 sm:gap-3">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
        </div>

        {/* Shrink width on mobile */}
        <textarea
          className="flex-grow bg-white/10 backdrop-blur-sm border border-white/20 outline-none text-white p-2 sm:p-3 text-sm rounded-xl placeholder-white/50 focus:border-white/40 transition-colors resize-none min-h-[36px] sm:min-h-[40px] max-h-[90px] sm:max-h-[120px] w-[75%] sm:w-auto"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          style={{
            fontSize: window.innerWidth < 640 ? "14px" : undefined,
          }}
        />

        <div className="relative">
          <Smile
            className="w-5 h-5 cursor-pointer text-white/70 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
          />
          {open && (
            <div className="absolute bottom-12 -right-14 sm:right-0 z-50 max-w-[90vw] sm:max-w-xs">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>

        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-white hover:bg-black hover:text-white ease-in text-black py-2 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};

export default Chat;

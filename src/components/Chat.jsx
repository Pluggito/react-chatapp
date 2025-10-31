import { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { Spinner } from "./ui/spinner";
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
  PlusCircle,
  Check,
  CheckCheck
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const Chat = ({
  chatId,
  activeMembers,
  setActiveMembers,
  isMobile,
  onBackToList,
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const { user, authToken } = useContext(AuthContext);
  const {
    socket,
    newMessage,
    messageReadUpdate,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage: socketSendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping
  } = useContext(SocketContext);
  
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasMarkedAsRead = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  // ==================== FETCH CHAT DATA ====================
  useEffect(() => {
    if (!chatId || !user?.id || !authToken) return;

    const fetchChatData = async () => {
      try {
        setLoading(true);
        hasMarkedAsRead.current = false;

        // Get chatroom details
        const { data: chatRoomData } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/${chatId}`,
           { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
        );
        setChatRoom(chatRoomData);

        // Get active members
        const { data: members } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/${chatId}/members`,
           { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
        );

        const otherMembers = members.filter(
          (member) => member.userId !== user.id
        );
        setActiveMembers(otherMembers);

        // Get messages
        const { data: msgs } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/${chatId}/messages`,
           { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
        );
        setMessages(msgs);

        // Mark unread messages as read
        const unreadMessageIds = (msgs || [])
  .filter((msg) => 
    msg && msg.senderId !== user.id && 
    msg.readers && !msg.readers.includes(user.id)
  )
  .map((msg) => msg.id);

        if (unreadMessageIds.length > 0) {
          markMessagesAsRead(chatId, unreadMessageIds);
          hasMarkedAsRead.current = true;
        }

      } catch (err) {
        console.error("Error loading chat data:", err);
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
  }, [chatId, user?.id, authToken, markMessagesAsRead, setActiveMembers]);

  // ==================== JOIN/LEAVE ROOM ====================
  useEffect(() => {
    if (!socket || !chatId) return;

    joinRoom(chatId);

    return () => {
      leaveRoom(chatId);
      stopTyping(chatId);
    };
  }, [socket, chatId, joinRoom, leaveRoom, stopTyping]);

  // ==================== HANDLE NEW MESSAGES ====================
  useEffect(() => {
    if (!newMessage || newMessage.chatRoomId !== chatId) return;

    console.log("📩 New message received:", newMessage);

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === newMessage.id);
      if (exists) return prev;
      
      // Auto-mark as read if it's from another user
      if (newMessage.senderId !== user?.id) {
        setTimeout(() => {
          markMessagesAsRead(chatId, [newMessage.id]);
        }, 500);
      }
      
      return [...prev, newMessage];
    });
  }, [newMessage, chatId, user?.id, markMessagesAsRead]);

  // ==================== HANDLE READ UPDATES ====================
  useEffect(() => {
    if (!messageReadUpdate || messageReadUpdate.chatRoomId !== chatId) return;

    console.log("✅ Message read update:", messageReadUpdate);

    setMessages((prev) =>
      prev.map((msg) => {
        if (messageReadUpdate.messageIds.includes(msg.id)) {
          return {
            ...msg,
            readers: [...new Set([...msg.readers, messageReadUpdate.readBy])]
          };
        }
        return msg;
      })
    );
  }, [messageReadUpdate, chatId]);

  // ==================== TYPING INDICATOR ====================
  const handleTyping = useCallback(() => {
    if (!chatId) return;

    startTyping(chatId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chatId);
    }, 2000);
  }, [chatId, startTyping, stopTyping]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  // ==================== SEND MESSAGE ====================
const sendMessage = async () => {
  if (!text.trim() || !chatId || !user?.id) return;

  const messageContent = text.trim();
  const tempId = `temp-${Date.now()}`;
  setText("");
  stopTyping(chatId);

  // Optimistic update
  const optimisticMessage = {
    id: tempId,
    content: messageContent,
    type: "TEXT",
    senderId: user.id,
    sender: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username
    },
    createdAt: new Date().toISOString(),
    readers: [],
    chatRoomId: chatId,
    pending: true // ✅ Mark as pending
  };

  setMessages(prev => [...prev, optimisticMessage]);

  try {
    // ✅ Send via socket with acknowledgment
    socketSendMessage(chatId, messageContent, "TEXT");

    // ✅ Wait for socket confirmation (with timeout)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Message send timeout"));
      }, 5000);

      // Listen for confirmation from socket
      const handler = (msg) => {
        if (msg.content === messageContent) {
          clearTimeout(timeout);
          socket.off("message:received", handler);
          
          // Replace temp message with real one
          setMessages(prev => 
            prev.map(m => m.id === tempId ? { ...msg, pending: false } : m)
          );
          resolve();
        }
      };

      socket.on("message:received", handler);
    });

  } catch (err) {
    console.error("Socket send failed, falling back to HTTP:", err);
    
    // ✅ Fallback to HTTP if socket fails
    try {
      const { data: newMsg } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/${chatId}/messages`,
        { senderId: user.id, content: messageContent, type: "TEXT" },
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      );

      setMessages(prev => 
        prev.map(m => m.id === tempId ? newMsg : m)
      );
    } catch (httpErr) {
      // Both failed - remove message and show error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to send message. Please check your connection.", httpErr);
    }
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ==================== RENDER READ RECEIPT ICON ====================
  const renderReadReceipt = (message) => {
    if (message.senderId !== user?.id) return null;

    const isRead = message.readers && message.readers.length > 0;
    
    return isRead ? (
      <CheckCheck className="w-3 h-3 text-blue-400" />
    ) : (
      <Check className="w-3 h-3 text-white/40" />
    );
  };

  // ==================== RENDER TYPING INDICATOR ====================
  const renderTypingIndicator = () => {
    const roomTypers = typingUsers[chatId];
    if (!roomTypers || roomTypers.size === 0) return null;

    const typerNames = Array.from(roomTypers)
      .map((userId) => {
        const member = activeMembers.find((m) => m.userId === userId);
        return member?.user?.firstName || "Someone";
      })
      .join(", ");

    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 text-sm text-white/60"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
      >
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span>{typerNames} {roomTypers.size === 1 ? "is" : "are"} typing...</span>
      </motion.div>
    );
  };

  // ==================== RENDER MESSAGE CONTENT ====================
  const renderMessageContent = (message) => {
    switch (message.type) {
      case "IMAGE":
        return (
          <div>
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                className="w-full object-cover rounded-lg mb-2 max-h-[160px] sm:max-h-[220px]"
                alt="attachment"
              />
            )}
            {message.content && <p>{message.content}</p>}
          </div>
        );

      case "AUDIO":
        return (
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-white/70" />
            <audio controls className="max-w-[200px]">
              <source src={message.mediaUrl} type="audio/mpeg" />
              Your browser does not support audio.
            </audio>
            {message.duration && (
              <span className="text-xs text-white/50">{message.duration}s</span>
            )}
          </div>
        );

      case "TEXT":
      default:
        return <p>{message.content || "[No content]"}</p>;
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <motion.div 
        className="flex-1 h-full flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Spinner className="w-5 h-5 text-white/60" />
        <div className="text-white/60">Loading chat...</div>
      </motion.div>
    );
  }

  // ==================== EMPTY STATE ====================
  if (!chatId) {
    return (
      <motion.div 
        className="flex-1 h-full flex items-center justify-center border-l border-r border-white/10 backdrop-blur-md bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center text-white/60">
          <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </motion.div>
    );
  }

  // ==================== MAIN CHAT UI ====================
  return (
    <motion.div
      className={`${
        isMobile ? "bg-black h-[100dvh]" : "bg-black/20 backdrop-blur-md h-full"
      } flex flex-col border-l border-r w-full border-white/10 overflow-y-hidden`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ==================== CHAT HEADER ==================== */}
      <div className={`${isMobile && "fixed w-full z-10 bg-black"} flex-shrink-0 flex p-3 justify-between items-center border-b border-white/10 backdrop-blur-sm`}>
        <div className="flex items-center gap-2">
          {isMobile && onBackToList && (
            <motion.button
              onClick={onBackToList}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          )}

          {activeMembers[0] && (
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-1 ring-white/20">
              <AvatarImage src={activeMembers[0].user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                {activeMembers[0].user?.firstName?.[0] || "U"}
                {activeMembers[0].user?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col leading-tight">
            <span className="text-sm sm:text-base font-medium text-white truncate max-w-[120px] sm:max-w-[160px]">
              {activeMembers.length > 0
                ? activeMembers
                    .map((m) => `${m.user?.firstName || "Unknown"} ${m.user?.lastName || "User"}`)
                    .join(", ")
                : "Loading..."}
            </span>
            <p className="text-[11px] sm:text-xs text-green-400 font-medium">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[Phone, Video, Info].map((Icon, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="transition-colors"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ==================== MESSAGES SECTION ==================== */}
      <motion.section
        className={`${isMobile && "pt-16"} p-2 sm:p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 flex flex-col gap-2 sm:gap-3 min-h-0`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {messages.length === 0 ? (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center text-white/60 text-sm">
              <p>No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;

              return (
                <motion.div
                  key={`msg-${message.id}-${message.createdAt}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  layout
                  className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="w-6 h-6 ring-1 ring-white/10 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                        {message.sender?.firstName?.[0] || "U"}
                        {message.sender?.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <motion.div className="max-w-[80%] sm:max-w-[65%]" whileHover={{ scale: 1.02 }}>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap break-words border transition-all duration-200 ${
                        isOwnMessage
                          ? "bg-[#2a2a2a]/90 text-white border-white/20 rounded-br-sm ml-auto hover:bg-[#333333] hover:border-white/30"
                          : "bg-[#1b1b1b]/90 text-white border-white/10 rounded-bl-sm hover:bg-[#242424] hover:border-white/20"
                      }`}
                    >
                      {renderMessageContent(message)}
                    </div>

                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        isOwnMessage ? "justify-end pr-1" : "justify-start pl-1"
                      }`}
                    >
                      <span className="text-[10px] text-white/40">
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                      {renderReadReceipt(message)}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </>
        )}
        
        <AnimatePresence>
          {renderTypingIndicator()}
        </AnimatePresence>
        
        <div ref={endRef}></div>
      </motion.section>

      {/* ==================== MESSAGE INPUT ==================== */}
      <div className="flex-shrink-0 flex border-t border-white/10 items-center gap-2 sm:gap-3 p-2 sm:p-3 backdrop-blur-sm bg-white/5">
        <div className="hidden lg:flex gap-2 sm:gap-3">
          {[ImageIcon, Camera, Mic].map((Icon, idx) => (
            <motion.button key={idx} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
            </motion.button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <PlusCircle className="w-5 h-5 cursor-pointer text-white/70 hover:text-white transition-colors lg:hidden inline" />
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black/95 border border-white/20 rounded-lg shadow-lg backdrop-blur-sm">
            <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors rounded-md focus:bg-white/10">
              <ImageIcon className="w-5 h-5 text-white/80 flex-shrink-0" />
              <span className="text-sm text-white/90">Photos</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors rounded-md focus:bg-white/10">
              <Camera className="w-5 h-5 text-white/80 flex-shrink-0" />
              <span className="text-sm text-white/90">Camera</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors rounded-md focus:bg-white/10">
              <Mic className="w-5 h-5 text-white/80 flex-shrink-0" />
              <span className="text-sm text-white/90">Audio</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <textarea
          className={`${
            isMobile ? "bg-black" : "bg-white/10 backdrop-blur-sm"
          } flex-grow border border-white/20 outline-none text-white p-2 sm:p-3 text-sm rounded-full placeholder-white/50 focus:border-white/40 transition-colors resize-none min-h-[36px] sm:min-h-[40px] max-h-[90px] sm:max-h-[120px] lg:w-[85%] w-full sm:w-[75%]`}
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          rows={1}
        />

        <div className="relative">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(!open)}>
            <Smile className="w-5 h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          </motion.button>
          <AnimatePresence>
            {open && (
              <motion.div
                className="absolute bottom-12 -right-14 sm:right-0 z-50 max-w-[90vw] sm:max-w-xs"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <EmojiPicker onEmojiClick={handleEmoji} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-white hover:bg-black hover:text-white ease-in text-black py-2 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Chat;
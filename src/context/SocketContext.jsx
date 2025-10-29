import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL;
// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Message and update states
  const [newMessage, setNewMessage] = useState(null);
  const [chatListUpdate, setChatListUpdate] = useState(null);
  const [messageReadUpdate, setMessageReadUpdate] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { chatRoomId: Set(userIds) }

  const typingTimeouts = useRef({}); // Track typing timeouts

  // ==================== SOCKET CONNECTION ====================
  useEffect(() => {
    if (!user || !authToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log("🔌 Connecting to socket...");

    const s = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Connection handlers
    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      console.warn("❌ Socket disconnected");
      setIsConnected(false);
    });

    s.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsConnected(false);
    });

    // ==================== MESSAGE RECEIVED ====================
    s.on("message:received", (message) => {
      console.log("📩 Message received:", message);
      setNewMessage(message);
    });

    // ==================== CHAT LIST UPDATE ====================
    s.on("chatList:update", (update) => {
      console.log("📋 Chat list update:", update);
      setChatListUpdate(update);
    });

    // ==================== MESSAGE READ UPDATE ====================
    s.on("message:readUpdate", (update) => {
      console.log("✅ Message read update:", update);
      setMessageReadUpdate(update);
    });

    // ==================== TYPING INDICATORS ====================
    s.on("typing:show", ({ chatRoomId, userId }) => {
      console.log(`⌨️ User ${userId} typing in ${chatRoomId}`);
      
      setTypingUsers((prev) => {
        const roomTypers = new Set(prev[chatRoomId] || []);
        roomTypers.add(userId);
        return { ...prev, [chatRoomId]: roomTypers };
      });

      // Auto-hide after 3 seconds
      if (typingTimeouts.current[`${chatRoomId}-${userId}`]) {
        clearTimeout(typingTimeouts.current[`${chatRoomId}-${userId}`]);
      }

      typingTimeouts.current[`${chatRoomId}-${userId}`] = setTimeout(() => {
        setTypingUsers((prev) => {
          const roomTypers = new Set(prev[chatRoomId] || []);
          roomTypers.delete(userId);
          if (roomTypers.size === 0) {
            const newState = { ...prev };
            delete newState[chatRoomId];
            return newState;
          }
          return { ...prev, [chatRoomId]: roomTypers };
        });
      }, 3000);
    });

    s.on("typing:hide", ({ chatRoomId, userId }) => {
      console.log(`⌨️ User ${userId} stopped typing in ${chatRoomId}`);
      
      // Clear timeout if exists
      if (typingTimeouts.current[`${chatRoomId}-${userId}`]) {
        clearTimeout(typingTimeouts.current[`${chatRoomId}-${userId}`]);
        delete typingTimeouts.current[`${chatRoomId}-${userId}`];
      }

      setTypingUsers((prev) => {
        const roomTypers = new Set(prev[chatRoomId] || []);
        roomTypers.delete(userId);
        if (roomTypers.size === 0) {
          const newState = { ...prev };
          delete newState[chatRoomId];
          return newState;
        }
        return { ...prev, [chatRoomId]: roomTypers };
      });
    });

    // Error handler
    s.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(s);

    // Cleanup
    return () => {
      console.log("🔌 Disconnecting socket...");
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, authToken]);

  // ==================== HELPER FUNCTIONS ====================

  const joinRoom = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId) return;
    socket.emit("joinRoom", { chatRoomId });
    console.log(`📥 Joined room: ${chatRoomId}`);
  }, [socket]);

  const leaveRoom = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId) return;
    socket.emit("leaveRoom", { chatRoomId });
    console.log(`📤 Left room: ${chatRoomId}`);
  }, [socket]);

  const sendMessage = useCallback((chatRoomId, content, type = "TEXT", mediaUrl = null, duration = null) => {
    if (!socket || !chatRoomId) return;

    socket.emit("message:send", {
      chatRoomId,
      content,
      type,
      mediaUrl,
      duration
    });

    console.log(`📨 Sent message to room: ${chatRoomId}`);
  }, [socket]);

  const markMessagesAsRead = useCallback((chatRoomId, messageIds) => {
    if (!socket || !chatRoomId || !messageIds || messageIds.length === 0) return;

    socket.emit("message:read", {
      chatRoomId,
      messageIds
    });

    //console.log(`✅ Marked ${messageIds.length} messages as read in ${chatRoomId}`);
  }, [socket]);

  const startTyping = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId) return;
    socket.emit("typing:start", { chatRoomId });
  }, [socket]);

  const stopTyping = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId) return;
    socket.emit("typing:stop", { chatRoomId });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        newMessage,
        chatListUpdate,
        messageReadUpdate,
        typingUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        markMessagesAsRead,
        startTyping,
        stopTyping
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
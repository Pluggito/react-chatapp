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
  
  const [newMessage, setNewMessage] = useState(null);
  const [chatListUpdate, setChatListUpdate] = useState(null);
  const [messageReadUpdate, setMessageReadUpdate] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  const typingTimeouts = useRef({});

  // ==================== SOCKET CONNECTION ====================
  useEffect(() => {
    if (!user || !authToken) {
      if (socket) {
       // console.log("🔌 Disconnecting socket (no user/token)");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

   // console.log("🔌 Initializing socket connection...");

    const s = io(SOCKET_URL, {
      query: { 
        userId: user.id,
        token: authToken
      },
      auth: {
        token: authToken
      },  
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: "/socket.io/",
      secure: true,
      rejectUnauthorized: false
    });

    // ==================== CONNECTION HANDLERS ====================
    s.on("connect", () => {
      // console.log("✅ Socket connected:", s.id);
      setIsConnected(true);
    });

    s.on("disconnect", (reason) => {
      // console.warn("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    s.on("connect_error", (error) => {
      // console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    s.on("reconnect", (attemptNumber) => {
      // console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    s.on("reconnect_attempt", (attemptNumber) => {
      // console.log("🔄 Reconnection attempt", attemptNumber);
    });

    s.on("reconnect_error", (error) => {
      // console.error("❌ Reconnection error:", error.message);
    });

    s.on("reconnect_failed", () => {
      // console.error("❌ Reconnection failed after all attempts");
    });

    // ==================== MESSAGE HANDLERS ====================
    s.on("message:received", (message) => {
     // console.log("📩 [Socket Event] message:received:", {
      //   id: message.id,
      //   chatRoomId: message.chatRoomId,
      //   senderId: message.senderId,
      //   content: message.content?.substring(0, 30)
      // });
      setNewMessage(message);
    });

    s.on("chatList:update", (update) => {
      // console.log("📋 [Socket Event] chatList:update:", update.chatRoomId);
      setChatListUpdate(update);
    });

    s.on("message:readUpdate", (update) => {
      // console.log("✅ [Socket Event] message:readUpdate:", {
      //  chatRoomId: update.chatRoomId,
      //  messageCount: update.messageIds?.length,
      //  readBy: update.readBy
     // });
      setMessageReadUpdate(update);
    });

    // ==================== TYPING HANDLERS ====================
    s.on("typing:show", ({ chatRoomId, userId }) => {
     // console.log(`⌨️ [Socket Event] typing:show: User ${userId} in room ${chatRoomId}`);
      
      setTypingUsers((prev) => {
        const roomTypers = new Set(prev[chatRoomId] || []);
        roomTypers.add(userId);
        return { ...prev, [chatRoomId]: roomTypers };
      });

      // Auto-hide after 3 seconds
      const key = `${chatRoomId}-${userId}`;
      if (typingTimeouts.current[key]) {
        clearTimeout(typingTimeouts.current[key]);
      }

      typingTimeouts.current[key] = setTimeout(() => {
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
        delete typingTimeouts.current[key];
      }, 3000);
    });

    s.on("typing:hide", ({ chatRoomId, userId }) => {
      // console.log(`⌨️ [Socket Event] typing:hide: User ${userId} in room ${chatRoomId}`);
      
      const key = `${chatRoomId}-${userId}`;
      if (typingTimeouts.current[key]) {
        clearTimeout(typingTimeouts.current[key]);
        delete typingTimeouts.current[key];
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
      // console.error("❌ [Socket Event] error:", error);
    });

    setSocket(s);

    // Cleanup
    return () => {
      console.log("🔌 Cleaning up socket connection");
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, authToken]);

  // ==================== HELPER FUNCTIONS ====================
  const joinRoom = useCallback((chatRoomId) => {
 // console.log("🎯 joinRoom called with:", chatRoomId);
  
  if (!socket) {
   // console.error("❌ joinRoom: No socket!");
    return;
  }

  if (!chatRoomId) {
    // console.error("❌ joinRoom: No chatRoomId!");
    return;
  }

  if (!socket.connected) {
    // console.error("❌ joinRoom: Socket not connected!");
    return;
  }

  // console.log("✅ Emitting joinRoom event");
  socket.emit("joinRoom", { chatRoomId });
}, [socket]);

  const leaveRoom = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId) return;

    // console.log(`📤 [Emit] leaveRoom:`, chatRoomId);
    socket.emit("leaveRoom", { chatRoomId });
  }, [socket]);

  const sendMessage = useCallback((chatRoomId, content, type = "TEXT", mediaUrl = null, duration = null) => {
    if (!socket || !chatRoomId) {
      console.warn("⚠️ Cannot send message: missing socket or chatRoomId");
      return;
    }

    if (!socket.connected) {
     // console.error("❌ Socket not connected, cannot send message");
      return;
    }

   // console.log(`📨 [Emit] message:send to room ${chatRoomId}:`, {
   //   content: content?.substring(0, 30),
   //   type,
   //   socketId: socket.id
   // });

    socket.emit("message:send", {
      chatRoomId,
      content,
      type,
      mediaUrl,
      duration
    });
  }, [socket]);

  const markMessagesAsRead = useCallback((chatRoomId, messageIds) => {
    if (!socket || !chatRoomId || !messageIds || messageIds.length === 0) return;

   // console.log(`✅ [Emit] message:read in room ${chatRoomId}:`, messageIds.length, "messages");
    
    socket.emit("message:read", {
      chatRoomId,
      messageIds
    });
  }, [socket]);

  const startTyping = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId || !socket.connected) return;
    
    socket.emit("typing:start", { chatRoomId });
  }, [socket]);

  const stopTyping = useCallback((chatRoomId) => {
    if (!socket || !chatRoomId || !socket.connected) return;
    
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
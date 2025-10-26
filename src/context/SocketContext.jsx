import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL 

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [chatListUpdate, setChatListUpdate] = useState(null);

  useEffect(() => {
    if (!user || !authToken) return;

    const s = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    setSocket(s);
    // console.log("✅ Socket connected for:", user.email);

    s.on("chatListUpdate", (data) => {
      // console.log("🔔 Chat List Update received:", data);
      setChatListUpdate(data);
    });

    s.on("disconnect", () => {
      // console.log("❌ Socket disconnected");
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user, authToken]);

  // ----------------------
  // Socket Helper Functions
  // ----------------------

  const joinRoom = useCallback(
    (chatRoomId) => {
      if (socket && chatRoomId) {
        // console.log("📥 Joining room:", chatRoomId);
        socket.emit("joinRoom", { chatRoomId });
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (chatRoomId) => {
      if (socket && chatRoomId) {
        // console.log("📤 Leaving room:", chatRoomId);
        socket.emit("leaveRoom", { chatRoomId });
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    (chatRoomId, message) => {
      if (socket && chatRoomId && message) {
        socket.emit("sendMessage", { chatRoomId, message });
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        chatListUpdate,
        joinRoom,
        leaveRoom,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
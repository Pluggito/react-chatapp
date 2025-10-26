import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3050";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatListUpdate, setChatListUpdate] = useState(null);

  useEffect(() => {
    if (!user || !authToken) {
      if (socket) {
        console.log("🧹 User logged out, disconnecting socket");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      setIsConnected(true);
    });

    s.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    s.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      setIsConnected(false);
    });

    s.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    s.on("chatListUpdate", (data) => {
      console.log("🔔 Chat List Update received:", data);
      setChatListUpdate(data);
    });

    setSocket(s);
    console.log("🔌 Socket initialized for user:", user.email);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off("reconnect");
      s.off("chatListUpdate");
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, authToken]);

  const joinRoom = useCallback(
    (chatRoomId) => {
      if (socket && socket.connected && chatRoomId) {
        console.log("📥 Joining room:", chatRoomId);
        socket.emit("joinRoom", { chatRoomId }); // ✅ Send as object
      } else {
        console.warn("⚠️ Cannot join room - socket not connected or no chatRoomId");
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (chatRoomId) => {
      if (socket && chatRoomId) {
        console.log("📤 Leaving room:", chatRoomId);
        socket.emit("leaveRoom", { chatRoomId });
      }
    },
    [socket]
  );

  // ❌ REMOVE sendMessage - not needed anymore
  // const sendMessage = useCallback(...);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        chatListUpdate,
        joinRoom,
        leaveRoom,
        // sendMessage, ❌ Remove this
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
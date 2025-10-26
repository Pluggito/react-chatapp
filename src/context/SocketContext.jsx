import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL;
  
// eslint-disable-next-line react-refresh/only-export-components  
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [chatListUpdate, setChatListUpdate] = useState(null);

  useEffect(() => {
    if (!user || !authToken) return;

    const s = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    setSocket(s);

    // ✅ Receive new messages in chat room
    s.on("newMessage", (message) => {
      setNewMessage(message);
    });

    // ✅ Receive sidebar updates when any message is sent
    s.on("lastMessageUpdate", (message) => {
      setChatListUpdate(message);
    });

    s.on("disconnect", () => {
      console.warn("❌ Socket disconnected - reconnecting...");
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user, authToken]);

  const joinRoom = useCallback(
    (chatRoomId) => {
      socket?.emit("joinRoom", { chatRoomId });
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (chatRoomId) => {
      socket?.emit("leaveRoom", { chatRoomId });
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
        newMessage,
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

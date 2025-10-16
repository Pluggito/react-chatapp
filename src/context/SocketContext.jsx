// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3050";
  
// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && authToken) {
      const s = io(SOCKET_URL, {
        query: { userId: user.id },
        transports: ["websocket"],
        withCredentials: true,
      });

      setSocket(s);
      console.log("✅ Socket connected for:", user.email);

      return () => {
        console.log("❌ Socket disconnected");
        s.disconnect();
        setSocket(null);
      };
    }
  }, [user, authToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for easy access


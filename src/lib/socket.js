import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:3050", {
      auth: { token },
      withCredentials: true,
    });
    console.log("Socket connected ✅");
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("Socket disconnected ❌");
    socket = null;
  }
};

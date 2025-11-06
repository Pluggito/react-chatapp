"use client";

//import Chat from "./components/Chat"
//import Detail from "./components/Detail"
//import List from "./components/List/List"
import { AuthCard } from "./auth/AuthForm";
import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import ForgetPassword from "./auth/ForgetPassword";
import Home from "./components/Home";

const App = () => {
  const { user, isLoggedIn } = useContext(AuthContext);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const syncUser = user !== null && user !== undefined;
  //const syncUser = true
  const [openDetail, setOpenDetail] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'chat'

  const handleMobileChatSelect = (chatId) => {
    setActiveChatRoomId(chatId);
    setMobileView("chat");
  };

  const handleBackToList = () => {
    setMobileView("list");
    setActiveChatRoomId(null);
  };

  return (
    <div className="bg-black min-h-screen flex items-center justify-center text-white overflow-hidden px-2 md:p-4">
      <Toaster />

      <Routes>
        <Route path="/signup" element={<AuthCard />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />

        <Route
          path="/"
          element={
            <Home
              syncUser={syncUser}
              activeChatRoomId={activeChatRoomId}
              setActiveChatRoomId={setActiveChatRoomId}
              activeMembers={activeMembers}
              setActiveMembers={setActiveMembers}
              isLoggedIn={isLoggedIn}
              setOpenDetail={setOpenDetail}
              handleBackToList={handleBackToList}
              handleMobileChatSelect={handleMobileChatSelect}
              mobileView={mobileView}
              openDetail={openDetail}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default App;

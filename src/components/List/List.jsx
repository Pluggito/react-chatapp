"use client"

import { useContext } from "react"
//import { useState } from "react"
import ChatList from "./ChatList"
import UserInfo from "./UserInfo"
import { AuthContext } from "../../context/AuthContext"


const List = ({ setActiveChatRoomId, activeChatRoomId }) => {
 const { user } = useContext(AuthContext)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <UserInfo user={user} />
      {/* Contact List <ChatList/> */}
      <ChatList setActiveChatRoomId={setActiveChatRoomId} activeChatRoomId={activeChatRoomId}
       onChatSelect={setActiveChatRoomId}
      />
    </div>
  );
}

export default List

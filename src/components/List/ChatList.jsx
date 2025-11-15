"use client"

import { useContext, useState, useEffect } from "react"
import { Plus, Minus, SearchIcon } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import axios from "axios"
import { AuthContext } from "../../context/AuthContext"
import { SocketContext } from "../../context/SocketContext"
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion"

const ChatList = ({ onChatSelect, setActiveChatRoomId, activeChatRoomId, isMobile }) => {
  const [addMode, setAddMode] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [alreadyAddedIds, setAlreadyAddedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, authToken } = useContext(AuthContext)
  const { chatListUpdate } = useContext(SocketContext)

  const [contacts, setContacts] = useState([])

  // ==================== LOAD USER CHATROOMS ====================
  const loadUserChatrooms = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/user/${user.id}`,
         {
            headers: { Authorization: `Bearer ${authToken}` },
            withCredentials: true,
          }
      )

      const formattedContacts = res.data.map((chatroom) => {
        const otherMember = chatroom.members?.find((member) => member.userId !== user.id)
        const otherUser = otherMember?.user

        // Calculate unread count from last message readers array
        let unreadCount = 0
        if (chatroom.lastMessage && chatroom.lastMessage.userId !== user.id) {
          // If last message is not from me and I haven't read it
          if (!chatroom.lastMessage.readers?.includes(user.id)) {
            unreadCount = 1 // Simplified - in production, you'd count all unread messages
          }
        }

        return {
          id: chatroom.id,
          name: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown User",
          message: chatroom.lastMessage?.content || "No messages yet",
          messageType: chatroom.lastMessage?.type || "TEXT",
          avatar: otherUser?.avatar || null,
          time: chatroom.lastMessage?.createdAt
            ? new Date(chatroom.lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "New chat",
          unread: unreadCount,
          otherUserId: otherUser?.id,
          updatedAt: chatroom.updatedAt
        }
      })

      // Sort by most recent
      formattedContacts.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )

      setContacts(formattedContacts)
    } catch (err) {
      console.error("Error loading chatrooms:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id && authToken) {
      loadUserChatrooms()
    }
  }, [user?.id, authToken])

  // ==================== SEARCH USERS ====================
  const getUserBySearch = async () => {
    if (!searchInput.trim()) return

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/users/search`,
        { params: { search: searchInput } }
      )
      setSearchResults(res.data)
    } catch (err) {
      console.error("Error in searching user", err)
      setSearchResults([])
    }
  }

  // ==================== ADD NEW CHAT ====================
  const handleAddUser = async (selectedUser) => {
    try {
      const existingChat = contacts.find((contact) => contact.otherUserId === selectedUser.id)

      if (existingChat) {
        setActiveChatRoomId(existingChat.id)
        onChatSelect?.(existingChat.id)
        setAddMode(false)
        return
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms`,
        { currentUserId: user.id, otherUserId: selectedUser.id },
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      )

      const chatRoom = res.data

      const newContact = {
        id: chatRoom.id,
        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
        message: "New chat started...",
        messageType: "TEXT",
        avatar: selectedUser.avatar || null,
        time: "Just now",
        unread: 0,
        otherUserId: selectedUser.id,
        updatedAt: new Date().toISOString()
      }

      setContacts((prev) => [newContact, ...prev])
      setActiveChatRoomId(chatRoom.id)
      onChatSelect?.(chatRoom.id)
      setAlreadyAddedIds((prev) => [...prev, selectedUser.id])
      setAddMode(false)
      setSearchInput("")
      setSearchResults([])
    } catch (err) {
      console.error("Error creating chat room", err)
    }
  }

  const handleChatClick = (chatId) => {
    setActiveChatRoomId(chatId)
    onChatSelect?.(chatId)
  }

  // ==================== HANDLE CHAT LIST UPDATES ====================
  useEffect(() => {
    if (!chatListUpdate) return

    const { chatRoomId, message } = chatListUpdate

    setContacts((prev) => {
      const chatIndex = prev.findIndex((c) => c.id === chatRoomId)
      if (chatIndex === -1) return prev

      const existingChat = prev[chatIndex]

      // Determine preview text based on message type
      let messagePreview = message?.content || existingChat.message
      if (message?.type === "IMAGE") {
        messagePreview = "📷 Image"
      } else if (message?.type === "AUDIO") {
        messagePreview = "🎤 Audio message"
      }

      // Calculate unread count
      let newUnread = existingChat.unread
      if (activeChatRoomId === chatRoomId) {
        // User is in the chat, so mark as read
        newUnread = 0
      } else if (message?.senderId !== user.id) {
        // Message from someone else and user is not in chat
        if (!message?.readers?.includes(user.id)) {
          newUnread = (existingChat.unread || 0) + 1
        }
      }

      const updatedChat = {
        ...existingChat,
        message: messagePreview,
        messageType: message?.type || existingChat.messageType,
        time: message?.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : existingChat.time,
        unread: newUnread,
        updatedAt: message?.createdAt || new Date().toISOString()
      }

      // Move to top
      const newList = [...prev]
      newList.splice(chatIndex, 1)
      newList.unshift(updatedChat)

      return newList
    })
  }, [chatListUpdate, activeChatRoomId, user.id])

  // ==================== RESET UNREAD WHEN OPENING CHAT ====================
  useEffect(() => {
    if (activeChatRoomId) {
      setContacts((prev) =>
        prev.map((chat) =>
          chat.id === activeChatRoomId ? { ...chat, unread: 0 } : chat
        )
      )
    }
  }, [activeChatRoomId])

  const chatItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  return (
    <div className="flex flex-col h-[81dvh] md:h-[78dvh]">
      {/* ==================== TOP BAR ==================== */}
      <div className="flex items-center justify-between p-3 gap-2 border-b border-white/10">
        <div
          className={`flex-1 flex items-center ${
            isMobile ? "bg-black" : "bg-white/5 backdrop-blur-lg"
          } shadow-lg border border-white/10 rounded-xl gap-3 h-10 px-3 transition-all duration-200 hover:border-white/20 focus-within:border-white/30`}
        >
          <SearchIcon className="text-white/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full outline-none border-none text-sm bg-transparent text-white placeholder-white/60 transition-colors"
          />
        </div>
        <Dialog open={addMode} onOpenChange={setAddMode}>
          <DialogTrigger asChild>
            <motion.button
              className="w-8 h-8 md:w-10 md:h-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {addMode ? (
                <Minus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              ) : (
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              )}
            </motion.button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Chat</DialogTitle>
              <DialogDescription className="text-white/60">
                Search for a user to start a conversation with.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  className="col-span-3 text-white"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && getUserBySearch()}
                />
                <Button variant={"ghost"} onClick={getUserBySearch} className="text-white">
                  Search
                </Button>
              </div>
            </div>
            <div className="px-4 space-y-2 max-h-60 overflow-y-auto">
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                searchResults
                  .filter((u) => u.id !== user.id)
                  .map((u) => {
                    const isAlreadyAdded =
                      contacts.some((contact) => contact.otherUserId === u.id) ||
                      alreadyAddedIds.includes(u.id)

                    return (
                      <motion.div
                        key={u.id}
                        className="flex items-center justify-between py-2 border-b border-white/10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 md:w-11 md:h-11 flex-shrink-0">
                            <AvatarImage
                              src={u.avatar || "/placeholder.svg"}
                              alt={`${u.firstName} ${u.lastName}`}
                            />
                            <AvatarFallback className="bg-white/10 text-white font-medium text-sm md:text-base">
                              {u.firstName?.[0]}
                              {u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="font-medium text-white text-sm md:text-lg truncate">
                              {u.firstName} {u.lastName}
                            </h2>
                            <span className="text-xs text-gray-400">@{u.username}</span>
                          </div>
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-green-500 text-sm font-medium">Added</span>
                        ) : (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={() => handleAddUser(u)} size="sm">
                              Add User
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })
              ) : searchInput && searchResults.length === 0 ? (
                <p className="text-white text-sm">No users found</p>
              ) : (
                <p className="text-white/60 text-sm">Enter a name to search for users</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ==================== CHAT LIST ==================== */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
        {loading ? (
          <div className="p-4 text-center text-white/60">Loading chats...</div>
        ) : (
          <motion.div
            className="p-4 space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {contacts.length > 0 ? (
                contacts.map((chat) => (
                  <motion.div
                    key={chat.id}
                    variants={chatItemVariants}
                    layout
                    className={`flex justify-between items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                      activeChatRoomId === chat.id
                        ? "bg-white/10 border-l-4 border-blue-500"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => handleChatClick(chat.id)}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                        <AvatarFallback className="bg-gray-700 text-white font-medium">
                          {chat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white truncate text-sm">{chat.name}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-300 truncate pr-2">{chat.message}</p>
                        {chat.unread > 0 && (
                          <motion.span
                            className="bg-white text-black text-xs rounded-full px-2 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 font-medium"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            {chat.unread > 99 ? "99+" : chat.unread}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-white/60 py-8">
                  <p>No chats yet</p>
                  <p className="text-sm">Click the + button to start a conversation</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ChatList
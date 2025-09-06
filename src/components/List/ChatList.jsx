import { useState } from "react";
import { Plus, Minus, SearchIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import axios from "axios";

const ChatList = () => {
  const [addMode, setAddMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
const [alreadyAddedIds, setAlreadyAddedIds] = useState([]);
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "Jane Dane",
      message: "Hellooooo",
      avatar: "/diverse-woman-avatar.png",
      time: "10:30 AM",
      unread: 2,
    },
    {
      id: 2,
      name: "John Smith",
      message: "How are you doing?",
      avatar: "/man-avatar.png",
      time: "09:15 AM",
      unread: 0,
    },
  ]); // start with your initial mock data

  const getUserBySearch = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/users/search`,
        { params: { search: searchInput } }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Error in searching user", err);
      setSearchResults([]);
    }
  };

  const handleAddUser = (user) => {
    // Prevent duplicates
    if (!contacts.some((c) => c.id === user.id)) {
      setContacts((prev) => [
        ...prev,
        {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          message: "New chat started...",
          avatar: null,
          time: "Just now",
          unread: 0,
        },
      ]);
    }
    setAlreadyAddedIds((prev) => [...prev, user.id]);
    setAddMode(false); // close dialog after adding
  };

  return (
    <div className="flex flex-col h-[81dvh] md:h-[78dvh]">
      <div className="flex items-center justify-between p-3 gap-2 border-b border-white/10">
        <div className="flex-1 flex items-center bg-white/5 backdrop-blur-lg shadow-lg border border-white/10 rounded-xl gap-3 h-10 px-3">
          <SearchIcon className="text-white/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full outline-none border-none text-sm bg-transparent text-white placeholder-white/60"
          />
        </div>
        {/* Add new user modal */}
        <Dialog onOpenChange={setAddMode}>
          <DialogTrigger asChild>
            <button className="w-8 h-8 md:w-10 md:h-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              {addMode ? (
                <Minus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              ) : (
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
              )}
            </button>
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
                />
                <Button
                  variant={"ghost"}
                  onClick={getUserBySearch}
                  className="text-white "
                >
                  Search
                </Button>
              </div>
            </div>
            {/* Users list */}
            <div className="px-4 space-y-2 max-h-60 overflow-y-auto">
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 md:w-11 md:h-11 flex-shrink-0">
                        <AvatarFallback className="bg-white/10 text-white font-medium text-sm md:text-base">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="font-medium text-white text-sm md:text-lg truncate">
                        {user.firstName} {user.lastName}
                        <span className="text-xs text-gray-400 ml-2">
                          @{user.username}
                        </span>
                      </h2>
                    </div>
                    {alreadyAddedIds.includes(user.id) ? (
                      <span className="text-green-500 text-sm font-medium">
                        Added
                      </span>
                    ) : (
                      <Button onClick={() => handleAddUser(user)}>
                        Add User
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-white text-sm">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
        <div className="p-4 space-y-2">
          {contacts.map((chat) => (
            <div
              key={chat.id}
              className="flex justify-between items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group "
            >
              {/* Avatar */}
              <div>
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage
                    src={chat.avatar || "/placeholder.svg"}
                    alt={chat.name}
                  />
                  <AvatarFallback className="bg-gray-700 text-white font-medium">
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Chat Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-white truncate text-sm">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300 truncate pr-2">
                    {chat.message}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 font-medium">
                      {chat.unread > 99 ? "99+" : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatList;

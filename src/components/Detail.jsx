"use client"

import { ArrowDown, ArrowUp, Settings, Shield, ImageIcon, MessageSquare } from "lucide-react"
import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
//import { NavLink } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { AuthCard } from "../auth/AuthForm"
//import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"

const Detail = ({ otherUser }) => {
  const [expandedSections, setExpandedSections] = useState([])
  const { userSignOut, loading } = useContext(AuthContext)

  const userLogOut = async () => {
    try {
      const signout = await userSignOut()
      if (signout) {
        return <AuthCard />
      }
    } catch (error) {
      console.error("Error during sign out", error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const photos = [
    "/property-18.png",
    "/property-18.png",
    "/property-18.png",
    "/property-18.png",
    "/property-18.png",
    "/property-18.png",
  ]

  // Helper function to get user display info
  const getUserDisplayInfo = () => {
    if (loading) {
      return {
        name: "Loading...",
        initials: "...",
        description: "Loading user information...",
      }
    }

    if (otherUser) {
      const firstName = otherUser.firstName || ""
      const lastName = otherUser.lastName || ""
      const fullName = `${firstName} ${lastName}`.trim()

      return {
        name: fullName || "Unknown User",
        initials: `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim() || "U",
        description: otherUser.email || otherUser.username || "No additional information available.",
      }
    }

    return {
      name: "Unknown User",
      initials: "U",
      description: "No user information available.",
    }
  }

  const userInfo = getUserDisplayInfo()

  return (
    <div className="flex-1 h-full bg-white/5 backdrop-blur-lg border-l border-white/10 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
      {/* User Profile Section */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
          <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 border-white/20">
            <AvatarImage src={otherUser?.profileImage || "/avatar.png"} alt="User Avatar" />
            <AvatarFallback className="bg-white/10 text-white font-medium text-xs sm:text-sm md:text-base">
              {userInfo.initials}
            </AvatarFallback>
          </Avatar>
          <div className="px-2">
            <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg">{userInfo.name}</h3>
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xs">{userInfo.description}</p>
            {otherUser?.isOnline && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs">Online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options Sections */}
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* Chat Settings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <button
            onClick={() => toggleSection("settings")}
            className="w-full p-3 sm:p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Chat Settings</span>
            </div>
            {expandedSections.includes("settings") ? (
              <ArrowUp className="w-4 h-4 text-white/70 flex-shrink-0" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white/70 flex-shrink-0" />
            )}
          </button>
          {expandedSections.includes("settings") && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
              <div className="text-white/60 text-xs sm:text-sm space-y-2">
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Notifications</div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Theme</div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Font Size</div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy & Help */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <button
            onClick={() => toggleSection("privacy")}
            className="w-full p-3 sm:p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Privacy & Help</span>
            </div>
            {expandedSections.includes("privacy") ? (
              <ArrowUp className="w-4 h-4 text-white/70 flex-shrink-0" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white/70 flex-shrink-0" />
            )}
          </button>
          {expandedSections.includes("privacy") && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
              <div className="text-white/60 text-xs sm:text-sm space-y-2">
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Block User</div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Report</div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer">Help Center</div>
              </div>
            </div>
          )}
        </div>

        {/* Shared Photos */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <button
            onClick={() => toggleSection("photos")}
            className="w-full p-3 sm:p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Shared Photos</span>
            </div>
            {expandedSections.includes("photos") ? (
              <ArrowUp className="w-4 h-4 text-white/70 flex-shrink-0" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white/70 flex-shrink-0" />
            )}
          </button>
          {expandedSections.includes("photos") && (
            <div className="px-2 sm:px-3 md:px-4 pb-3 sm:pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {photos.map((photo, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Shared photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shared Files */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <button
            onClick={() => toggleSection("files")}
            className="w-full p-3 sm:p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">Shared Files</span>
            </div>
            {expandedSections.includes("files") ? (
              <ArrowUp className="w-4 h-4 text-white/70 flex-shrink-0" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white/70 flex-shrink-0" />
            )}
          </button>
          {expandedSections.includes("files") && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
              <div className="text-white/60 text-xs sm:text-sm space-y-2">
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">project-specs.pdf</span>
                </div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">design-mockups.zip</span>
                </div>
                <div className="p-2 hover:bg-white/5 rounded cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">meeting-notes.docx</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log out Button */}
      <div className="p-3 sm:p-4 md:p-6 border-t border-white/10 flex justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="bg-red-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm hover:bg-red-600 transition-colors w-full sm:w-auto">
              Log out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to log out?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={userLogOut}>Log out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default Detail

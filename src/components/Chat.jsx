
import { useState, useEffect, useRef } from "react"
import EmojiPicker from "emoji-picker-react"
import { Phone, Video, Info, ImageIcon, Camera, Mic, Smile, Send } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"

const Chat = () => {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")

  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji)
    setOpen(false)
  }

  const messages = [
    {
      id: 1,
      text: "Hey there! How are you doing today?",
      timestamp: "2 min ago",
      isOwn: false,
      avatar: "/john-bigman-headshot.png",
    },
    {
      id: 2,
      text: "I'm doing great, thanks for asking! Just working on some new projects.",
      timestamp: "1 min ago",
      isOwn: true,
    },
    {
      id: 3,
      text: "That sounds exciting! What kind of projects are you working on?",
      timestamp: "30 sec ago",
      isOwn: false,
      avatar: "/john-bigman-headshot.png",
    },
    {
      id: 4,
      text: "Mostly web development stuff. Building some cool chat interfaces!",
      timestamp: "3 min ago",
      isOwn: true,
    },
    {
      id: 5,
      text: "Oh cool bruh",
      timestamp: "1 min ago",
      isOwn: false,
      avatar: "/john-bigman-headshot.png",
    },
    {
      id: 6,
      text: "Nice! Let me know if you need any help.",
      timestamp: "Just now",
      isOwn: true,
    },
    {
      id: 7,
      text: "Check this image",
      timestamp: "Just now",
      isOwn: false,
      avatar: "/john-bigman-headshot.png",
      image: "/property-18.png",
    },
    {
      id: 8,
      text: "Sure! Looks great!",
      timestamp: "Just now",
      isOwn: true,
    },
  ]

  return (
    <div className="flex-1 h-full flex flex-col justify-between border-l border-r border-white/10 backdrop-blur-md bg-black/20">
      <div className="flex p-2 sm:p-4 justify-between items-center border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 ring-2 ring-white/20">
            <AvatarImage src="/john-bigman-headshot.png" alt="John Baba" />
            <AvatarFallback className="bg-white/10 text-white font-medium text-xs sm:text-base">JB</AvatarFallback>
          </Avatar>
          <div>
            <span className="text-xs sm:text-base font-semibold text-white">John Baba</span>
            <p className="text-xs sm:text-sm text-green-400 font-medium">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Video className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Info className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
        </div>
      </div>
      <div className="p-2 sm:p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 flex flex-col gap-2 sm:gap-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 sm:gap-3 ${message.isOwn ? "justify-end" : "justify-start"}`}>
            {!message.isOwn && (
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-1 ring-white/20 flex-shrink-0">
                <AvatarImage src={message.avatar || "/placeholder.svg"} alt="" />
                <AvatarFallback className="bg-white/10 text-white font-medium text-xs sm:text-base">JB</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[80%] sm:max-w-[60%] ${message.isOwn ? "order-first" : ""}`}>
              <div
                className={`p-2 sm:p-3 rounded-2xl backdrop-blur-md border ${
                  message.isOwn
                    ? "bg-white/15 text-white border-white/30 ml-auto"
                    : "bg-white/10 text-white border-white/20"
                }`}
              >
                { message.image ? (
                  <img src={message.image || "/placeholder.svg"} className="w-full object-cover" alt="images" />
                ) : (
                  ""
                )}
                <p className="text-xs sm:text-base leading-relaxed">{message.text}</p>
              </div>
              <span className={`text-xs text-white/60 mt-1 block ${message.isOwn ? "text-right" : "text-left"}`}>
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>
      <div className="flex border-t border-white/10 items-center mt-auto justify-between gap-1 sm:gap-3 p-1 sm:p-3 backdrop-blur-sm bg-white/5">
        <div className="flex gap-1 sm:gap-3">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors" />
        </div>
        <input
          type="text"
          className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 outline-none text-white p-1 sm:p-3 text-xs sm:text-base rounded-xl placeholder-white/50 focus:border-white/40 transition-colors"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="relative">
          <Smile
            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-white/70 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
          />
          {open && (
            <div className="absolute bottom-12 right-0 z-50">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button className="bg-white hover:bg-black hover:text-white ease-in text-black py-1 px-2 sm:px-4 border-none rounded-xl cursor-pointer transition-colors flex items-center gap-1 sm:gap-2">
          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-xs sm:text-sm">Send</span>
        </button>
      </div>
    </div>
  )
}

export default Chat

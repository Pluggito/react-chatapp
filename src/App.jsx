"use client"

import Chat from "./components/Chat"
import Detail from "./components/Detail"
import List from "./components/List/List"
import { AuthCard } from "./auth/AuthForm"
import { useContext, useState } from "react"
import { AuthContext } from "./context/AuthContext"
import { Toaster } from "./components/ui/sonner"
// import { useIsMobile } from "./hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader } from "./components/ui/sheet"

const App = () => {
  const { user, isLoggedIn } = useContext(AuthContext)
  const [activeChatRoomId, setActiveChatRoomId] = useState(null)
  const [activeMembers, setActiveMembers] = useState([])
  const syncUser = user
  const [openDetail, setOpenDetail] = useState(false)
  const [mobileView, setMobileView] = useState("list") // 'list' or 'chat'

  const handleMobileChatSelect = (chatId) => {
    setActiveChatRoomId(chatId)
    setMobileView("chat")
  }

  const handleBackToList = () => {
    setMobileView("list")
    setActiveChatRoomId(null)
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center text-white overflow-hidden p-2 md:p-4">
      {/*-----liquid glass sample-----*/}
      <Toaster />
      {syncUser && isLoggedIn ? (
        <main
          className="container w-[90dvw] h-[90dvh] relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-write/5 to-write/10 border border-white/20
      shadow-[0_0_30px_rgba(255,255,255,0.1)] flex md:flex-row
      md:w-[90vw] md:h-[90vh] max-w-full
      "
        >
          <div className="w-full h-full md:hidden">
            {mobileView === "list" ? (
              <List
                setActiveChatRoomId={setActiveChatRoomId}
                activeChatRoomId={activeChatRoomId}
                onChatSelect={handleMobileChatSelect}
              />
            ) : (
              <Chat
                chatId={activeChatRoomId}
                activeMembers={activeMembers}
                setActiveMembers={setActiveMembers}
                setOpenDetail={setOpenDetail}
                onBackToList={handleBackToList}
                isMobile={true}
              />
            )}
          </div>

          {/* Responsive: Desktop*/}
          <aside className="w-full hidden md:block md:w-1/4 h-full md:h-full ">
            <List
              setActiveChatRoomId={setActiveChatRoomId}
              activeChatRoomId={activeChatRoomId}
              onChatSelect={setActiveChatRoomId}
            />
          </aside>
          <div
            className={`${
              openDetail ? "md:w-2/4" : "md:w-full"
            } w-full h-full md:h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 hidden md:block `}
          >
            <Chat
              chatId={activeChatRoomId}
              activeMembers={activeMembers}
              setActiveMembers={setActiveMembers}
              setOpenDetail={setOpenDetail}
            />
          </div>
          {/* Sheet UI for Detail */}
          <Sheet open={openDetail} onOpenChange={setOpenDetail}>
            <SheetContent side="right" className="w-full sm:w-[400px] md:w-[400px] p-0 bg-black/80 border-none">
              <SheetHeader>{/* Optionally add a header or close button */}</SheetHeader>
              <Detail otherUser={activeMembers[0]} />
            </SheetContent>
          </Sheet>
        </main>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-full max-w-md">
            <AuthCard />
          </div>
        </div>
      )}
    </div>
  )
}

export default App

import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
import Chat from "./Chat";
import Detail from "./Detail";
import List from "./List/List";
import { AuthCard } from "../auth/AuthForm";

const Home = ({
  syncUser,
  activeChatRoomId,
  setActiveChatRoomId,
  activeMembers,
  setActiveMembers,
  isLoggedIn,
  setOpenDetail,
  handleBackToList,
  handleMobileChatSelect,
  mobileView,
  openDetail,
}) => {
  return (
    <>
      {syncUser && isLoggedIn ? (
        <main
          className="w-full h-full relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-write/5 to-write/10 lg:border lg:border-white/20
                    shadow-[0_0_30px_rgba(255,255,255,0.1)] flex md:flex-row overflow-hidden
                    md:w-[90vw] md:h-[90vh] max-w-full"
        >
          {/* Mobile view */}
          <div className="w-full h-full md:hidden overflow-hidden">
            {mobileView === "list" ? (
              <List
                setActiveChatRoomId={setActiveChatRoomId}
                activeChatRoomId={activeChatRoomId}
                onChatSelect={handleMobileChatSelect}
                isMobile={true}
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

          {/* Desktop View */}
          <aside className="w-full hidden md:block md:w-1/4 h-full overflow-hidden">
            <List
              setActiveChatRoomId={setActiveChatRoomId}
              activeChatRoomId={activeChatRoomId}
              onChatSelect={setActiveChatRoomId}
            />
          </aside>

          <div
            className={`${
              openDetail ? "md:w-2/4" : "md:w-full"
            } w-full h-full hidden md:flex overflow-hidden`}
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
            <SheetContent
              side="right"
              className="w-full sm:w-[400px] md:w-[400px] p-0 bg-black/80 border-none"
            >
              <SheetHeader />
              <Detail otherUser={activeMembers[0]} />
            </SheetContent>
          </Sheet>
        </main>
      ) : (
        // If not logged in, show auth card
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-full max-w-md">
            <AuthCard />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
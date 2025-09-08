import Chat from "./components/Chat";
import Detail from "./components/Detail";
import List from "./components/List/List";
import { AuthCard } from "./auth/AuthForm";
import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./hooks/use-mobile";

const App = () => {
  const { user, isLoggedIn } = useContext(AuthContext);
   const [activeChatRoomId, setActiveChatRoomId] = useState(null)
  const syncUser = user;

  return (
    <div className="bg-black min-h-screen flex items-center justify-center text-white overflow-hidden p-2 md:p-4">
      {/*-----liquid glass sample-----*/}
      <Toaster />
      {syncUser && isLoggedIn ? (
        <main
          className="container w-full h-full relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-write/5 to-write/10 border border-white/20
      shadow-[0_0_30px_rgba(255,255,255,0.1)] flex md:flex-row
      md:w-[90vw] md:h-[90vh] max-w-full
      "
        >
          {/* Responsive: Mobile */}
          <div className="w-full h-full md:hidden">
            {useIsMobile && <List />}
          </div>
          {/* Responsive: Desktop*/}
          <aside className="w-full hidden md:block md:w-1/4 h-full md:h-full ">
            <List
              setActiveChatRoomId={setActiveChatRoomId}
              activeChatRoomId={activeChatRoomId}
              onChatSelect={setActiveChatRoomId}
            />
          </aside>
          <div className="w-full md:w-2/4 h-2/4 md:h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 hidden md:block ">
            <Chat chatId={activeChatRoomId} />
          </div>
          <aside className="w-full md:w-1/4 h-1/4 md:h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30  hidden md:block ">
            <Detail />
          </aside>
        </main>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-full max-w-md">
            <AuthCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

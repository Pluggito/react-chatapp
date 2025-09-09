import { MoreHorizontal, Video, Edit3 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AlertDialog } from "../ui/alert-dialog";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";


const UserInfo = ({ user, isMobile }) => {
  const { userSignOut} = useContext(AuthContext)
 
  
    const userLogOut = async () => {
      try {
        const signout = await userSignOut();
        if (signout) {
          return <AuthCard />;
        }
      } catch (error) {
        console.error("Error during sign out", error);
      }
    };


  return (
    <>
      {user && (
        <div className={`${isMobile ? "bg-black": "bg-white/5 backdrop-blur-lg"} p-4 md:p-6 flex gap-3 items-center justify-between  border-b border-white/10 `}>
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 ">
            <Avatar className="w-9 h-9 md:w-11 md:h-11 flex-shrink-0">
              <AvatarImage
                src="/john-bigman-headshot.png"
                alt="John Bigman"
                className="object-cover"
              />
              <AvatarFallback className="bg-white/10 text-white font-medium text-sm md:text-base">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium text-white text-sm md:text-md truncate">
                {user?.firstName} {user?.lastName}
              </h2>
              <h3 className="text-white/70 text-sm md:text-md truncate ">
                @{user?.username}
              </h3>
            </div>
          </div>

          <div className=" flex items-center gap-2 md:gap-2 flex-shrink-0">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-6 h-6 md:w-7 md:h-7 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors group">
                  <MoreHorizontal className="w-4 h-4 md:w-4 md:h-4 text-white/70 group-hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white/5 backdrop-blur-lg border border-white/10">
               <DropdownMenuLabel className="text-white/70">User Options</DropdownMenuLabel>
               <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-white/10 text-white/70">Profile</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/10 text-white/70">Settings</DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-white/10 text-white/70"
                  onClick={userLogOut}
                >
                  Logout
                </DropdownMenuItem>
               </DropdownMenuGroup>
                </DropdownMenuContent>
             </DropdownMenu>
            <button className="w-6 h-6 md:w-7 md:h-7 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors group">
              <Video className="w-4 h-4 md:w-4 md:h-4 text-white/70 group-hover:text-white transition-colors" />
            </button>
           
          </div>
        </div>
      )}
    </>
  );
};

export default UserInfo;

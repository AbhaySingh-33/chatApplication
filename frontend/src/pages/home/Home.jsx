import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { selectedConversation } = useConversation();
  const { authUser } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-stretch justify-start sm:items-center sm:justify-center p-2 sm:p-0">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="flex h-[80vh] sm:h-[450px] md:h-[550px] lg:h-[600px] xl:h-[650px] rounded-lg sm:rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border-0 sm:border border-blue-300/20 shadow-2xl relative z-10 animate-slide-up w-[95%] sm:w-[95%] max-w-none sm:max-w-[1000px]">
        {/* Small screen top bar */}
        {!selectedConversation?._id && (
          <div className="sm:hidden absolute top-0 left-0 right-0 z-20 flex items-center gap-2 p-4 h-16 border-b border-blue-300/20 bg-blue-900/30 backdrop-blur-sm animate-fade-in">
            <img
              src={authUser?.profilePic || "/default-avatar.png"}
              alt={authUser?.username || "User"}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400/50 cursor-pointer hover:border-blue-400 transition-all duration-300 hover:scale-110"
              onClick={() => navigate("/profile")}
              title="Go to Profile"
            />
            <span className="font-medium text-blue-100 text-base">{authUser?.username}</span>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${
            selectedConversation?._id ? "hidden sm:flex" : "flex"
          } w-full sm:w-[350px] h-full flex-col overflow-hidden animate-fade-in-left ${
            !selectedConversation?._id ? "pt-16 sm:pt-0" : ""
          }`}
        >
          <Sidebar />
        </div>

        {/* MessageContainer */}
        <div
          className={`${
            selectedConversation?._id ? "flex " : "hidden sm:flex"
          } w-full flex-1 animate-fade-in-right`}
        >
          <MessageContainer />
        </div>
      </div>
    </div>
  );
};
export default Home;
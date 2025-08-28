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
    <div className="flex sm:h-[450px] md:h-[550px] rounded-lg overflow-hidden bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0 w-full">
      <div className="flex flex-col sm:flex">
        {/* Small screen top bar (hide if conversation selected) */}
        {!selectedConversation?._id && (
          <div className="sm:hidden flex items-center gap-3 p-3 border-b bg-gray-700 shadow-md">
            <img
              src={authUser?.profilePic || "/default-avatar.png"}
              alt={authUser?.username || "User"}
              className="w-10 h-10 rounded-full object-cover border"
              onClick={() => navigate("/profile")}
              title="Go to Profile"
            />
            <span className="font-medium">{authUser?.username}</span>
          </div>
        )}

        {/* Sidebar: hide on small screens if a conversation is selected */}
        <div
          className={`${
            selectedConversation?._id ? "hidden sm:flex" : "flex"
          } w-full sm:w-[95%]`}
        >
          <Sidebar />
        </div>
      </div>

      {/* MessageContainer: show only if a conversation is selected, or always on large screens */}
      <div
        className={`${
          selectedConversation?._id ? "flex " : "hidden sm:flex"
        } w-full sm:w-[85%]`}
      >
        <MessageContainer />
      </div>
    </div>
  );
};
export default Home;

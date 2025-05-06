import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import useConversation from "../../zustand/useConversation";

const Home = () => {
	
	const { selectedConversation } = useConversation();

	return (
		<div className='flex sm:h-[450px] md:h-[550px] rounded-lg overflow-hidden bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0 w-full'>

		{/* Sidebar: hide on small screens if a conversation is selected */}
		<div className={`${selectedConversation?._id ? "hidden sm:flex" : "flex"} w-full sm:w-[35%]`}>
		  <Sidebar />
		</div>
  
		{/* MessageContainer: show only if a conversation is selected, or always on large screens */}
		<div className={`${selectedConversation?._id ? "flex " : "hidden sm:flex"} w-full sm:w-[65%]`}>
		  <MessageContainer />
		</div>
  
	  </div>
	);
};
export default Home;
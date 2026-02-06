import { useState } from "react";
import { BsRobot } from "react-icons/bs";
import useConversation from "../../zustand/useConversation";
import useAIChat from "../../hooks/useAIChat";
import toast from "react-hot-toast";

const AIAssistant = () => {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { getAIConversation, getAIMessages } = useAIChat();
  const [loading, setLoading] = useState(false);

  const handleSelectAI = async () => {
    setLoading(true);
    try {
      await getAIConversation(); // Ensure conversation exists
      
      // Set special conversation object for AI
      setSelectedConversation({
        _id: "65c0c0c0c0c0c0c0c0c0c0c0", // Matches backend AI ObjectId
        username: "AI Assistant",
        fullName: "AI Assistant",
        profilePic: "https://avatar.iran.liara.run/public/job/operator/male", // Use a generic avatar
        isAI: true,
      });
      
      await getAIMessages();
    } catch (error) {
      toast.error("Failed to open AI chat");
    } finally {
      setLoading(false);
    }
  };

  const isSelected = selectedConversation?._id === "65c0c0c0c0c0c0c0c0c0c0c0";

  return (
    <div
      onClick={handleSelectAI}
      className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
        ${isSelected ? "bg-sky-500" : ""} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className={`avatar online`}>
        <div className='w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
            <div className="w-full h-full flex items-center justify-center bg-indigo-600">
                <BsRobot className="text-white text-2xl w-full h-full p-2" />
            </div>
        </div>
      </div>

      <div className='flex flex-col flex-1'>
        <div className='flex gap-3 justify-between'>
          <p className='font-bold text-gray-200'>AI Assistant</p>
          <span className='text-xl'>🤖</span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

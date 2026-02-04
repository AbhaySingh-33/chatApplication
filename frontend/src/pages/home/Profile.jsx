import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import MessageContainer from "../../components/messages/MessageContainer";
import useConversation from "../../zustand/useConversation";

const Profile = () => {
  const { authUser, socket, setAuthUser } = useAuthContext();
  const { logout } = useLogout();
  const { selectedConversation, setSelectedConversation } = useConversation();
  const [friends, setFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(authUser.username);
  const [editProfilePic, setEditProfilePic] = useState(authUser.profilePic);

  const handleUpdateProfile = async () => {
    try {
      let profilePicUrl = authUser.profilePic;
      if (editProfilePic && typeof editProfilePic !== "string") {
        profilePicUrl = await uploadToCloudinary(editProfilePic);
      }

      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`,
        { username: editUsername, profilePic: profilePicUrl },
        { withCredentials: true }
      );

      localStorage.setItem("chat-user", JSON.stringify(res.data));
      setAuthUser(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_NAME
      }/image/upload`,
      { method: "POST", body: data }
    );
    const json = await res.json();
    return json.secure_url;
  };

  const fetchFriends = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/list`,
        { withCredentials: true }
      );
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/${friendId}`,
        { withCredentials: true }
      );
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      if (selectedConversation?._id === friendId) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  useEffect(() => {
    fetchFriends();
    if (socket) {
      socket.on("friend:added", () => fetchFriends());
    }
    return () => socket?.off("friend:added");
  }, [socket]);

  return (
    <div className="flex items-center justify-center h-screen p-2 sm:p-0">
      <div className="flex w-[95%] sm:w-full max-w-5xl h-[80vh] sm:h-[450px] md:h-[550px] lg:h-[600px] xl:h-[650px] rounded-lg sm:rounded-2xl overflow-hidden shadow-2xl backdrop-blur-lg">
        {/* Sidebar */}
        <div
          className={`w-full sm:w-[35%] bg-white/90 flex flex-col border-r border-gray-200
            ${selectedConversation?._id ? "hidden" : "flex"} sm:flex`}
        >
          {/* Profile Section - Fixed */}
          <div className="flex flex-col items-center p-1.5 sm:p-6 border-b border-gray-200">
            <img
              src={isEditing ? editProfilePic : authUser.profilePic}
              alt="user avatar"
              className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-4 border-blue-500 shadow-md"
            />

            {isEditing ? (
              <>
                <input
                  type="text"
                  className="mt-2 sm:mt-4 border rounded px-2 py-0.5 w-full text-gray-700 text-sm"
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  title="Update your username"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 sm:mt-4 py-1 w-full text-xs sm:text-sm bg-gray-700 cursor-pointer"
                  onChange={(e) => setEditProfilePic(e.target.files[0])}
                  title="Update your profile picture"
                />

                <div className="flex gap-2 mt-2 sm:mt-3">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditUsername(authUser.username);
                      setEditProfilePic(authUser.profilePic);
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-1 sm:mt-4 text-sm sm:text-xl font-semibold text-gray-800">
                  {authUser.username}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-1 sm:mt-2 px-2 py-0.5 sm:px-4 bg-blue-500 text-white text-xs sm:text-sm rounded hover:bg-blue-600 cursor-pointer"
                >
                  Edit Profile
                </button>
              </>
            )}

            <button
              onClick={logout}
              className="mt-1 sm:mt-4 px-2 py-1 sm:px-4 sm:py-2 bg-red-500 text-white text-xs sm:text-sm rounded-md hover:bg-red-600 w-full cursor-pointer"
            >
              Log Out
            </button>
          </div>

          {/* Friends List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-6">
            <h2 className="text-sm sm:text-lg font-bold mb-1 sm:mb-3 text-gray-700">
              Your Friends
            </h2>
            <ul className="space-y-1 sm:space-y-2 pr-1 sm:pr-2">
              {friends.map((friend) => (
                <li
                  key={friend._id}
                  className={`rounded-lg p-1.5 sm:p-3 shadow-sm transition cursor-pointer ${
                    selectedConversation?._id === friend._id
                      ? "bg-blue-100"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedConversation(friend)}
                >
                  <div className="flex items-center justify-between gap-x-2 sm:gap-x-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src={friend.profilePic}
                        alt={friend.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm"
                      />
                      <span className="text-gray-800 font-medium text-sm sm:text-base truncate">
                        {friend.username}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend._id);
                      }}
                      className="text-red-500 hover:text-red-700 cursor-pointer text-sm sm:text-base"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`${
            selectedConversation?._id ? "flex" : "hidden sm:flex"
          } flex-1 flex flex-col`}
        >
          <MessageContainer />
        </div>
      </div>
    </div>
  );
};

export default Profile;

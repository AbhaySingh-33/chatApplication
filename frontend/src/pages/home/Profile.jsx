import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MessageContainer from "../../components/messages/MessageContainer";
import useConversation from "../../zustand/useConversation";

const Profile = () => {
  const { authUser, socket, setAuthUser } = useAuthContext();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const { selectedConversation, setSelectedConversation, friends, setFriends } = useConversation();
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(authUser.username);
  const [editProfilePic, setEditProfilePic] = useState(authUser.profilePic);

  const fetchFriends = useCallback(async (force = false) => {
    // Cache Check: If friends exist in Zustand and invalidation isn't forced, skip API
    if (friends.length > 0 && !force) {
        return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/list`,
        { withCredentials: true }
      );
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  }, [friends.length, setFriends]);

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

  const handleRemoveFriend = async (friendId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/${friendId}`,
        { withCredentials: true }
      );
      
      // ✅ Invalidate cache to force re-fetch
      fetchFriends(true);
      
      // ✅ Update Global Auth Context
      const updatedFriends = authUser.friends.filter(id => 
          (typeof id === 'object' ? id._id : id) !== friendId
      );
      const updatedUser = { ...authUser, friends: updatedFriends };
      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);

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
      // ✅ Force refresh when:
      // 1. I accept a request (handled via cache invalidation / state update elsewhere usually, but safety net)
      // 2. Someone accepts MY request (backend emits 'friendRequestAccepted')
      // 3. Someone removes me (backend emits 'friendRemoved')
      socket.on("friendRequestAccepted", () => fetchFriends(true));
      socket.on("friendRemoved", () => fetchFriends(true));
    }
    return () => {
        socket?.off("friendRequestAccepted");
        socket?.off("friendRemoved");
    };
  }, [socket, fetchFriends]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-2 sm:p-4">
      {/* Professional Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Back to Home</span>
      </button>
      
      <div className="flex w-[95%] sm:w-full max-w-5xl h-[80vh] sm:h-[450px] md:h-[550px] lg:h-[600px] xl:h-[650px] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10">
        {/* Sidebar */}
        <div
          className={`w-full sm:w-[35%] bg-white/5 backdrop-blur-sm flex flex-col border-r border-white/10
            ${selectedConversation?._id ? "hidden" : "flex"} sm:flex`}
        >
          {/* Profile Section - Fixed */}
          <div className="flex flex-col items-center p-1.5 sm:p-6 border-b border-white/10 bg-white/5">
            <img
              src={isEditing ? editProfilePic : authUser.profilePic}
              alt="user avatar"
              className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-4 border-gradient-to-r from-blue-500 to-purple-500 shadow-xl ring-4 ring-blue-100/50"
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
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-700 cursor-pointer shadow-lg transition-all duration-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditUsername(authUser.username);
                      setEditProfilePic(authUser.profilePic);
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 cursor-pointer shadow-lg transition-all duration-300"
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
                  className="mt-1 sm:mt-2 px-2 py-0.5 sm:px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm rounded-lg hover:from-blue-600 hover:to-purple-700 cursor-pointer shadow-lg transition-all duration-300"
                >
                  Edit Profile
                </button>
              </>
            )}

            <button
              onClick={logout}
              className="mt-1 sm:mt-4 px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs sm:text-sm rounded-lg hover:from-red-600 hover:to-pink-700 w-full cursor-pointer shadow-lg transition-all duration-300"
            >
              Log Out
            </button>
          </div>

          {/* Friends List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-6">
            <h2 className="text-sm sm:text-lg font-bold mb-1 sm:mb-3 text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Friends
            </h2>
            <ul className="space-y-1 sm:space-y-2 pr-1 sm:pr-2">
              {friends.map((friend) => (
                <li
                  key={friend._id}
                  className={`rounded-xl p-1.5 sm:p-3 shadow-lg transition-all duration-300 cursor-pointer border border-white/20 ${
                    selectedConversation?._id === friend._id
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 shadow-xl"
                      : "bg-white/80 hover:bg-white/90 hover:shadow-xl hover:scale-[1.02]"
                  }`}
                  onClick={() => setSelectedConversation(friend)}
                >
                  <div className="flex items-center justify-between gap-x-2 sm:gap-x-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src={friend.profilePic}
                        alt={friend.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg ring-2 ring-blue-200/50"
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
                      className="text-red-500 hover:text-red-700 cursor-pointer text-sm sm:text-base hover:bg-red-50 rounded-full p-1 transition-all duration-300"
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
          } flex-1 flex flex-col bg-white/5 backdrop-blur-sm`}
        >
          <MessageContainer />
        </div>
      </div>
    </div>
  );
};

export default Profile;

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
    <div className="flex items-center justify-center  p-2 ">
      <div className="flex flex-col sm:flex-row w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl  backdrop-blur-lg">
        {/* Sidebar */}
        <div
          className={`w-full sm:w-[35%] bg-white/90 p-6 flex flex-col border-r border-gray-200
            ${selectedConversation?._id ? "hidden" : "flex"} sm:flex`}
        >
          {/* Profile */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={isEditing ? editProfilePic : authUser.profilePic}
              alt="user avatar"
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-md"
            />

            {isEditing ? (
              <>
                <input
                  type="text"
                  className="mt-4 border rounded px-2 py-0.5 w-full text-gray-700"
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-4 py-1 w-full text-sm bg-gray-700"
                  onChange={(e) => setEditProfilePic(e.target.files[0])}
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditUsername(authUser.username);
                      setEditProfilePic(authUser.profilePic);
                    }}
                    className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">
                  {authUser.username}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Edit Profile
                </button>
              </>
            )}

            <button
              onClick={logout}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 w-full"
            >
              Log Out
            </button>
          </div>

          {/* Friends */}
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold mb-3 text-gray-700">
              Your Friends
            </h2>
            <ul className="space-y-2 pr-2">
              {friends.map((friend) => (
                <li
                  key={friend._id}
                  className={`rounded-lg p-3 shadow-sm transition cursor-pointer ${
                    selectedConversation?._id === friend._id
                      ? "bg-blue-100"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedConversation(friend)}
                >
                  <div className="flex items-center justify-between gap-x-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={friend.profilePic}
                        alt={friend.username}
                        className="w-10 h-10 rounded-full shadow-sm"
                      />
                      <span className="text-gray-800 font-medium">
                        {friend.username}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend._id);
                      }}
                      className="text-red-500 hover:text-red-700 "
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
          {/* Chat Header (only on mobile) */}
          <div className="flex sm:hidden items-center justify-between bg-gray-800 text-white px-4 py-2 shadow-md sticky top-0 z-10">
            <div className="flex gap-3">
              <button onClick={() => setSelectedConversation(null)}>❌</button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto">
            <MessageContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

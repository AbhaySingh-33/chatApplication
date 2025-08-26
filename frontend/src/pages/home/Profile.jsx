import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import MessageContainer from "../../components/messages/MessageContainer";
import useConversation from "../../zustand/useConversation";

const Profile = () => {
  const { authUser, socket } = useAuthContext();
  const { logout } = useLogout();
  const { selectedConversation, setSelectedConversation } = useConversation();
  const [friends, setFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(authUser.username);
  const [editProfilePic, setEditProfilePic] = useState(authUser.profilePic);

  // Optional: Update global auth context if you use one
  const { setAuthUser } = useAuthContext();

  const handleUpdateProfile = async () => {
    try {
      let profilePicUrl = authUser.profilePic;

      // If a new image is selected
      if (editProfilePic && typeof editProfilePic !== "string") {
        profilePicUrl = await uploadToCloudinary(editProfilePic);
      }

      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`, {
        username: editUsername,
        profilePic: profilePicUrl,
      },{ withCredentials: true });

      localStorage.setItem("chat-user", JSON.stringify(res.data));
      setAuthUser(res.data); // this updates context

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
      {
        method: "POST",
        body: data,
      }
    );
    const json = await res.json();
    return json.secure_url;
  };

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/friends/list`,{ withCredentials: true });
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/friends/${friendId}`,{ withCredentials: true });
      // Remove from local state
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      if (selectedConversation?._id === friendId) {
        setSelectedConversation(null); // reset if removed friend was selected
      }
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  useEffect(() => {
    fetchFriends();

    if (socket) {
      socket.on("friend:added", ({ from }) => {
        fetchFriends();
      });
    }

    return () => {
      socket?.off("friend:added");
    };
  }, [socket]);

  return (
    <div className="flex flex-col sm:flex-row w-full">
      {/* Sidebar */}
      <div className="w-full sm:w-[35%] bg-gray-50 p-6 overflow-y-auto">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={isEditing ? editProfilePic : authUser.profilePic}
            alt="user avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-500"
          />

          {isEditing ? (
            <>
              <input
                type="text"
                className="mt-4 border rounded px-2 py-1 w-full text-black"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username"
              />
              <input
                type="file"
                accept="image/*"
                className="mt-2 border rounded px-2 py-1 w-full text-black"
                onChange={(e) => setEditProfilePic(e.target.files[0])}
                title="Profile Picture"
              />
              {editProfilePic && (
                <img
                  src={
                    typeof editProfilePic === "string"
                      ? editProfilePic
                      : URL.createObjectURL(editProfilePic)
                  }
                  alt="preview"
                  className="mt-2 w-24 h-24 rounded-full object-cover"
                />
              )}

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
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
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
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Log Out
          </button>
        </div>

        {/* Friends List */}
        <div>
          <h2 className="text-lg font-bold mb-3 text-gray-700">Your Friends</h2>
          <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
            {friends.map((friend) => (
              <li
                key={friend._id}
                className={`bg-white shadow-sm rounded-lg p-3 transition ${
                  selectedConversation?._id === friend._id ? "bg-blue-200" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => setSelectedConversation(friend)}
                  >
                    <img
                      src={friend.profilePic}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-gray-800 font-medium">
                      {friend.username}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend._id)}
                    className="ml-4 text-red-500 hover:text-red-700 text-lg"
                    title="Remove Friend"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat Message Panel */}
      <div
        className={`${
          selectedConversation?._id ? "flex" : "hidden sm:flex"
        } w-full sm:w-[65%]`}
      >
        <MessageContainer />
      </div>
    </div>
  );
};

export default Profile;

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(authUser.fullName);
  const [editUsername, setEditUsername] = useState(authUser.username);
  const [editProfilePic, setEditProfilePic] = useState(authUser.profilePic);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState(null);

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
      setIsLoading(true);
      let profilePicUrl = authUser.profilePic;
      if (editProfilePic && typeof editProfilePic !== "string") {
        profilePicUrl = await uploadToCloudinary(editProfilePic);
      }

      const updateData = { fullName: editFullName, username: editUsername, profilePic: profilePicUrl };
      
      // Update password if provided
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          alert("New passwords don't match!");
          setIsLoading(false);
          return;
        }
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/update-profile`,
        updateData,
        { withCredentials: true }
      );

      localStorage.setItem("chat-user", JSON.stringify(res.data));
      setAuthUser(res.data);
      setIsDialogOpen(false);
      setPreviewImage(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update failed:", err);
      alert(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
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
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      setRemovingFriendId(friendId);
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/${friendId}`,
        { withCredentials: true }
      );
      
      fetchFriends(true);
      
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
      alert("Failed to remove friend");
    } finally {
      setRemovingFriendId(null);
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
      {/* Edit Profile Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={previewImage || authUser.profilePic}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-xl"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
                <p className="text-xs text-black/60 mt-2">Click to change photo</p>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-black mb-3">Change Password (Optional)</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black placeholder-gray-400"
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black placeholder-gray-400"
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black placeholder-gray-400"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditFullName(authUser.fullName);
                    setEditUsername(authUser.username);
                    setEditProfilePic(authUser.profilePic);
                    setPreviewImage(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-gray-200 text-black font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
          <div className="flex flex-col items-center p-4 sm:p-6 border-b border-white/10 bg-gradient-to-br from-white/10 to-white/5">
            <div className="relative">
              <img
                src={authUser.profilePic}
                alt="Profile"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white/20 shadow-2xl ring-4 ring-purple-500/30"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white/20 shadow-lg"></div>
            </div>
            
            <div className="text-center mt-4 space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{authUser.fullName}</h2>
              <p className="text-sm text-white/60">@{authUser.username}</p>
              <p className="text-xs text-white/50">{authUser.email}</p>
            </div>

            <button
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>

            <button
              onClick={logout}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
                      disabled={removingFriendId === friend._id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm hover:bg-red-50 rounded-lg px-2 py-1 transition-all duration-300 font-medium"
                    >
                      {removingFriendId === friend._id ? "..." : "Remove"}
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

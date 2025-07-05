import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";

const Profile = () => {


  const { authUser } = useAuthContext();
  const {logout}= useLogout();

  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="rounded-lg p-6 w-50">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div className="flex items-center mb-4">
          <img
              src={authUser.profilePic}
              alt="user avatar"
              className="rounded-full"
            />
        </div>
        <div className="bg-white rounded-2xl shadow-lg px-8 py-3 flex flex-col items-center justify-center">
            <h3 className="text-lg text-black font-semibold"> {authUser.username} </h3>
          </div>
        </div> 

         <div className="">
        <button
          onClick={logout}
          className="btn bg-red-500"
        >
          Log Out
        </button>
      </div>

      

      </div>
  );
};

export default Profile;

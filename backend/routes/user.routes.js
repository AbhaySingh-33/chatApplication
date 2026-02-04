import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { 
    getFriends, 
    removeFriend, 
    updateProfile, 
    getUsersForSidebar,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.post("/send-request", protectRoute, sendFriendRequest);
router.post("/accept-request", protectRoute, acceptFriendRequest);
router.post("/reject-request", protectRoute, rejectFriendRequest);
router.get("/notifications", protectRoute, getFriendRequests);

router.get("/list", protectRoute, getFriends);
router.delete("/:friendId", protectRoute, removeFriend );
router.put("/update-profile", protectRoute, updateProfile );


export default router;

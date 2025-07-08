import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { addFriend, getFriends, removeFriend, updateProfile, getUsersForSidebar } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.post("/add", protectRoute, addFriend);
router.get("/list", protectRoute, getFriends);
router.delete("/:friendId", protectRoute, removeFriend );
router.put("/update-profile", protectRoute, updateProfile );


export default router;
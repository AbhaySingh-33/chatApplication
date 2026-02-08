import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
  addGroupMember,
  createGroup,
  demoteGroupAdmin,
  getGroupDetails,
  getGroupMessages,
  getUserGroups,
  muteGroupMember,
  promoteGroupAdmin,
  removeGroupMember,
  sendGroupMessage,
  unmuteGroupMember,
  updateGroupSettings,
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserGroups);
router.post("/", protectRoute, createGroup);
router.get("/:groupId", protectRoute, getGroupDetails);
router.patch("/:groupId/settings", protectRoute, updateGroupSettings);

router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);

router.post("/:groupId/members", protectRoute, addGroupMember);
router.delete("/:groupId/members/:memberId", protectRoute, removeGroupMember);

router.post("/:groupId/admins", protectRoute, promoteGroupAdmin);
router.delete("/:groupId/admins/:memberId", protectRoute, demoteGroupAdmin);

router.post("/:groupId/mute", protectRoute, muteGroupMember);
router.delete("/:groupId/mute/:memberId", protectRoute, unmuteGroupMember);

export default router;

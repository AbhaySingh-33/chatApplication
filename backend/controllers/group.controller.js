import mongoSanitize from "express-mongo-sanitize";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import {evaluateGroupMessage, trackFloodScore } from "../utils/groupModerator.js";

const isMember = (group, userId) => {
  return group.members?.some((member) => {
    const id = member._id || member;
    return id.toString() === userId.toString();
  });
};

const isAdmin = (group, userId) => {
  return group.admins?.some((admin) => {
    const id = admin._id || admin;
    return id.toString() === userId.toString();
  });
};

const pruneExpiredMutes = (group) => {
  const now = Date.now();
  const before = group.mutedUsers?.length || 0;
  group.mutedUsers = (group.mutedUsers || []).filter(
    (entry) => entry.mutedUntil && entry.mutedUntil.getTime() > now
  );
  return before !== group.mutedUsers.length;
};

const getMemberState = (group, userId) => {
  const entry = group.memberStates?.find(
    (state) => state.userId?.toString() === userId.toString()
  );
  if (entry) return entry;
  const newState = { userId, warnings: 0, strikes: 0, lastWarningAt: null };
  group.memberStates = [...(group.memberStates || []), newState];
  return newState;
};

const formatGroupMessage = (msg, sender) => ({
  _id: msg._id,
  groupId: msg.groupId,
  senderId: msg.senderId,
  sender: sender
    ? {
        _id: sender._id,
        username: sender.username,
        fullName: sender.fullName,
        profilePic: sender.profilePic,
      }
    : null,
  message: msg.message,
  media: msg.media,
  replyTo: msg.replyTo || null,
  reactions: msg.reactions || [],
  moderation: msg.moderation || { status: "clean", action: "none" },
  system: msg.system || false,
  systemEvent: msg.systemEvent || "",
  systemPayload: msg.systemPayload || null,
  createdAt: msg.createdAt,
});

const emitToGroup = (groupId, event, payload) => {
  io.to(`group:${groupId}`).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  const socketId = getReceiverSocketId(userId);
  if (socketId) io.to(socketId).emit(event, payload);
};

export const createGroup = async (req, res) => {
  try {
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { name, description, memberIds = [] } = sanitizedBody;
    const userId = req.user._id;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: "Group name must be at least 3 characters." });
    }

    const uniqueIds = Array.from(
      new Set([userId.toString(), ...memberIds.map((id) => id.toString())])
    );

    const existingUsers = await User.find({ _id: { $in: uniqueIds } })
      .select("_id")
      .lean();
    const validIds = existingUsers.map((u) => u._id.toString());

    const group = await Group.create({
      name: name.trim(),
      description: description || "",
      createdBy: userId,
      members: validIds,
      admins: [userId],
    });

    const groupSummary = {
      _id: group._id,
      name: group.name,
      description: group.description,
      membersCount: group.members.length,
      admins: group.admins,
      isAdmin: true,
      updatedAt: group.updatedAt,
    };

    group.members
      .filter((id) => id.toString() !== userId.toString())
      .forEach((memberId) => {
        emitToUser(memberId, "groupAdded", groupSummary);
      });

    res.status(201).json(groupSummary);
  } catch (error) {
    console.error("Error creating group:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = groups.map((group) => ({
      _id: group._id,
      name: group.name,
      description: group.description,
      membersCount: group.members?.length || 0,
      admins: group.admins || [],
      isAdmin: isAdmin(group, userId),
      updatedAt: group.updatedAt,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching groups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members", "username fullName profilePic")
      .populate("admins", "username fullName profilePic")
      .populate("mutedUsers.userId", "username fullName profilePic")
      .lean();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!isMember(group, userId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.status(200).json({
      _id: group._id,
      name: group.name,
      description: group.description,
      members: group.members || [],
      admins: group.admins || [],
      settings: group.settings || {},
      mutedUsers: group.mutedUsers || [],
      isAdmin: isAdmin(group, userId),
      createdBy: group.createdBy,
      updatedAt: group.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching group details:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { settings } = sanitizedBody;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    group.settings = { ...group.settings, ...(settings || {}) };
    await group.save();

    emitToGroup(groupId, "groupSettingsUpdated", group.settings);
    res.status(200).json({ settings: group.settings });
  } catch (error) {
    console.error("Error updating group settings:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { memberId } = sanitizedBody;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    const user = await User.findById(memberId).select("_id username fullName profilePic");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!isMember(group, memberId)) {
      group.members.push(memberId);
      await group.save();
    }

    const payload = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
    };

    // Make the user join the socket room immediately if online
    const socketId = getReceiverSocketId(memberId);
    if (socketId) {
       const socket = io.sockets.sockets.get(socketId);
       if (socket) socket.join(`group:${groupId}`);
    }

    emitToGroup(groupId, "groupMemberAdded", { groupId, member: payload });
    emitToUser(memberId, "groupAdded", {
      _id: group._id,
      name: group.name,
      description: group.description,
      membersCount: group.members.length,
      admins: group.admins,
      isAdmin: false,
      updatedAt: group.updatedAt,
    });

    res.status(200).json({ member: payload });
  } catch (error) {
    console.error("Error adding group member:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isSelf = memberId.toString() === userId.toString();
    if (!isSelf && !isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    if (!isMember(group, memberId)) {
      return res.status(404).json({ error: "Member not in group" });
    }

    const isTargetAdmin = isAdmin(group, memberId);
    if (isTargetAdmin && group.admins.length === 1) {
      return res.status(400).json({ error: "Group must have at least one admin." });
    }

    group.members = group.members.filter((id) => id.toString() !== memberId.toString());
    group.admins = group.admins.filter((id) => id.toString() !== memberId.toString());
    group.mutedUsers = (group.mutedUsers || []).filter(
      (entry) => entry.userId?.toString() !== memberId.toString()
    );
    group.memberStates = (group.memberStates || []).filter(
      (entry) => entry.userId?.toString() !== memberId.toString()
    );

    await group.save();

    emitToGroup(groupId, "groupMemberRemoved", { groupId, memberId });
    emitToUser(memberId, "groupRemoved", { groupId });

    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    console.error("Error removing group member:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const promoteGroupAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { memberId } = sanitizedBody;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    if (!isMember(group, memberId)) {
      return res.status(404).json({ error: "Member not in group" });
    }

    if (!isAdmin(group, memberId)) {
      group.admins.push(memberId);
      await group.save();
    }

    emitToGroup(groupId, "groupAdminUpdated", { groupId, memberId, isAdmin: true });
    res.status(200).json({ message: "Member promoted to admin" });
  } catch (error) {
    console.error("Error promoting admin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const demoteGroupAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    if (!isAdmin(group, memberId)) {
      return res.status(400).json({ error: "Member is not an admin" });
    }

    if (group.admins.length === 1) {
      return res.status(400).json({ error: "Group must have at least one admin." });
    }

    group.admins = group.admins.filter((id) => id.toString() !== memberId.toString());
    await group.save();

    emitToGroup(groupId, "groupAdminUpdated", { groupId, memberId, isAdmin: false });
    res.status(200).json({ message: "Admin demoted" });
  } catch (error) {
    console.error("Error demoting admin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const muteGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { memberId, minutes = 10, reason = "Muted by admin" } = sanitizedBody;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    if (!isMember(group, memberId)) {
      return res.status(404).json({ error: "Member not in group" });
    }

    const mutedUntil = new Date(Date.now() + Number(minutes) * 60 * 1000);
    group.mutedUsers = (group.mutedUsers || []).filter(
      (entry) => entry.userId?.toString() !== memberId.toString()
    );
    group.mutedUsers.push({ userId: memberId, mutedUntil, reason, by: userId });
    await group.save();

    emitToGroup(groupId, "groupUserMuted", {
      groupId,
      memberId,
      mutedUntil,
      reason,
      by: userId,
    });
    emitToUser(memberId, "groupModerationNotice", {
      groupId,
      action: "muted",
      mutedUntil,
      reason,
    });

    res.status(200).json({ mutedUntil });
  } catch (error) {
    console.error("Error muting member:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unmuteGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isAdmin(group, userId)) {
      return res.status(403).json({ error: "Admin permissions required" });
    }

    group.mutedUsers = (group.mutedUsers || []).filter(
      (entry) => entry.userId?.toString() !== memberId.toString()
    );
    await group.save();

    emitToGroup(groupId, "groupUserUnmuted", { groupId, memberId });
    emitToUser(memberId, "groupModerationNotice", {
      groupId,
      action: "unmuted",
    });

    res.status(200).json({ message: "Member unmuted" });
  } catch (error) {
    console.error("Error unmuting member:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).select("members").lean();
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isMember(group, userId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await GroupMessage.find({ groupId })
      .sort({ createdAt: 1 })
      .lean();

    const senderIds = messages
      .map((msg) => msg.senderId)
      .filter(Boolean)
      .map((id) => id.toString());
    const uniqueSenderIds = Array.from(new Set(senderIds));
    const senders = await User.find({ _id: { $in: uniqueSenderIds } })
      .select("username fullName profilePic")
      .lean();
    const senderMap = new Map(
      senders.map((sender) => [sender._id.toString(), sender])
    );

    const formatted = messages.map((msg) =>
      formatGroupMessage(msg, senderMap.get(msg.senderId?.toString()))
    );

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching group messages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { text, media, replyTo } = sanitizedBody;

    if (!text && !media) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!isMember(group, userId)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const hasChanges = pruneExpiredMutes(group);
    if (hasChanges) await group.save();

    const muteEntry = group.mutedUsers?.find(
      (entry) => entry.userId?.toString() === userId.toString()
    );
    if (muteEntry && muteEntry.mutedUntil && muteEntry.mutedUntil > new Date()) {
      return res.status(403).json({
        error: "You are temporarily muted.",
        mutedUntil: muteEntry.mutedUntil,
        reason: muteEntry.reason,
      });
    }

    const newMessage = new GroupMessage({
      groupId,
      senderId: userId,
      message: text || "",
      media: media || null,
      replyTo: replyTo
        ? { messageId: replyTo.messageId, text: replyTo.message, senderId: replyTo.senderId }
        : null,
    });

    await newMessage.save();

    const sender = await User.findById(userId).select(
      "username fullName profilePic"
    );
    const payload = formatGroupMessage(newMessage, sender);

    emitToGroup(groupId, "groupMessage", payload);
    res.status(201).json(payload);

    setImmediate(async () => {
      try {
        const floodCount = trackFloodScore({
          groupId: groupId.toString(),
          userId: userId.toString(),
        });

        const settings = group.settings || {};
        const evaluation = await evaluateGroupMessage({
          text: text || "",
          groupTopic: group.description || group.name,
          floodCount,
          floodLimit: settings.floodLimitPerMinute || settings.spamLimitPerMinute,
          aiEnabled: settings.aiModeratorEnabled !== false,
        });

        if (
          evaluation.action === "none" &&
          (!evaluation.flags || evaluation.flags.length === 0)
        ) {
          return;
        }

        const shouldBlock =
          evaluation.scores.toxicity >= 0.9 ||
          evaluation.scores.spam >= 0.95;

        const moderationUpdate = {
          status: shouldBlock ? "blocked" : "flagged",
          flags: evaluation.flags,
          action:
            evaluation.action === "highlight"
              ? "highlighted"
              : evaluation.action === "mute"
              ? "muted"
              : evaluation.action === "warn"
              ? "warned"
              : "none",
          toxicityScore: evaluation.scores.toxicity,
          spamScore: evaluation.scores.spam,
          offTopicScore: evaluation.scores.offTopic,
          qualityScore: evaluation.scores.quality,
          note: evaluation.note,
          reviewedAt: new Date(),
          highlighted:
            evaluation.action === "highlight" &&
            settings.highlightQuality !== false,
        };

        await GroupMessage.findByIdAndUpdate(newMessage._id, {
          $set: { moderation: moderationUpdate },
        });

        emitToGroup(groupId, "groupMessageUpdated", {
          messageId: newMessage._id,
          moderation: moderationUpdate,
        });

        if (evaluation.action === "highlight" && moderationUpdate.highlighted) {
          return;
        }

        if (evaluation.action === "warn" || evaluation.action === "mute") {
          const state = getMemberState(group, userId);
          state.warnings += 1;
          state.lastWarningAt = new Date();

          if (
            evaluation.action === "mute" ||
            (group.settings?.autoMuteEnabled !== false &&
              state.warnings >= (group.settings?.warnThreshold || 2))
          ) {
            const minutes = group.settings?.autoMuteMinutes || 10;
            const mutedUntil = new Date(Date.now() + minutes * 60 * 1000);
            group.mutedUsers = (group.mutedUsers || []).filter(
              (entry) => entry.userId?.toString() !== userId.toString()
            );
            group.mutedUsers.push({
              userId,
              mutedUntil,
              reason: evaluation.flags.join(", ") || "policy violation",
              by: null,
            });

            emitToGroup(groupId, "groupUserMuted", {
              groupId,
              memberId: userId,
              mutedUntil,
              reason: evaluation.flags.join(", "),
              by: null,
            });

            emitToUser(userId, "groupModerationNotice", {
              groupId,
              action: "muted",
              mutedUntil,
              reason: evaluation.flags.join(", "),
            });

            const systemMessage = new GroupMessage({
              groupId,
              system: true,
              systemEvent: "auto_mute",
              message: `AI Moderator muted ${sender?.fullName || "a user"} for ${minutes} minutes.`,
              systemPayload: { userId, mutedUntil, flags: evaluation.flags },
            });
            await systemMessage.save();
            emitToGroup(groupId, "groupSystemMessage", formatGroupMessage(systemMessage, null));
          } else {
            emitToUser(userId, "groupModerationNotice", {
              groupId,
              action: "warned",
              flags: evaluation.flags,
              warnings: state.warnings,
            });
          }

          await group.save();
        }
      } catch (error) {
        console.error("Group moderation error:", error.message);
      }
    });
  } catch (error) {
    console.error("Error sending group message:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

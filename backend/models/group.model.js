import mongoose from "mongoose";

const groupMemberStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    warnings: { type: Number, default: 0 },
    strikes: { type: Number, default: 0 },
    lastWarningAt: { type: Date, default: null },
  },
  { _id: false }
);

const mutedUserSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mutedUntil: { type: Date, required: true },
    reason: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    settings: {
      aiModeratorEnabled: { type: Boolean, default: true },
      autoMuteEnabled: { type: Boolean, default: true },
      autoMuteMinutes: { type: Number, default: 10 },
      warnThreshold: { type: Number, default: 2 },
      spamLimitPerMinute: { type: Number, default: 6 },
      floodLimitPerMinute: { type: Number, default: 8 },
      highlightQuality: { type: Boolean, default: true },
    },
    mutedUsers: [mutedUserSchema],
    memberStates: [groupMemberStateSchema],
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;

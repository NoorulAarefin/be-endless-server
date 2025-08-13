import mongoose from "mongoose";

const schema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // isChat: {
    //   type: Boolean,
    //   default: false,
    // }, // TEMPORARILY DISABLED - Chat functionality not required
    // chatId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Chat",
    // }, // TEMPORARILY DISABLED - Chat functionality not required
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", schema);

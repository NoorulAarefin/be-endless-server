import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // chatId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Chat",
    //   required: true,
    // }, // TEMPORARILY DISABLED - Chat functionality not required
    content: {
      type: String,
      trim: true,
    },
    readBy: [{ type: String }],
  },
  { timestamps: true },
);

export const Message = mongoose.model("Message", messageSchema);

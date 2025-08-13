import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  token: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 // 60 seconds = 1 minute
  },
  otp: {
    type: Number,
  },
});

export const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema,
);

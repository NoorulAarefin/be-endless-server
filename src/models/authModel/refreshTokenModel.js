import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

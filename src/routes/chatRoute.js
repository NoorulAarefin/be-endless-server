// TEMPORARILY DISABLED: Chat functionality not required for this project
/*
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";

import {
  getActiveChat,
  sendMessage,
  allMessages,
} from "../controllers/chat/chatController.js";

const router = express.Router();

// <!-- ====== get chat route ====== -->
router.get("/get-chat", isAuthenticated, getActiveChat);

// <!-- ====== send message route ====== -->
router.post("/send-message", isAuthenticated, sendMessage);

// <!-- ====== get all messages route ====== -->
router.get("/get-all-messages/:chatId/:skip", isAuthenticated, allMessages);

export default router;
*/

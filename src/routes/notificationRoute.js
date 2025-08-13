import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";

import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notification/notificationController.js";

const router = express.Router();

// <!-- ====== notification route ====== -->
router.get("/get-notifications", isAuthenticated, getNotifications);

// mark isRead to true
router.post("/mark-notification-read", isAuthenticated, markNotificationAsRead);

export default router;

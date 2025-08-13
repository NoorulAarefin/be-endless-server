import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createPaymentAttempt,
  updatePaymentStatus,
  getAllPaymentAttemptsFromDB,
  getPaymentAttemptById,
  getPaymentAttemptsByUser,
  cancelPaymentAttempt,
} from "../controllers/trade/paymentController.js";

const router = express.Router();

// All payment routes require authentication
router.use(isAuthenticated);

// Create a new payment attempt
router.post("/create", createPaymentAttempt);

// Update payment status (admin/seller only)
router.patch("/update-status", updatePaymentStatus);

// Get all payment attempts (admin only)
router.get("/all", getAllPaymentAttemptsFromDB);

// Get payment attempts for current user
router.get("/user", getPaymentAttemptsByUser);

// Get specific payment attempt by ID
router.get("/:id", getPaymentAttemptById);

// Cancel payment attempt
router.patch("/:id/cancel", cancelPaymentAttempt);

export default router; 
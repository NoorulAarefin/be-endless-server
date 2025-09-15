import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
  {
    // Payment details
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online", "Bank Transfer", "Cash"],
      default: "COD",
    },
    
    // Order details
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    cartId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartItems",
    }],
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    
    // Buyer-seller details
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // sellerId removed in single-seller model
    
    // Additional metadata
    metadata: {
      type: Object,
    },
    errorMessage: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export const PaymentAttempt = mongoose.model("PaymentAttempt", paymentAttemptSchema); 
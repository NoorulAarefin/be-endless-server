import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    sellProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellingProduct",
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartItems",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
    },
    // chatId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Chat",
    // }, // TEMPORARILY DISABLED - Chat functionality not required
    paymentIntent: {
      type: String,
    },
    refId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online", "Bank Transfer", "Cash"],
      default: "COD",
    },
    status: {
      type: String,
      enum: ["initialized", "pending", "complete"],
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    deliveryAddress: {
      label: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        }
      }
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", Schema);

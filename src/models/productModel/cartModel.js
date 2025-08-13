import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    sellingProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellingProduct",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const CartItems = mongoose.model("CartItems", Schema);

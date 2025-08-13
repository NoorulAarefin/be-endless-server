import mongoose from "mongoose";

const sellingProductSchema = new mongoose.Schema(
  {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    quantity: {
      type: Number,
    },
    totalQuantity: {
      type: Number,
    },
    miniumSell: {
      type: String,
    },
    price: {
      type: Number,
    },
    image: {
      type: Array,
    },
    variety: {
      type: [String],
    },
    metric: {
      type: String,
      required: true,
    },
    isSold: {
      type: Boolean,
      default: false,
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
  },
  { timestamps: true },
);

// Add 2dsphere index for geospatial queries
sellingProductSchema.index({ location: "2dsphere" });

export const SellingProduct = mongoose.model(
  "SellingProduct",
  sellingProductSchema,
);

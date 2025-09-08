import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true
    },
    heading: {
      type: String,
      required: true,
      trim: true
    },
    subheading: {
      type: String,
      trim: true
    },
    ctaText: {
      type: String,
      trim: true
    },
    ctaUrl: {
      type: String,
      trim: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

heroBannerSchema.index({ isActive: 1 });
heroBannerSchema.index({ sortOrder: 1, createdAt: -1 });

export const HeroBanner = mongoose.model("HeroBanner", heroBannerSchema);



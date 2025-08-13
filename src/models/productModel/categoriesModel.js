import mongoose from "mongoose";

const categoriesSchema = new mongoose.Schema(
  {
    categoryName: String,
    image: String,
    bgColor: String,
    isActive: Boolean,
  },
  { timestamps: true },
);

export const Categories = mongoose.model("Categories", categoriesSchema);

import express from "express";
import multer from "multer";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

import {
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "../controllers/category/categoryController.js";

const router = express.Router();

// Configure multer for file uploads
const fileUpload = multer();

// <!-- ====== admin side - add new category route ====== -->
router.post("/create-category", [isAuthenticated, isAdmin, fileUpload.single('image')], createCategory);

// <!-- ====== get category route ====== -->
router.get("/get-category", getCategory);

// <!-- ====== update category route (admin only) ====== -->
router.post("/update-category", [isAuthenticated, isAdmin, fileUpload.single('image')], updateCategory);

// <!-- ====== delete category route (admin only) ====== -->
router.post("/delete-category", [isAuthenticated, isAdmin], deleteCategory);

export default router;

import express from "express";
import multer from "multer";
import { upsertBanner, listBanners, toggleBannerActive, deleteBanner } from "../controllers/heroBanner/heroBannerController.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Configure multer for file uploads
const fileUpload = multer();

// Create or update a banner (admin only)
router.post("/hero-banners", [isAuthenticated, isAdmin, fileUpload.single('image')], upsertBanner);

// List banners
router.get("/hero-banners", listBanners);

// Toggle active state with enforcement of max 3 active (admin only)
router.post("/hero-banners/toggle", [isAuthenticated, isAdmin], toggleBannerActive);

// Delete a banner (admin only)
router.post("/hero-banners/delete", [isAuthenticated, isAdmin], deleteBanner);

export default router;



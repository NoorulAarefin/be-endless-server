import express from "express";
import { upsertBanner, listBanners, toggleBannerActive } from "../controllers/heroBanner/heroBannerController.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Create or update a banner (admin only)
router.post("/hero-banners", [isAuthenticated, isAdmin], upsertBanner);

// List banners
router.get("/hero-banners", listBanners);

// Toggle active state with enforcement of max 3 active (admin only)
router.post("/hero-banners/toggle", [isAuthenticated, isAdmin], toggleBannerActive);

export default router;



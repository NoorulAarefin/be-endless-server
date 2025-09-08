import express from "express";
import { upsertBanner, listBanners, toggleBannerActive } from "../controllers/heroBanner/heroBannerController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Create or update a banner
router.post("/hero-banners", auth, upsertBanner);

// List banners
router.get("/hero-banners", listBanners);

// Toggle active state with enforcement of max 3 active
router.post("/hero-banners/toggle", auth, toggleBannerActive);

export default router;



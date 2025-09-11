import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";
import {
  getDashboardStats,
  getRecentOrders,
  getRecentProducts,
  getTrendingProducts,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  getTopSellingCategories,
  getDashboardCharts
  , getDashboardSummary
} from "../controllers/admin/adminDashboardController.js";

const router = express.Router();

// Dashboard overview stats
router.get("/dashboard/stats", [isAuthenticated, isAdmin], getDashboardStats);

// Recent data
router.get("/dashboard/recent-orders", [isAuthenticated, isAdmin], getRecentOrders);
router.get("/dashboard/recent-products", [isAuthenticated, isAdmin], getRecentProducts);

// Analytics data
router.get("/dashboard/trending-products", [isAuthenticated, isAdmin], getTrendingProducts);
router.get("/dashboard/sales-analytics", [isAuthenticated, isAdmin], getSalesAnalytics);
router.get("/dashboard/user-analytics", [isAuthenticated, isAdmin], getUserAnalytics);
router.get("/dashboard/product-analytics", [isAuthenticated, isAdmin], getProductAnalytics);
router.get("/dashboard/order-analytics", [isAuthenticated, isAdmin], getOrderAnalytics);
router.get("/dashboard/revenue-analytics", [isAuthenticated, isAdmin], getRevenueAnalytics);
router.get("/dashboard/top-categories", [isAuthenticated, isAdmin], getTopSellingCategories);

// Combined charts data
router.get("/dashboard/charts", [isAuthenticated, isAdmin], getDashboardCharts);

// Combined summary (stats + charts + recent)
router.get("/dashboard/summary", [isAuthenticated, isAdmin], getDashboardSummary);

export default router;

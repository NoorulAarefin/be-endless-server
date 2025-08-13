// DISABLED: Selling product routes removed - converting to traditional e-commerce model
// Users can no longer sell products, only admins can add products with fixed prices
/*
import express from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

import {
  getAllSellingProducts,
  getAllSellingProductsWithFilter,
  sellingProducts,
  userSellingProduct,
  getUnifiedProductList,
  updateSellingProduct,
  deleteSellingProduct,
} from "../controllers/trade/sellProductController.js";

const router = express.Router();

// <!-- ====== sell products route ====== -->
router.post("/sell-products", isAuthenticated, sellingProducts);

// <!-- ====== get user products route ====== -->
router.get("/get-userProducts", isAuthenticated, userSellingProduct);

// <!-- ====== admin - get all selling products route ====== -->
router.post(
  "/get-allSellingProducts",
  [isAuthenticated, isAdmin],
  getAllSellingProducts,
);

// <!-- ====== get selling products route ====== -->
router.post(
  "/get-sellingProducts",
  isAuthenticated,
  getAllSellingProductsWithFilter,
);

// ====== unified product list for app home page ======
router.post("/get-unifiedProductList", getUnifiedProductList);

// ====== update selling product route ======
router.patch("/update-sellingProduct", isAuthenticated, updateSellingProduct);

// ====== delete selling product route ======
router.delete("/delete-sellingProduct", isAuthenticated, deleteSellingProduct);

export default router;
*/

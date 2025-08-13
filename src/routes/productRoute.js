import express from "express";
import multer from "multer";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getAllUsers,
  getCounts,
  getProducts,
  searchProduct,
  updateProduct,
  getProductsNearMe,
  getFeaturedProducts,
  getProductById,
  updateProductStock,
  toggleProductStatus,
  toggleFeaturedStatus,
} from "../controllers/product/productController.js";

import uploadController from "../controllers/uploadImagesController.js";
// <!-- ====== upload image route ====== -->
const fileUpload = multer();
const router = express.Router();

// <!-- ====== admin side - add new product route ====== -->
router.post("/create-product", [isAuthenticated, isAdmin, fileUpload.array("image", 10)], createProduct);

// <!-- ====== get product by ID route ====== -->
router.get("/product/:productId", getProductById);

// <!-- ====== get products route (with filters) ====== -->
router.post("/get-products", getProducts);

// <!-- ====== get all products route ====== -->
router.post("/get-Allproducts", getAllProducts);

// <!-- ====== get featured products route ====== -->
router.get("/featured-products", getFeaturedProducts);

// <!-- ====== update product route (admin only) ====== -->
router.put("/update-product", [isAuthenticated, isAdmin, fileUpload.array("image", 10)], updateProduct);

// <!-- ====== delete product route (admin only) ====== -->
router.delete("/delete-product", [isAuthenticated, isAdmin], deleteProduct);

// <!-- ====== update product stock (admin only) ====== -->
router.patch("/update-stock", [isAuthenticated, isAdmin], updateProductStock);

// <!-- ====== toggle product status (admin only) ====== -->
router.patch("/toggle-status", [isAuthenticated, isAdmin], toggleProductStatus);

// <!-- ====== toggle featured status (admin only) ====== -->
router.patch("/toggle-featured", [isAuthenticated, isAdmin], toggleFeaturedStatus);



router.post(
  "/upload-image",
  fileUpload.array("image", 5),
  uploadController.upload,
);

// <!-- ======admin -  get count for dashboard route ====== -->
router.get("/get-counts", isAuthenticated, getCounts);

// <!-- ====== get all users for dashboard route (admin only) ====== -->
router.get("/get-allUser", [isAuthenticated, isAdmin], getAllUsers);

// <!-- ====== search products route ====== -->
router.post("/search-products", searchProduct);

// Add route for products near me (if location-based is still needed)
router.post("/products/nearby", isAuthenticated, getProductsNearMe);

export default router;

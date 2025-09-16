import express from "express";
import multer from "multer";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

// Custom error handler for multer file upload limits
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded. Maximum allowed: 10 main product images and 8 variant images."
      });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File size too large. Please upload smaller images."
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field. Please use 'image' for main product images and 'variantImages' for variant images."
      });
    }
  }
  next(err);
};

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
  getLowStockProducts,
} from "../controllers/product/productController.js";

import uploadController from "../controllers/uploadImagesController.js";
// <!-- ====== upload image route ====== -->
const fileUpload = multer();
const router = express.Router();

// <!-- ====== admin side - add new product route ====== -->
router.post("/create-product", [isAuthenticated, isAdmin, fileUpload.fields([
  { name: 'image', maxCount: 10 },
  { name: 'variantImages', maxCount: 8 } // Allow up to 8 variant images
]), handleMulterErrors], createProduct);

// <!-- ====== get product by ID route ====== -->
router.get("/product/:productId", getProductById);

// <!-- ====== get products route (with filters) ====== -->
router.post("/get-products", getProducts);

// <!-- ====== get all products route ====== -->
router.post("/get-Allproducts", getAllProducts);

// <!-- ====== get featured products route ====== -->
router.get("/featured-products", getFeaturedProducts);

// <!-- ====== update product route (admin only) ====== -->
router.put("/update-product", [isAuthenticated, isAdmin, fileUpload.fields([
  { name: 'image', maxCount: 10 },
  { name: 'variantImages', maxCount: 8 } // Allow up to 8 variant images
]), handleMulterErrors], updateProduct);

// <!-- ====== delete product route (admin only) ====== -->
router.delete("/delete-product", [isAuthenticated, isAdmin], deleteProduct);
// Temporary POST alias to avoid client breakage; accepts same body
router.post("/delete-product", [isAuthenticated, isAdmin], deleteProduct);

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

// <!-- ====== admin - low stock products report ====== -->
router.get("/admin/low-stock", [isAuthenticated, isAdmin], getLowStockProducts);

// <!-- ====== get all users for dashboard route (admin only) ====== -->
router.get("/get-allUser", [isAuthenticated, isAdmin], getAllUsers);

// <!-- ====== search products route ====== -->
router.post("/search-products", searchProduct);

// Add route for products near me (if location-based is still needed)
router.post("/products/nearby", isAuthenticated, getProductsNearMe);

export default router;

import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/auth.js";

import {
  addToCart,
  buyProduct,
  deleteCartItems,
  getCartItems,
  getMyOrders,
  updateCartItems,
  updateOrderStatus,
  getPaymentDetails,
  getAllOrders,
  getCartDetailsByIds,
  getOrdersWithPayments,
} from "../controllers/trade/buyProductController.js";

const router = express.Router();

// <!-- ====== add to cart route ====== -->
router.post("/add-toCart", isAuthenticated, addToCart);

// <!-- ====== get cart items route ====== -->
router.get("/get-cartItems", isAuthenticated, getCartItems);

// <!-- ====== update cart items route ====== -->
router.post("/update-cartItems", isAuthenticated, updateCartItems);

// <!-- ====== delete cart items route ====== -->
router.post("/delete-cartItems", isAuthenticated, deleteCartItems);

// <!-- ====== checkout route ====== -->
// router.post("/checkout", isAuthenticated, checkout); // TODO: Implement checkout function

// <!-- ====== buy product route (direct purchase) ====== -->
router.post("/buy-product", isAuthenticated, buyProduct);

// <!-- ====== get my orders route ====== -->
router.post("/get-myOrders", isAuthenticated, getMyOrders);

// <!-- ====== get order by ID route ====== -->
// router.get("/order/:orderId", isAuthenticated, getOrderById); // TODO: Implement getOrderById function

// <!-- ====== cancel order route ====== -->
// router.post("/cancel-order", isAuthenticated, cancelOrder); // TODO: Implement cancelOrder function

// ====== admin - get all orders route ======
router.post("/get-allOrders", [isAuthenticated, isAdmin], getAllOrders);

// ====== admin - get all orders with payment details (combined, clean) ======
router.get("/admin/orders-with-payments", [isAuthenticated, isAdmin], getOrdersWithPayments);

// <!-- ====== update order status route (admin only) ====== -->
router.post("/update-order-status", [isAuthenticated, isAdmin], updateOrderStatus);

// <!-- ====== get payment details route ====== -->
router.get("/get-paymentDetails", isAuthenticated, getPaymentDetails);

// <!-- ====== get cart details by cartId array route ====== -->
router.post("/get-cartDetailsByIds", isAuthenticated, getCartDetailsByIds);

export default router;

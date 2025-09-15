import Joi from "joi";
import mongoose from "mongoose";
import logger from "../../config/logger.js";
import CustomErrorHandler from "../../services/customErrorHandler.js";
// import { Chat } from "../../models/chatModel/chatModel.js"; // TEMPORARILY DISABLED - Chat functionality not required
import { Order } from "../../models/productModel/orderModel.js";
import { PaymentAttempt } from "../../models/productModel/paymentAttemptModel.js";
// import { User } from "../../models/authModel/userModel.js";
import { SellingProduct } from "../../models/productModel/sellingProductModel.js";
import { CartItems } from "../../models/productModel/cartModel.js";
import { Product } from "../../models/productModel/productModel.js";
// import { Notification } from "../../models/notification/notificationModel.js";
// import { notification as sendNotification } from "../../helper/notification.js";

// <!-- ====== add to cart controller ====== -->
export const addToCart = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string(),
    quantity: Joi.number().integer().min(1).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { productId, quantity } = req.body;

  try {
    // Support both legacy SellingProduct IDs and direct Product IDs
    let totalAmount;
    let sellingProductRef = null;
    let productRefId = null;
    let categoryRefId = null;

    const sellingProduct = await SellingProduct.findById(productId);

    if (sellingProduct) {
      if (typeof sellingProduct.price !== "number") {
        return res
          .status(400)
          .json({ success: false, message: "Selling product price not set" });
      }
      if (typeof sellingProduct.quantity !== "number" || sellingProduct.quantity < quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock for selected product" });
      }
      totalAmount = sellingProduct.price * quantity;
      sellingProductRef = sellingProduct._id;
      productRefId = sellingProduct.productId;
      categoryRefId = sellingProduct.categoryId;
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      if (typeof product.price !== "number") {
        return res
          .status(400)
          .json({ success: false, message: "Product price not set" });
      }
      if (typeof product.stockQuantity !== "number" || product.stockQuantity < quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock for selected product" });
      }
      totalAmount = product.price * quantity;
      productRefId = product._id;
      categoryRefId = product.categoryId;
    }

    const data = await new CartItems({
      quantity,
      totalAmount,
      sellingProductId: sellingProductRef || undefined,
      userId: req.user._id,
      productId: productRefId,
      categoryId: categoryRefId,
    }).save();

    res
      .status(200)
      .json({ data: data, success: true, message: "Cart added successfully" });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get cart items controller ====== -->
export const getCartItems = async (req, res, next) => {
  try {
    const data = await CartItems.find({
      userId: req.user._id,
      isActive: true,
    })
      .populate("sellingProductId")
      .populate("productId", "productName")
      .populate("categoryId", "categoryName");

    res.status(200).json({ data: data });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update cart items controller ====== -->
export const updateCartItems = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string(),
    quantity: Joi.number().integer().min(1).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { quantity, id } = req.body;

  try {
    const item = await CartItems.findById(id).populate("productId").populate("sellingProductId");
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

    let unitPrice = 0;
    if (item.productId) {
      if (typeof item.productId.price !== "number") return res.status(400).json({ success: false, message: "Product price not set" });
      if (typeof item.productId.stockQuantity !== "number" || item.productId.stockQuantity < quantity) return res.status(400).json({ success: false, message: "Insufficient stock for selected product" });
      unitPrice = item.productId.price;
    } else if (item.sellingProductId) {
      if (typeof item.sellingProductId.price !== "number") return res.status(400).json({ success: false, message: "Selling product price not set" });
      if (typeof item.sellingProductId.quantity !== "number" || item.sellingProductId.quantity < quantity) return res.status(400).json({ success: false, message: "Insufficient stock for selected product" });
      unitPrice = item.sellingProductId.price;
    } else {
      return res.status(400).json({ success: false, message: "Cart item missing product reference" });
    }

    const updated = await CartItems.findByIdAndUpdate(
      id,
      { quantity, totalAmount: unitPrice * quantity },
      { new: true },
    );

    res.status(200).json({ data: updated });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== delete cart items controller ====== -->
export const deleteCartItems = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { id } = req.body;

  try {
    const data = await CartItems.findByIdAndDelete(id);

    res.status(200).json({ data: data, message: "Cart deleted successfully" });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== buy product controller ====== -->
export const buyProduct = async (req, res, next) => {
  const schema = Joi.object({
    cartId: Joi.array().items(Joi.string().required()),
    paymentIntent: Joi.string(),
    paymentAttemptId: Joi.string(), // Add paymentAttemptId to link with payment attempt
    deliveryAddress: Joi.object({
      label: Joi.string().allow(''),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
      location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2)
      }).optional()
    }).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { cartId, paymentIntent, paymentAttemptId, deliveryAddress } = req.body;

  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      // Fetch active cart items in the transaction
      const cartItems = await CartItems.find({
      _id: { $in: cartId },
        isActive: true,
    })
      .populate("sellingProductId")
        .populate("productId")
        .session(session);

      if (!cartItems.length) {
        return { orders: [], empty: true };
      }

      // Validate and decrement stock atomically per item
      for (const item of cartItems) {
        const desiredQty = item.quantity || 0;
        if (desiredQty <= 0) {
          throw CustomErrorHandler.badRequest("Invalid quantity in cart item.");
        }

        if (item.sellingProductId) {
          // Conditional decrement: only if enough quantity
          const dec = await SellingProduct.findOneAndUpdate(
            { _id: item.sellingProductId._id, quantity: { $gte: desiredQty } },
            { $inc: { quantity: -desiredQty } },
            { new: true, session },
          );
          if (!dec) {
            throw CustomErrorHandler.badRequest("Insufficient stock for selected selling product.");
          }
        } else if (item.productId) {
          const dec = await Product.findOneAndUpdate(
            { _id: item.productId._id, stockQuantity: { $gte: desiredQty } },
            { $inc: { stockQuantity: -desiredQty } },
            { new: true, session },
          );
          if (!dec) {
            throw CustomErrorHandler.badRequest("Insufficient stock for selected product.");
          }
        } else {
          throw CustomErrorHandler.badRequest("Cart item missing product reference.");
        }
      }

      // Deactivate cart items once decremented
      await CartItems.updateMany(
        { _id: { $in: cartId } },
        { isActive: false },
        { session },
      );

      // Create orders inside the transaction
    const orders = await Order.insertMany(
        cartItems.map((item) => ({
        quantity: item.quantity,
        totalAmount: item.totalAmount,
        userId: req.user._id,
        cartId: item._id,
        productId: item.productId || (item.sellingProductId ? item.sellingProductId.productId : undefined),
        sellProductId: item.sellingProductId ? item.sellingProductId._id : undefined,
        categoryId: item.categoryId,
        deliveryAddress: deliveryAddress,
        status: "initialized",
        paymentIntent,
        isPaid: true,
      })),
        { session }
    );

      // Link payment attempt if present
    if (paymentAttemptId) {
      await PaymentAttempt.findByIdAndUpdate(
        paymentAttemptId,
        {
          status: "succeeded",
          orderId: orders.length === 1 ? orders[0]._id : undefined,
            metadata: { orderIds: orders.map(o => o._id) },
          },
          { session }
        );
      }

      return { orders };
    });

    if (result?.empty) {
      return res.status(400).json({ success: false, message: "No active cart items found." });
    }

    const orders = result.orders;

    await Order.populate(orders, { path: "sellProductId" });
    await Order.populate(orders, { path: "productId" });

    // Single-seller model: skip seller chat/notifications entirely

    res.status(200).json({
      message: "Products purchased successfully!",
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  } finally {
    session.endSession();
  }
};

// <!-- ====== get my orders controller ====== -->
export const getMyOrders = async (req, res, next) => {
  try {
    const data = await Order.find({
        userId: req.user._id,
      })
        .populate({
          path: "sellProductId",
          select: "image location",
        })
        .populate("productId", "productName")
      .populate("categoryId", "categoryName");

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update order status controller ====== -->
export const updateOrderStatus = async (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.string().required(),
    status: Joi.string().valid("initialized", "pending", "complete").required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { orderId, status } = req.body;

  try {
    const data = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    )
      .populate("sellProductId")
      .populate("productId")
      .populate("userId", "fullName fcmToken");

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== get payment details controller ======
export const getPaymentDetails = async (req, res, next) => {
  try {
    const payments = await Order.find({ isPaid: true })
      .populate("userId", "fullName email avatar")
      .populate("productId", "productName image")
      .populate("sellProductId")
      .populate("categoryId", "categoryName")
      .populate({
        path: "cartId",
        populate: [
          { path: "sellingProductId" },
          { path: "productId", select: "productName image" },
          { path: "categoryId", select: "categoryName" }
        ]
      })
      .select(
        "totalAmount paymentMethod status userId productId cartId quantity createdAt updatedAt refId isPaid paymentIntent sellProductId categoryId deliveryAddress isActive"
      );

    // Flatten cart item details for each order for easier frontend consumption
    const paymentsWithCartDetails = payments.map(order => {
      let cartItemDetails = null;
      if (order.cartId && typeof order.cartId === 'object' && order.cartId.productId) {
        // If cartId is populated as a single object
        cartItemDetails = order.cartId;
      } else if (Array.isArray(order.cartId) && order.cartId.length > 0) {
        // If cartId is an array (shouldn't be, but handle just in case)
        cartItemDetails = order.cartId[0];
      }
      return {
        ...order.toObject(),
        cartItemDetails
      };
    });

    res.status(200).json({ success: true, data: paymentsWithCartDetails });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== get all orders for admin controller ======
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("userId", "fullName email avatar")
      .populate("productId", "productName image")
      .populate("categoryId", "categoryName")
      .populate("cartId")
      .populate("sellProductId");

    // Fetch payment attempts for all orders
    const paymentAttempts = await PaymentAttempt.find({
      orderId: { $in: orders.map(o => o._id) }
    });
    const paymentAttemptMap = {};
    paymentAttempts.forEach(pa => {
      paymentAttemptMap[pa.orderId?.toString()] = pa;
    });

    // Attach payment attempt details to each order
    const ordersWithPayments = orders.map(order => {
      const paymentAttempt = paymentAttemptMap[order._id.toString()];
      return {
        ...order.toObject(),
        paymentAttempt: paymentAttempt ? {
          _id: paymentAttempt._id,
          status: paymentAttempt.status,
          paymentId: paymentAttempt.paymentId,
          amount: paymentAttempt.amount,
          currency: paymentAttempt.currency,
          paymentMethod: paymentAttempt.paymentMethod,
          errorMessage: paymentAttempt.errorMessage,
        } : null
      };
    });

    res.status(200).json({ success: true, data: ordersWithPayments });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== get all orders with payment details for admin (clean, combined) ======
/**
 * Admin API: Get all orders with their payment details (if any)
 * Combines order and payment info, with full population for frontend/admin use.
 * Returns: [{ ...order, paymentAttempt: { ... } | null }]
 */
export const getOrdersWithPayments = async (req, res, next) => {
  try {
    // Fetch all orders with full population
    const orders = await Order.find()
      .populate("userId", "fullName email avatar")
      .populate("sellerId", "fullName email avatar")
      .populate("productId", "productName image")
      .populate("categoryId", "categoryName")
      .populate({
        path: "cartId",
        populate: [
          { path: "sellingProductId" },
          { path: "productId", select: "productName image" },
          { path: "categoryId", select: "categoryName" }
        ]
      })
      .populate("sellProductId");

    // Fetch all payment attempts for these orders
    const paymentAttempts = await PaymentAttempt.find({
      orderId: { $in: orders.map(o => o._id) }
    });
    // Map: orderId -> paymentAttempt
    const paymentAttemptMap = {};
    paymentAttempts.forEach(pa => {
      if (pa.orderId) paymentAttemptMap[pa.orderId.toString()] = pa;
    });

    // Combine order and paymentAttempt
    const ordersWithPayments = orders.map(order => {
      const paymentAttempt = paymentAttemptMap[order._id.toString()];
      // Optionally flatten cart item details for frontend
      let cartItemDetails = null;
      if (order.cartId && typeof order.cartId === 'object' && order.cartId.productId) {
        cartItemDetails = order.cartId;
      } else if (Array.isArray(order.cartId) && order.cartId.length > 0) {
        cartItemDetails = order.cartId[0];
      }
      return {
        ...order.toObject(),
        cartItemDetails,
        paymentAttempt: paymentAttempt ? {
          _id: paymentAttempt._id,
          status: paymentAttempt.status,
          paymentId: paymentAttempt.paymentId,
          amount: paymentAttempt.amount,
          currency: paymentAttempt.currency,
          paymentMethod: paymentAttempt.paymentMethod,
          errorMessage: paymentAttempt.errorMessage,
          createdAt: paymentAttempt.createdAt,
          updatedAt: paymentAttempt.updatedAt,
        } : null
      };
    });

    res.status(200).json({ success: true, data: ordersWithPayments });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== UNIFIED ADMIN API: Complete Order & Payment Details ======
/**
 * Admin API: Get complete order details with all related information
 * This is the MAIN endpoint for admin panel - everything in one place
 * 
 * Features:
 * - Complete order information
 * - Full user details (buyer)
 * - Product details with images
 * - Payment attempt details
 * - Delivery address
 * - Cart item details (if applicable)
 * - Clean, structured response format
 * 
 * Query Parameters:
 * - limit: Number of orders to return (default: 50)
 * - status: Filter by order status (initialized, pending, complete)
 * - paymentStatus: Filter by payment status (pending, processing, completed, failed, cancelled)
 * - sortBy: Sort field (createdAt, totalAmount, status) - default: createdAt
 * - sortOrder: Sort direction (asc, desc) - default: desc
 * - startDate: Filter orders from this date (ISO string)
 * - endDate: Filter orders until this date (ISO string)
 */
export const getUnifiedOrderDetails = async (req, res, next) => {
  try {
    const {
      limit = 50,
      status,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch orders with comprehensive population
    const orders = await Order.find(filter)
      .populate({
        path: "userId",
        select: "fullName email mobileNo avatar isActive createdAt"
      })
      // sellerId removed in single-seller model
      .populate({
        path: "productId",
        select: "productName price image description stockQuantity isActive categoryId"
      })
      .populate({
        path: "categoryId",
        select: "categoryName image bgColor"
      })
      .populate({
        path: "cartId",
        populate: [
          { 
            path: "sellingProductId",
            select: "productName price image description"
          },
          { 
            path: "productId", 
            select: "productName price image description stockQuantity"
          },
          { 
            path: "categoryId", 
            select: "categoryName image bgColor"
          }
        ]
      })
      // sellProductId is legacy (multi-seller). Skipped in single-seller model
      .sort(sort)
      .limit(parseInt(limit));

    // Get all order IDs for payment lookup
    const orderIds = orders.map(order => order._id);

    // Fetch payment attempts with full details
    const paymentAttempts = await PaymentAttempt.find({
      orderId: { $in: orderIds }
    })
      .populate({
        path: "buyerId",
        select: "fullName email mobileNo avatar"
      })
      .populate({
        path: "productId",
        select: "productName price image"
      });

    // Create payment map for quick lookup
    const paymentMap = {};
    paymentAttempts.forEach(payment => {
      if (payment.orderId) {
        paymentMap[payment.orderId.toString()] = payment;
      }
    });

    // Apply payment status filter if specified
    let filteredOrders = orders;
    if (paymentStatus) {
      filteredOrders = orders.filter(order => {
        const payment = paymentMap[order._id.toString()];
        return payment && payment.status === paymentStatus;
      });
    }

    // Build unified response
    const unifiedOrders = filteredOrders.map(order => {
      const payment = paymentMap[order._id.toString()];
      
      // Extract cart details if available
      let cartDetails = null;
      if (order.cartId) {
        if (Array.isArray(order.cartId) && order.cartId.length > 0) {
          cartDetails = order.cartId[0];
        } else if (typeof order.cartId === 'object') {
          cartDetails = order.cartId;
        }
      }

      return {
        // Order Information
        orderId: order._id,
        orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        status: order.status,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        isActive: order.isActive,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        // User Information
        buyer: {
          id: order.userId?._id,
          name: order.userId?.fullName,
          email: order.userId?.email,
          mobile: order.userId?.mobileNo,
          avatar: order.userId?.avatar,
          isActive: order.userId?.isActive,
          joinedAt: order.userId?.createdAt
        },
        // seller removed in single-seller model

        // Product Information
        product: {
          id: order.productId?._id,
          name: order.productId?.productName,
          price: order.productId?.price,
          images: order.productId?.image || [],
          description: order.productId?.description,
          stockQuantity: order.productId?.stockQuantity,
          isActive: order.productId?.isActive,
          category: {
            id: order.categoryId?._id,
            name: order.categoryId?.categoryName,
            image: order.categoryId?.image,
            bgColor: order.categoryId?.bgColor
          }
        },

        // Cart Details (if applicable)
        cartDetails: cartDetails ? {
          id: cartDetails._id,
          quantity: cartDetails.quantity,
          product: {
            id: cartDetails.productId?._id,
            name: cartDetails.productId?.productName,
            price: cartDetails.productId?.price,
            images: cartDetails.productId?.image || []
          },
          category: {
            id: cartDetails.categoryId?._id,
            name: cartDetails.categoryId?.categoryName
          }
        } : null,

        // Delivery Information
        deliveryAddress: order.deliveryAddress ? {
          label: order.deliveryAddress.label,
          street: order.deliveryAddress.street,
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          postalCode: order.deliveryAddress.postalCode,
          country: order.deliveryAddress.country,
          coordinates: order.deliveryAddress.location?.coordinates
        } : null,

        // Payment Information
        payment: payment ? {
          id: payment._id,
          paymentId: payment.paymentId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          errorMessage: payment.errorMessage,
          notes: payment.notes,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          buyer: {
            id: payment.buyerId?._id,
            name: payment.buyerId?.fullName,
            email: payment.buyerId?.email
          },
          // seller removed in single-seller model
        } : null,

        // Additional Metadata
        metadata: {
          hasPayment: !!payment,
          paymentStatus: payment?.status || 'no_payment',
          isCartOrder: !!cartDetails,
          orderAge: Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)) // days
        }
      };
    });

    // Get summary statistics
    const totalOrders = await Order.countDocuments(filter);
    const statusCounts = await Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const paymentStatusCounts = await PaymentAttempt.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: unifiedOrders,
        pagination: {
          total: totalOrders,
          returned: unifiedOrders.length,
          limit: parseInt(limit)
        },
        summary: {
          totalOrders,
          statusBreakdown: statusCounts,
          paymentStatusBreakdown: paymentStatusCounts
        },
        filters: {
          status,
          paymentStatus,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    logger.error('Error in getUnifiedOrderDetails:', error.message);
    return next(error);
  }
};

// ====== get cart details by cartId array controller ======
export const getCartDetailsByIds = async (req, res, next) => {
  const schema = Joi.object({
    cartIds: Joi.array().items(Joi.string().required()).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { cartIds } = req.body;

  try {
    const cartItems = await CartItems.find({ _id: { $in: cartIds } })
      .populate("sellingProductId")
      .populate("productId", "productName image")
      .populate("categoryId", "categoryName");

    res.status(200).json({ success: true, data: cartItems });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

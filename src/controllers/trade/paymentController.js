import Joi from "joi";
import logger from "../../config/logger.js";
// import { Order } from "../../models/productModel/orderModel.js";
import { PaymentAttempt } from "../../models/productModel/paymentAttemptModel.js";
// import { User } from "../../models/authModel/userModel.js";
import { SellingProduct } from "../../models/productModel/sellingProductModel.js";
import { CartItems } from "../../models/productModel/cartModel.js";

// <!-- ====== create payment attempt ====== -->
export const createPaymentAttempt = async (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().integer().positive().required(),
    currency: Joi.string().default("USD"),
    cartId: Joi.array().items(Joi.string()),
    productId: Joi.string(),
    quantity: Joi.number(),
    sellerId: Joi.string(),
    paymentMethod: Joi.string().valid("COD", "Online", "Bank Transfer", "Cash").default("COD"),
  }).or('cartId', 'productId'); // Require at least one of cartId or productId

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  let { amount, currency, cartId, productId, quantity, sellerId, paymentMethod } = req.body;

  try {
    // If cart checkout, optionally determine sellerId from cart items (legacy P2P flow)
    if (cartId && cartId.length > 0) {
      const cartItem = await CartItems.findById(cartId[0]);
      if (!cartItem) {
        return res.status(400).json({ success: false, message: "Invalid cart item." });
      }
      // If the cart comes from legacy SellingProduct, derive sellerId; otherwise skip
      if (cartItem.sellingProductId) {
        const sellingProduct = await SellingProduct.findById(cartItem.sellingProductId);
        if (!sellingProduct) {
          return res.status(400).json({ success: false, message: "Invalid selling product in cart." });
        }
        sellerId = sellingProduct.userId;
      }
    }

    // For direct product purchase only, ensure sellerId is present (legacy P2P)
    const isDirectPurchase = Boolean(productId) && !(cartId && cartId.length > 0);
    if (isDirectPurchase && !sellerId) {
      return res.status(400).json({ success: false, message: "sellerId is required for direct product payment attempt." });
    }

    // Generate a unique payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the payment attempt in the PaymentAttempt model
    const paymentAttempt = await PaymentAttempt.create({
      paymentId,
      amount,
      currency,
      status: "pending",
      paymentMethod,
      cartId: cartId || [],
      productId,
      quantity,
      totalAmount: amount,
      buyerId: req.user._id,
      // seller removed in single-seller model
    });

    res.json({
      data: {
        paymentId: paymentAttempt.paymentId,
        paymentAttemptId: paymentAttempt._id,
        amount: paymentAttempt.amount,
        currency: paymentAttempt.currency,
        status: paymentAttempt.status,
        paymentMethod: paymentAttempt.paymentMethod,
      },
      success: true,
      message: "Payment attempt created successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update payment status ====== -->
export const updatePaymentStatus = async (req, res, next) => {
  const schema = Joi.object({
    paymentAttemptId: Joi.string().required(),
    status: Joi.string().valid("pending", "processing", "completed", "failed", "cancelled").required(),
    notes: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const { paymentAttemptId, status, notes } = req.body;

  try {
    const paymentAttempt = await PaymentAttempt.findByIdAndUpdate(
      paymentAttemptId,
      {
        status,
        notes,
        ...(status === "completed" && { updatedAt: new Date() }),
      },
      { new: true }
    );

    if (!paymentAttempt) {
      return res.status(404).json({ success: false, message: "Payment attempt not found" });
    }

    res.json({
      data: paymentAttempt,
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== fetch all payment attempts from database ====== -->
export const getAllPaymentAttemptsFromDB = async (req, res, next) => {
  try {
    const paymentAttempts = await PaymentAttempt.find()
      .populate("buyerId", "fullName email avatar")
      // seller removed in single-seller model
      .populate("productId", "productName image description")
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json({
      data: paymentAttempts,
      success: true,
      message: "Fetched all payment attempts from database successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get payment attempt by ID ====== -->
export const getPaymentAttemptById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const paymentAttempt = await PaymentAttempt.findById(id)
      .populate("buyerId", "fullName email avatar")
      .populate("sellerId", "fullName email avatar")
      .populate("productId", "productName image description")
      .populate("orderId");

    if (!paymentAttempt) {
      return res.status(404).json({ success: false, message: "Payment attempt not found" });
    }

    res.json({
      data: paymentAttempt,
      success: true,
      message: "Payment attempt fetched successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get payment attempts by user ====== -->
export const getPaymentAttemptsByUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const paymentAttempts = await PaymentAttempt.find({
      buyerId: userId
    })
      .populate("buyerId", "fullName email avatar")
      .populate("productId", "productName image description")
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json({
      data: paymentAttempts,
      success: true,
      message: "User payment attempts fetched successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== cancel payment attempt ====== -->
export const cancelPaymentAttempt = async (req, res, next) => {
  const { id } = req.params;

  try {
    const paymentAttempt = await PaymentAttempt.findById(id);

    if (!paymentAttempt) {
      return res.status(404).json({ success: false, message: "Payment attempt not found" });
    }

    // Check if user is authorized to cancel this payment
    if (paymentAttempt.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this payment" });
    }

    // Only allow cancellation if status is pending
    if (paymentAttempt.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel payment with status: ${paymentAttempt.status}` 
      });
    }

    paymentAttempt.status = "cancelled";
    paymentAttempt.notes = "Cancelled by user";
    await paymentAttempt.save();

    res.json({
      data: paymentAttempt,
      success: true,
      message: "Payment attempt cancelled successfully",
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

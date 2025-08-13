import Joi from "joi";
import logger from "../../config/logger.js";
// import { Chat } from "../../models/chatModel/chatModel.js"; // TEMPORARILY DISABLED - Chat functionality not required
import { Order } from "../../models/productModel/orderModel.js";
import { PaymentAttempt } from "../../models/productModel/paymentAttemptModel.js";
import { User } from "../../models/authModel/userModel.js";
import { SellingProduct } from "../../models/productModel/sellingProductModel.js";
import { CartItems } from "../../models/productModel/cartModel.js";
import { Product } from "../../models/productModel/productModel.js";
import { Notification } from "../../models/notification/notificationModel.js";
import { notification as sendNotification } from "../../helper/notification.js";

// <!-- ====== add to cart controller ====== -->
export const addToCart = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string(),
    quantity: Joi.number(),
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
    quantity: Joi.number(),
    totalAmount: Joi.number(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { quantity, totalAmount, id } = req.body;

  try {
    const data = await CartItems.findByIdAndUpdate(
      id,
      {
        quantity,
        totalAmount,
      },
      { new: true },
    );

    res.status(200).json({ data: data });
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
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { cartId, paymentIntent, paymentAttemptId } = req.body;

  try {
    await CartItems.updateMany({ _id: { $in: cartId } }, { isActive: false });

    const updatedCartItemsDetails = await CartItems.find({
      _id: { $in: cartId },
    })
      .populate("sellingProductId")
      .populate("productId");

    // Adjust inventory for each cart item depending on source
    for (const data of updatedCartItemsDetails) {
      if (data.sellingProductId) {
        // Legacy path: decrement SellingProduct quantity
        const productData = await SellingProduct.findById(
          data.sellingProductId._id,
        );
        const remainingQuantity = (productData?.quantity || 0) - data.quantity;
        await SellingProduct.findByIdAndUpdate(data.sellingProductId._id, {
          quantity: remainingQuantity,
        });
      } else if (data.productId) {
        // New path: decrement Product stockQuantity
        await Product.findByIdAndUpdate(
          data.productId,
          { $inc: { stockQuantity: -data.quantity } },
          { new: true },
        );
      }
    }

    const orders = await Order.insertMany(
      updatedCartItemsDetails.map((item) => ({
        quantity: item.quantity,
        totalAmount: item.totalAmount,
        userId: req.user._id,
        sellerId: item.sellingProductId ? item.sellingProductId.userId : undefined,
        cartId: item._id,
        productId: item.productId || (item.sellingProductId ? item.sellingProductId.productId : undefined),
        sellProductId: item.sellingProductId ? item.sellingProductId._id : undefined,
        categoryId: item.categoryId,
        status: "initialized",
        paymentIntent,
        isPaid: true,
      })),
    );

    await Order.populate(orders, { path: "sellProductId" });
    await Order.populate(orders, { path: "productId" });

    // Update payment attempt with order IDs if paymentAttemptId is provided
    if (paymentAttemptId) {
      await PaymentAttempt.findByIdAndUpdate(
        paymentAttemptId,
        {
          status: "succeeded",
          orderId: orders.length === 1 ? orders[0]._id : undefined,
          metadata: {
            orderIds: orders.map(order => order._id),
          }
        }
      );
    }

    // --- DEDUPLICATE CHAT CREATION LOGIC ---
    // Group orders by seller for chat creation
    // Some orders (classic e-commerce flow) may not have a sellerId; guard against it
    const sellerOrderMap = {};
    orders.forEach(order => {
      if (!order.sellerId) return;
      const sellerId = order.sellerId.toString();
      if (!sellerOrderMap[sellerId]) {
        sellerOrderMap[sellerId] = [];
      }
      sellerOrderMap[sellerId].push(order);
    });

    // TEMPORARILY DISABLED: Chat functionality not required for this project
    /*
    for (const [sellerId, sellerOrders] of Object.entries(sellerOrderMap)) {
      // Check if an active chat exists between buyer and seller for any of these orders
      // let chat = await Chat.findOne({
      //   'users.userId': { $all: [req.user._id, sellerId] },
      //   isActive: true,
      // });
      // let isNewChat = false;
      // if (!chat) {
      //   // Create new chat for this buyer-seller
      //   chat = await Chat.create({
      //     users: [
      //       { userId: req.user._id },
      //       { userId: sellerId },
      //     ],
      //     isActive: true,
      //   });
      //   isNewChat = true;
      // }
      // // Link all orders for this seller to the chat
      // for (const order of sellerOrders) {
      //   const refId = order._id.toString().slice(18, 24);
      //   await Order.findByIdAndUpdate(order._id, { chatId: chat._id, refId });
      // }
      // // Notify seller if chat was just initiated
      // if (isNewChat) {
      //   const sellerData = await User.findById(sellerId).select("-password");
      //   const buyerData = await User.findById(req.user._id).select("-password");
      //   await sendNotification({
      //     title: `New Chat Started with Buyer`,
      //     body: `${buyerData.fullName} has started a chat with you regarding their recent purchase.`,
      //     to: sellerData.fcmToken,
      //   });
      //   await new Notification({
      //     title: `New Chat Started with Buyer`,
      //     body: `${buyerData.fullName} has started a chat with you regarding their recent purchase.`,
      //     userId: sellerData._id,
      //   }).save();
      // }
    }
    */

    for (const ord of orders) {
      if (!ord.sellProductId) {
        // No seller context in classic e-commerce flow; skip seller notifications
        continue;
      }

      const sellerData = await User.findById(ord.sellProductId.userId).select(
        "-password",
      );

      const buyerData = await User.findById(req.user._id).select("-password");

      await sendNotification({
        title: `Congratulations, ${sellerData.fullName}! Your Product Has Been Purchased`,
        body: `Great news! ${buyerData.fullName} has purchased ${ord.quantity} kg of your product, ${ord.productId.productName}. Keep up the good work!`,
        to: sellerData.fcmToken,
      });

      await new Notification({
        title: `Congratulations, ${sellerData.fullName}! Your Product Has Been Purchased`,
        body: `Great news! ${buyerData.fullName} has purchased ${ord.quantity} kg of your product, ${ord.productId.productName}. Keep up the good work!`,
        userId: sellerData._id,
      }).save();
    }

    res.status(200).json({
      message: "Products purchased successfully!",
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get my orders controller ====== -->
export const getMyOrders = async (req, res, next) => {
  const schema = Joi.object({
    isSeller: Joi.boolean(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { isSeller } = req.body;

  let data;

  try {
    if (isSeller) {
      data = await Order.find({
        sellerId: req.user._id,
      })
        .populate({
          path: "sellProductId",
          select: "image location",
          populate: {
            path: "userId",
            select: "avatar fullName mobileNo email",
          },
        })
        .populate("productId", "productName")
        .populate("categoryId", "categoryName")
        .populate("userId", "fullName avatar email mobileNo");
    } else {
      data = await Order.find({
        userId: req.user._id,
      })
        .populate({
          path: "sellProductId",
          select: "image location",
          populate: {
            path: "userId",
            select: "avatar fullName mobileNo email",
          },
        })
        .populate("productId", "productName")
        .populate("categoryId", "categoryName")
        .populate("sellerId", "fullName avatar email mobileNo");
    }

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update order status controller ====== -->
export const updateOrderStatus = async (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.string(),
    isSeller: Joi.boolean(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { orderId, isSeller } = req.body;

  try {
    const data = await Order.findByIdAndUpdate(
      { orderId },
      { status: isSeller ? "pending" : "complete" },
      { new: true },
    )
      .populate("sellProductId")
      .populate("productId")
      .populate("userId", "fullName fcmToken")
      .populate("sellerId", "fullName fcmToken");

    if (isSeller) {
      await sendNotification({
        title: `Product Handed Over: ${data.productId.productName}`,
        body: `${data.sellerId.fullName} has handed over ${data.quantity} kg of ${data.productId.productName} to you. Enjoy your purchase!`,
        to: data.userId.fcmToken,
      });
    } else {
      await sendNotification({
        title: `Product Accepted: ${data.productId.productName}`,
        body: `Congratulations, ${data.userId.fullName}! Your order of ${data.quantity} kg of ${data.productId.productName} has been successfully accepted and verified. Thank you for the smooth transaction!`,
        to: data.sellerId.fcmToken,
      });
    }

    //  please provide good way to say provide title and  body

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
      .populate("sellerId", "fullName email avatar")
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
        "totalAmount paymentMethod status userId sellerId productId cartId quantity createdAt updatedAt refId isPaid paymentIntent sellProductId categoryId deliveryAddress isActive"
        // "chatId" // TEMPORARILY DISABLED - Chat functionality not required
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
      .populate("sellerId", "fullName email avatar")
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

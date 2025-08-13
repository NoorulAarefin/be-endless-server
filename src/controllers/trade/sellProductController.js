import Joi from "joi";
import logger from "../../config/logger.js";

import { notification } from "../../helper/notification.js";

import { User } from "../../models/authModel/userModel.js";
import { Notification } from "../../models/notification/notificationModel.js";
import { Order } from "../../models/productModel/orderModel.js";
import { Product } from "../../models/productModel/productModel.js";
import { SellingProduct } from "../../models/productModel/sellingProductModel.js";

// <!-- ====== sell products controller ====== -->
export const sellingProducts = async (req, res, next) => {
  const schema = Joi.object({
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    quantity: Joi.number().required(),
    miniumSell: Joi.string(),
    price: Joi.number().required(),
    productId: Joi.string().required(),
    image: Joi.array().required(),
    variety: Joi.array().items(Joi.string()),
    metric: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const {
    location,
    quantity,
    productId,
    image,
    price,
    miniumSell,
    variety,
    metric,
  } = req.body;

  // Convert to GeoJSON Point
  const geoLocation = {
    type: "Point",
    coordinates: [location.longitude, location.latitude],
  };

  try {
    const productData = await Product.findById(productId);

    const data = await new SellingProduct({
      location: geoLocation,
      quantity,
      image,
      productId,
      price,
      miniumSell,
      variety,
      totalQuantity: quantity,
      categoryId: productData.categoryId,
      userId: req.user._id,
      metric,
    }).save();

    const getUsers = await User.find();

    for (const user of getUsers) {
      if (user.id == req.user._id) continue;

      await notification({
        title: `New Product Added by Seller: ${productData.productName}`,
        body: `Check out the latest addition from our seller! ${productData.productName} is now available for purchase.`,
        to: user.fcmToken,
      });

      await new Notification({
        title: `New Product Added by Seller: ${productData.productName}`,
        body: `Check out the latest addition from our seller! ${productData.productName} is now available for purchase.`,
        userId: user._id,
      }).save();
    }

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get user products controller ====== -->
export const userSellingProduct = async (req, res, next) => {
  try {
    const data = await SellingProduct.find({
      userId: req.user._id,
    })
      .populate("productId")
      .populate("categoryId");

    res.status(200).json({ data: data });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get all selling products controller ====== -->
export const getAllSellingProducts = async (req, res, next) => {
  try {
    const data = await SellingProduct.find()
      .populate("userId", "fullName email avatar")
      .populate("productId", "productName image discription")
      .populate("categoryId", "categoryName");

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get recent products controller ====== -->
export const getRecentlySellAndBuyProdcuts = async (req, res, next) => {
  const schema = Joi.object({
    isSellProducts: Joi.boolean(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { isSellProducts } = req.body;

  let data;

  try {
    if (isSellProducts) {
      data = await SellingProduct.find({ isSold: false })
        .limit(10)
        .sort({ createdAt: -1 })
        .populate("userId", "fullName email avatar")
        .populate("productId", "productName image discription")
        .populate("categoryId", "categoryName");
    } else {
      data = await Order.find()
        .limit(10)
        .sort({ createdAt: -1 })
        .populate("userId", "fullName email avatar")
        .populate("productId", "productName image discription")
        .populate("categoryId", "categoryName");
    }

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get user trade controller ====== -->
export const getUserSellAndBuyProdcuts = async (req, res, next) => {
  const schema = Joi.object({
    isSellProducts: Joi.boolean(),
    userId: Joi.string(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { isSellProducts, userId } = req.body;

  let data;

  try {
    if (isSellProducts) {
      data = await SellingProduct.find({ userId })
        .sort({ createdAt: -1 })
        .populate("userId", "fullName email avatar")
        .populate("productId", "productName image discription")
        .populate("categoryId", "categoryName");
    } else {
      data = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate("userId", "fullName email avatar")
        .populate("productId", "productName image")
        .populate("categoryId", "categoryName");
    }

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get selling products controller ====== -->
export const getAllSellingProductsWithFilter = async (req, res, next) => {
  try {
    const data = await SellingProduct.find({
      isSold: false,
      categoryId: req.body.categoryId,
    })
      .populate("userId", "fullName email avatar")
      .populate("productId", "productName image discription")
      .populate("categoryId", "categoryName");

    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== unified product list for app home page ======
export const getUnifiedProductList = async (req, res, next) => {
  try {
    const sellingProducts = await SellingProduct.find({ isSold: false })
      .populate({
        path: "productId",
        select: "productName image discription nutritionalValue varieties",
      })
      .populate({
        path: "categoryId",
        select: "categoryName image bgColor",
      })
      .populate({
        path: "userId",
        select: "fullName avatar city",
      });

    const result = sellingProducts.map((sp) => ({
      id: sp._id,
      location: sp.location,
      quantity: sp.quantity,
      totalQuantity: sp.totalQuantity,
      miniumSell: sp.miniumSell,
      price: sp.price,
      image: sp.image,
      variety: sp.variety,
      metric: sp.metric,
      isSold: sp.isSold,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      product: sp.productId
        ? {
            id: sp.productId._id,
            name: sp.productId.productName,
            image: sp.productId.image,
            description: sp.productId.discription,
            nutritionalValue: sp.productId.nutritionalValue,
            varieties: sp.productId.varieties,
          }
        : null,
      category: sp.categoryId
        ? {
            id: sp.categoryId._id,
            name: sp.categoryId.categoryName,
            image: sp.categoryId.image,
            bgColor: sp.categoryId.bgColor,
          }
        : null,
      seller: sp.userId
        ? {
            id: sp.userId._id,
            fullName: sp.userId.fullName,
            avatar: sp.userId.avatar,
            city: sp.userId.city,
          }
        : null,
    }));

    res.status(200).json({ data: result, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== update selling product controller ======
export const updateSellingProduct = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    location: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number(),
    }),
    quantity: Joi.number(),
    miniumSell: Joi.string(),
    price: Joi.number(),
    image: Joi.array(),
    variety: Joi.string(),
    metric: Joi.string(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { productId, location, ...updateFields } = req.body;

  if (location && (location.latitude !== undefined && location.longitude !== undefined)) {
    updateFields.location = {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    };
  }

  try {
    const product = await SellingProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", success: false });
    }
    if (String(product.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }
    Object.assign(product, updateFields);
    await product.save();
    res.status(200).json({ data: product, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// ====== delete selling product controller ======
export const deleteSellingProduct = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }
  const { productId } = req.body;
  try {
    const product = await SellingProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", success: false });
    }
    if (String(product.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }
    await SellingProduct.deleteOne({ _id: productId });
    res.status(200).json({ message: "Product deleted successfully", success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

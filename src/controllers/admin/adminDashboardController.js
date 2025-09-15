import Joi from "joi";
import { User } from "../../models/authModel/userModel.js";
import { Product } from "../../models/productModel/productModel.js";
import { Order } from "../../models/productModel/orderModel.js";
import { Categories } from "../../models/productModel/categoriesModel.js";
import { HeroBanner } from "../../models/heroBanner/heroBannerModel.js";
import logger from "../../config/logger.js";

// Get dashboard overview stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalRevenue,
      activeBanners,
      pendingOrders,
      completedOrders
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Categories.countDocuments(),
      Order.aggregate([
        { $match: { status: "complete" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      HeroBanner.countDocuments({ isActive: true }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "complete" })
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalRevenue: revenue,
        activeBanners,
        pendingOrders,
        completedOrders,
        conversionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get recent orders
export const getRecentOrders = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentOrders = await Order.find()
      .populate('userId', 'fullName email mobileNo')
      .populate('productId', 'productName price image')
      // seller removed in single-seller model
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentOrders
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get recent products
export const getRecentProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentProducts = await Product.find()
      .populate('categoryId', 'categoryName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentProducts
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get trending products (most sold)
export const getTrendingProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const trendingProducts = await Order.aggregate([
      { $match: { status: "complete" } },
      { $group: { 
        _id: "$productId", 
        totalSold: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalAmount" }
      }},
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category"
      }},
      { $unwind: "$category" },
      { $project: {
        _id: "$product._id",
        productName: "$product.productName",
        price: "$product.price",
        image: "$product.image",
        category: "$category.categoryName",
        totalSold: 1,
        totalRevenue: 1
      }},
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: trendingProducts
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get sales analytics (daily, weekly, monthly)
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupBy, dateFormat;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupBy = { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        dateFormat = "%Y-%m-%d";
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        groupBy = { 
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" }
        };
        dateFormat = "%Y-W%U";
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupBy = { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        };
        dateFormat = "%Y-%m";
        break;
    }

    const salesData = await Order.aggregate([
      { 
        $match: { 
          status: "complete",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        salesData
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let startDate;
    const now = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: period === 'daily' ? { $dayOfMonth: "$createdAt" } : null,
            week: period === 'weekly' ? { $week: "$createdAt" } : null
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        period,
        totalUsers,
        activeUsers,
        userGrowth: userStats
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get product analytics
export const getProductAnalytics = async (req, res, next) => {
  try {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      lowStockProducts,
      categoryStats
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ stock: { $lt: 10 } }),
      Product.aggregate([
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
        { $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo"
        }},
        { $unwind: "$categoryInfo" },
        { $project: {
          categoryName: "$categoryInfo.categoryName",
          count: 1
        }},
        { $sort: { count: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        featuredProducts,
        lowStockProducts,
        categoryStats
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get order analytics
export const getOrderAnalytics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      orderStatusStats,
      averageOrderValue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "complete" }),
      Order.countDocuments({ status: "initialized" }),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $group: { _id: null, average: { $avg: "$totalAmount" } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        orderStatusStats,
        averageOrderValue: averageOrderValue.length > 0 ? averageOrderValue[0].average : 0
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let startDate;
    const now = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: "complete",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: period === 'daily' ? { $dayOfMonth: "$createdAt" } : null,
            week: period === 'weekly' ? { $week: "$createdAt" } : null
          },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: "complete" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        revenueData
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get top selling categories
export const getTopSellingCategories = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    const topCategories = await Order.aggregate([
      { $match: { status: "complete" } },
      { $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category"
      }},
      { $unwind: "$category" },
      { $group: {
        _id: "$category._id",
        categoryName: { $first: "$category.categoryName" },
        totalSold: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalAmount" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: topCategories
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Get dashboard charts data
export const getDashboardCharts = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get sales analytics data
    let startDate;
    const now = new Date();
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    const [
      salesData,
      userStats,
      productStats,
      revenueData
    ] = await Promise.all([
      // Sales analytics
      Order.aggregate([
        { 
          $match: { 
            status: "complete",
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // User analytics
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Product analytics
      Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isFeatured: true }),
        Product.countDocuments({ stockQuantity: { $lt: 10 } }),
        Product.aggregate([
          { $group: { _id: "$categoryId", count: { $sum: 1 } } },
          { $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryInfo"
          }},
          { $unwind: "$categoryInfo" },
          { $project: {
            categoryName: "$categoryInfo.categoryName",
            count: 1
          }},
          { $sort: { count: -1 } }
        ])
      ]),
      
      // Revenue analytics
      Order.aggregate([
        {
          $match: {
            status: "complete",
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalRevenue: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);

    const [totalProducts, activeProducts, featuredProducts, lowStockProducts, categoryStats] = productStats;

    res.status(200).json({
      success: true,
      data: {
        salesChart: {
          period,
          salesData
        },
        userChart: {
          period,
          totalUsers: await User.countDocuments(),
          activeUsers: await User.countDocuments({ isActive: true }),
          userGrowth: userStats
        },
        productChart: {
          totalProducts,
          activeProducts,
          featuredProducts,
          lowStockProducts,
          categoryStats
        },
        revenueChart: {
          period,
          totalRevenue: await Order.aggregate([
            { $match: { status: "complete" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ]).then(result => result.length > 0 ? result[0].total : 0),
          revenueData
        }
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

// Combined dashboard summary for fewer round-trips
export const getDashboardSummary = async (req, res, next) => {
  try {
    const {
      period = 'monthly',
      recentLimit = 10,
      topCategoriesLimit = 5,
      lowStockThreshold = 10
    } = req.query;

    const [
      // Stats
      usersCount,
      productsCount,
      ordersCount,
      categoriesCount,
      completedRevenueAgg,
      pendingOrdersCount,
      completedOrdersCount,
      lowStockCount,
      // Recent
      recentOrders,
      recentProducts,
      // Top categories
      topCategories
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Categories.countDocuments(),
      Order.aggregate([
        { $match: { status: "complete" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "complete" }),
      Product.countDocuments({ isActive: true, stockQuantity: { $lt: Number(lowStockThreshold) } }),
      Order.find()
        .populate('userId', 'fullName email')
        .populate('productId', 'productName price image')
        .populate('sellerId', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(parseInt(recentLimit)),
      Product.find()
        .populate('categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .limit(parseInt(recentLimit)),
      Order.aggregate([
        { $match: { status: "complete" } },
        { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $lookup: { from: "categories", localField: "product.categoryId", foreignField: "_id", as: "category" } },
        { $unwind: "$category" },
        { $group: { _id: "$category._id", categoryName: { $first: "$category.categoryName" }, totalSold: { $sum: "$quantity" }, totalRevenue: { $sum: "$totalAmount" } } },
        { $sort: { totalSold: -1 } },
        { $limit: parseInt(topCategoriesLimit) }
      ])
    ]);

    // Time series (lightweight): sales and revenue for selected period
    // Reuse logic similar to getSalesAnalytics/getRevenueAnalytics but summarized
    const now = new Date();
    let startDate;
    let groupBy;
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        groupBy = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        groupBy = { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } };
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupBy = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
        break;
    }

    const [salesSeries, revenueSeries] = await Promise.all([
      Order.aggregate([
        { $match: { status: "complete", createdAt: { $gte: startDate } } },
        { $group: { _id: groupBy, totalOrders: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
      ]),
      Order.aggregate([
        { $match: { status: "complete", createdAt: { $gte: startDate } } },
        { $group: { _id: groupBy, totalRevenue: { $sum: "$totalAmount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
      ])
    ]);

    const totalRevenue = completedRevenueAgg.length > 0 ? completedRevenueAgg[0].total : 0;
    const conversionRate = ordersCount > 0 ? Number(((completedOrdersCount / ordersCount) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          users: usersCount,
          products: productsCount,
          orders: ordersCount,
          categories: categoriesCount,
          totalRevenue,
          pendingOrders: pendingOrdersCount,
          completedOrders: completedOrdersCount,
          lowStockProducts: lowStockCount,
          conversionRate
        },
        charts: {
          period,
          salesSeries,
          revenueSeries
        },
        topCategories,
        recent: {
          orders: recentOrders,
          products: recentProducts
        }
      }
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

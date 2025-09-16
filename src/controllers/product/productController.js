import Joi from "joi";
import logger from "../../config/logger.js";
import { User } from "../../models/authModel/userModel.js";
import { Product } from "../../models/productModel/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dkqaubbzv",
  api_key: "137238991633774",
  api_secret: "ggp2JA9omJf7QdFwQjPKH2JVdUQ",
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// <!-- ====== create new product controller (admin only) ====== -->
export const createProduct = async (req, res, next) => {
  try {
    // Validation for fields
    const schema = Joi.object({
      productName: Joi.string().required().min(2).max(100),
      description: Joi.string().required().min(10).max(1000),
      price: Joi.number().required().min(0),
      originalPrice: Joi.number().min(0),
      discountPercentage: Joi.number().min(0).max(100),
      stockQuantity: Joi.number().required().min(0),
      minOrderQuantity: Joi.number().min(1),
      unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack'),
      categoryId: Joi.string().required(),
      image: Joi.array().items(Joi.string().uri()).optional(),
      nutritionalValue: Joi.object({
        calories: Joi.string(),
        protein: Joi.string(),
        fat: Joi.string(),
        carbohydrates: Joi.object({
          dietaryFiber: Joi.string(),
          sugars: Joi.string(),
        }),
      }),
      varieties: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        stockQuantity: Joi.number().min(0).required()
      })),
      isFeatured: Joi.boolean(),
      isActive: Joi.boolean(),
      tags: Joi.array().items(Joi.string()),
      specifications: Joi.object(),
      productType: Joi.string().valid('simple', 'variable'),
      variants: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(Joi.object({
          value: Joi.string().required(),
          price: Joi.number().min(0),
          stockQuantity: Joi.number().min(0),
          image: Joi.string().allow(''), // Allow empty string or URL or file: prefix
          isActive: Joi.boolean()
        }))
      }))
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { image, ...productData } = req.body;

    let cloudinaryResults = [];
    let variantImageResults = [];

    // Handle main product image upload - either from files or URLs
    if (req.files && req.files.image && req.files.image.length > 0) {
      // Upload main product image files to Cloudinary
      try {
        const uploadPromises = req.files.image.map(file => uploadToCloudinary(file));
        cloudinaryResults = await Promise.all(uploadPromises);
      } catch (uploadError) {
        logger.error("Cloudinary upload error for main images:", uploadError);
        return res.status(500).json({
          message: "Failed to upload main product images to Cloudinary",
          success: false,
        });
      }
    } else if (image && image.length > 0) {
      // Upload external URLs to Cloudinary
      try {
        const uploadPromises = image.map(imageUrl => 
          cloudinary.uploader.upload(imageUrl, {
            folder: "products",
            resource_type: "auto",
          })
        );
        cloudinaryResults = await Promise.all(uploadPromises);
      } catch (uploadError) {
        logger.error("Cloudinary upload error for image URLs:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image URLs to Cloudinary",
          success: false,
        });
      }
    } else {
      return res.status(400).json({
        message: "Either image files or image URLs are required for main product images",
        success: false,
      });
    }

    // Handle variant image uploads
    if (req.files && req.files.variantImages && req.files.variantImages.length > 0) {
      // Validate variant image count
      if (req.files.variantImages.length > 8) {
        return res.status(400).json({
          success: false,
          message: "Too many variant images. Maximum allowed is 8 variant images."
        });
      }
      
      try {
        const uploadPromises = req.files.variantImages.map(file => uploadToCloudinary(file));
        variantImageResults = await Promise.all(uploadPromises);
      } catch (uploadError) {
        logger.error("Cloudinary upload error for variant images:", uploadError);
        return res.status(500).json({
          message: "Failed to upload variant images to Cloudinary",
          success: false,
        });
      }
    }

    // Extract image URLs from Cloudinary results
    const imageUrls = cloudinaryResults.map(result => result.secure_url);
    const variantImageUrls = variantImageResults.map(result => result.secure_url);

    const finalProductData = {
      ...productData,
      image: imageUrls, // Use Cloudinary URLs for main product images
    };

    // Process variants and assign uploaded images
    if (finalProductData.variants && finalProductData.variants.length > 0) {
      let variantImageIndex = 0;
      
      finalProductData.variants = finalProductData.variants.map(variant => ({
        ...variant,
        options: variant.options.map(option => {
          const processedOption = { ...option };
          
          // If option has an image file uploaded, use the uploaded image URL
          if (option.image && option.image.startsWith('file:')) {
            if (variantImageIndex < variantImageUrls.length) {
              processedOption.image = variantImageUrls[variantImageIndex];
              variantImageIndex++;
            } else {
              // If no more uploaded images, keep the original URL or remove image
              processedOption.image = option.image.replace('file:', '');
            }
          }
          
          return processedOption;
        })
      }));
    }
    
    // Calculate discount percentage if original price is provided
    if (finalProductData.originalPrice && finalProductData.price) {
      finalProductData.discountPercentage = Math.round(
        ((finalProductData.originalPrice - finalProductData.price) / finalProductData.originalPrice) * 100
      );
    }

    const product = await new Product(finalProductData).save();
    const populatedProduct = await product.populate("categoryId", "categoryName");

    res.status(201).json({ 
      success: true,
      message: "Product created successfully", 
      data: populatedProduct 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get product by ID controller ====== -->
export const getProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findOne({ 
      _id: productId, 
      isActive: true 
    }).populate("categoryId", "categoryName");

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: product 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get products controller (with filters) ====== -->
export const getProducts = async (req, res, next) => {
  const schema = Joi.object({
    categoryId: Joi.string(),
    skip: Joi.number().min(0).default(0),
    limit: Joi.number().min(1).max(50).default(10),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    sortBy: Joi.string().valid('price', 'name', 'createdAt', 'popularity'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    isFeatured: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { 
      categoryId, 
      skip = 0, 
      limit = 10, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isFeatured 
    } = req.body;

    // Build filter object
    const filter = { isActive: true };
    if (categoryId) filter.categoryId = categoryId;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip * limit)
      .limit(limit)
      .populate("categoryId", "categoryName")
      .select('-specifications');

    const total = await Product.countDocuments(filter);

    res.status(200).json({ 
      success: true,
      data: products,
      pagination: {
        skip,
        limit,
        total,
        hasMore: (skip * limit) + products.length < total
      }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get all products controller ====== -->
export const getAllProducts = async (req, res, next) => {
  const schema = Joi.object({
    skip: Joi.number().min(0).default(0),
    limit: Joi.number().min(1).max(100).default(20),
    isActive: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { skip = 0, limit = 20, isActive } = req.body;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip * limit)
      .limit(limit)
      .populate("categoryId", "categoryName");

    const total = await Product.countDocuments(filter);

    res.status(200).json({ 
      success: true,
      data: products,
      pagination: {
        skip,
        limit,
        total,
        hasMore: (skip * limit) + products.length < total
      }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get featured products controller ====== -->
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("categoryId", "categoryName")
      .select('-specifications');

    res.status(200).json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update product controller (admin only) ====== -->
export const updateProduct = async (req, res, next) => {
  try {
    const schema = Joi.object({
      productId: Joi.string().required(),
      productName: Joi.string().min(2).max(100),
      description: Joi.string().min(10).max(1000),
      price: Joi.number().min(0),
      originalPrice: Joi.number().min(0),
      discountPercentage: Joi.number().min(0).max(100),
      stockQuantity: Joi.number().min(0),
      minOrderQuantity: Joi.number().min(1),
      unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack'),
      categoryId: Joi.string(),
      image: Joi.array().items(Joi.string().uri()).optional(),
      nutritionalValue: Joi.object({
        calories: Joi.string(),
        protein: Joi.string(),
        fat: Joi.string(),
        carbohydrates: Joi.object({
          dietaryFiber: Joi.string(),
          sugars: Joi.string(),
        }),
      }),
      varieties: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        stockQuantity: Joi.number().min(0).required()
      })),
      isFeatured: Joi.boolean(),
      isActive: Joi.boolean(),
      tags: Joi.array().items(Joi.string()),
      specifications: Joi.object(),
      productType: Joi.string().valid('simple', 'variable'),
      variants: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        options: Joi.array().items(Joi.object({
          value: Joi.string().required(),
          price: Joi.number().min(0),
          stockQuantity: Joi.number().min(0),
          image: Joi.string().allow(''), // Allow empty string or URL or file: prefix
          isActive: Joi.boolean()
        }))
      }))
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { productId, image, ...updateData } = req.body;

    let cloudinaryResults = [];
    let variantImageResults = [];

    // Handle main product image upload - either from files or URLs
    if (req.files && req.files.image && req.files.image.length > 0) {
      // Upload main product image files to Cloudinary
      try {
        const uploadPromises = req.files.image.map(file => uploadToCloudinary(file));
        cloudinaryResults = await Promise.all(uploadPromises);
        const imageUrls = cloudinaryResults.map(result => result.secure_url);
        updateData.image = imageUrls;
      } catch (uploadError) {
        logger.error("Cloudinary upload error for main images:", uploadError);
        return res.status(500).json({
          message: "Failed to upload main product images to Cloudinary",
          success: false,
        });
      }
    } else if (image && image.length > 0) {
      // Upload external URLs to Cloudinary
      try {
        const uploadPromises = image.map(imageUrl => 
          cloudinary.uploader.upload(imageUrl, {
            folder: "products",
            resource_type: "auto",
          })
        );
        cloudinaryResults = await Promise.all(uploadPromises);
        const imageUrls = cloudinaryResults.map(result => result.secure_url);
        updateData.image = imageUrls;
      } catch (uploadError) {
        logger.error("Cloudinary upload error for image URLs:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image URLs to Cloudinary",
          success: false,
        });
      }
    }

    // Handle variant image uploads
    if (req.files && req.files.variantImages && req.files.variantImages.length > 0) {
      // Validate variant image count
      if (req.files.variantImages.length > 8) {
        return res.status(400).json({
          success: false,
          message: "Too many variant images. Maximum allowed is 8 variant images."
        });
      }
      
      try {
        const uploadPromises = req.files.variantImages.map(file => uploadToCloudinary(file));
        variantImageResults = await Promise.all(uploadPromises);
      } catch (uploadError) {
        logger.error("Cloudinary upload error for variant images:", uploadError);
        return res.status(500).json({
          message: "Failed to upload variant images to Cloudinary",
          success: false,
        });
      }
    }

    // Process variants and assign uploaded images
    if (updateData.variants && updateData.variants.length > 0) {
      const variantImageUrls = variantImageResults.map(result => result.secure_url);
      let variantImageIndex = 0;
      
      updateData.variants = updateData.variants.map(variant => ({
        ...variant,
        options: variant.options.map(option => {
          const processedOption = { ...option };
          
          // If option has an image file uploaded, use the uploaded image URL
          if (option.image && option.image.startsWith('file:')) {
            if (variantImageIndex < variantImageUrls.length) {
              processedOption.image = variantImageUrls[variantImageIndex];
              variantImageIndex++;
            } else {
              // If no more uploaded images, keep the original URL or remove image
              processedOption.image = option.image.replace('file:', '');
            }
          }
          
          return processedOption;
        })
      }));
    }

    // Calculate discount percentage if original price is provided
    if (updateData.originalPrice && updateData.price) {
      updateData.discountPercentage = Math.round(
        ((updateData.originalPrice - updateData.price) / updateData.originalPrice) * 100
      );
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate("categoryId", "categoryName");

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Product updated successfully", 
      data: product 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== delete product controller (admin only) ====== -->
export const deleteProduct = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string(),
    id: Joi.string(),
  }).or('productId', 'id');

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { productId, id } = req.body;
    const targetId = productId || id;

    const product = await Product.findByIdAndDelete(targetId);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Product deleted successfully" 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update product stock controller (admin only) ====== -->
export const updateProductStock = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    stockQuantity: Joi.number().min(0).required(),
    operation: Joi.string().valid('add', 'subtract', 'set').default('set')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { productId, stockQuantity, operation = 'set' } = req.body;

    let updateData = {};
    if (operation === 'add') {
      updateData = { $inc: { stockQuantity } };
    } else if (operation === 'subtract') {
      updateData = { $inc: { stockQuantity: -stockQuantity } };
    } else {
      updateData = { stockQuantity };
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Stock updated successfully", 
      data: { stockQuantity: product.stockQuantity }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== toggle product status controller (admin only) ====== -->
export const toggleProductStatus = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({ 
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: product.isActive }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== toggle featured status controller (admin only) ====== -->
export const toggleFeaturedStatus = async (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({ 
      success: true,
      message: `Product ${product.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
      data: { isFeatured: product.isFeatured }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== search products controller ====== -->
export const searchProduct = async (req, res, next) => {
  const schema = Joi.object({
    searchTerm: Joi.string().required().min(2),
    skip: Joi.number().min(0).default(0),
    limit: Joi.number().min(1).max(50).default(10),
    categoryId: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { 
      searchTerm, 
      skip = 0, 
      limit = 10, 
      categoryId, 
      minPrice, 
      maxPrice 
    } = req.body;

    // Build filter object
    const filter = { 
      isActive: true,
      $text: { $search: searchTerm }
    };
    
    if (categoryId) filter.categoryId = categoryId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }

    const products = await Product.find(filter)
      .sort({ score: { $meta: "textScore" } })
      .skip(skip * limit)
      .limit(limit)
      .populate("categoryId", "categoryName")
      .select('-specifications');

    const total = await Product.countDocuments(filter);

    res.status(200).json({ 
      success: true,
      data: products,
      pagination: {
        skip,
        limit,
        total,
        hasMore: (skip * limit) + products.length < total
      }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get products near me controller ====== -->
export const getProductsNearMe = async (req, res, next) => {
  const schema = Joi.object({
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    maxDistance: Joi.number().min(1000).max(100000).default(50000),
    skip: Joi.number().min(0).default(0),
    limit: Joi.number().min(1).max(50).default(10)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  try {
    const { latitude, longitude, maxDistance = 50000, skip = 0, limit = 10 } = req.body;

    const products = await Product.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    })
      .sort({ createdAt: -1 })
      .skip(skip * limit)
      .limit(limit)
      .populate("categoryId", "categoryName")
      .select('-specifications');

    res.status(200).json({ 
      success: true,
      data: products 
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get counts for dashboard controller ====== -->
export const getCounts = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isActive: true, isFeatured: true });
    const lowStockProducts = await Product.countDocuments({ 
      isActive: true, 
      stockQuantity: { $lt: 10 } 
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        featuredProducts,
        lowStockProducts
      }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== list low stock products (admin) ====== -->
export const getLowStockProducts = async (req, res, next) => {
  const Joi = (await import("joi")).default;
  const schema = Joi.object({
    threshold: Joi.number().min(0).default(10),
    skip: Joi.number().min(0).default(0),
    limit: Joi.number().min(1).max(100).default(20),
    includeInactive: Joi.boolean().default(false),
  });

  const { error, value } = schema.validate(req.query);
  if (error) return next(error);

  const { threshold, skip, limit, includeInactive } = value;

  try {
    const filter = {
      stockQuantity: { $lt: threshold },
      ...(includeInactive ? {} : { isActive: true })
    };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select("productName stockQuantity image categoryId isActive")
        .populate("categoryId", "categoryName")
        .sort({ stockQuantity: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: { skip, limit, total }
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get all users controller ====== -->
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

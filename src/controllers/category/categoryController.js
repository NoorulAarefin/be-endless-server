import Joi from "joi";
import logger from "../../config/logger.js";
import { Categories } from "../../models/productModel/categoriesModel.js";
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
        folder: "categories",
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

// <!-- ====== add new category controller ====== -->
export const createCategory = async (req, res, next) => {
  try {
    // Validation for fields
    const loginSchema = Joi.object({
      categoryName: Joi.string().required(),
      bgColor: Joi.string(),
      image: Joi.string().uri().optional(),
    });

    const { error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { categoryName, bgColor, image } = req.body;

    let cloudinaryResult;

    // Handle image upload - either from file or URL
    if (req.file) {
      // Upload file to Cloudinary
      try {
        cloudinaryResult = await uploadToCloudinary(req.file);
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          success: false,
        });
      }
    } else if (image) {
      // Upload external URL to Cloudinary
      try {
        cloudinaryResult = await cloudinary.uploader.upload(image, {
          folder: "categories",
          resource_type: "auto",
        });
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image URL to Cloudinary",
          success: false,
        });
      }
    } else {
      return res.status(400).json({
        message: "Either image file or image URL is required",
        success: false,
      });
    }

    // Create category with Cloudinary URL
    const data = await new Categories({
      categoryName,
      image: cloudinaryResult.secure_url, // Store Cloudinary URL
      bgColor,
      isActive: true,
    }).save();

    res.status(200).json({
      message: "Category created successfully",
      success: true,
      data,
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== get category controller ====== -->
export const getCategory = async (req, res, next) => {
  try {
    const data = await Categories.find({ isActive: true })
      .sort({ categoryName: 1 })
      .collation({ locale: "en", caseLevel: true });

    res.status(200).json(data);
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== update category controller ====== -->
export const updateCategory = async (req, res, next) => {
  try {
    const loginSchema = Joi.object({
      id: Joi.string().required(),
      categoryName: Joi.string().required(),
      bgColor: Joi.string(),
      image: Joi.string().uri().optional(),
    });

    const { error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { categoryName, bgColor, id, image } = req.body;
    const updateData = {
      categoryName,
      bgColor,
    };

    // Handle image upload - either from file or URL
    if (req.file) {
      // Upload new file to Cloudinary
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file);
        updateData.image = cloudinaryResult.secure_url;
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          success: false,
        });
      }
    } else if (image) {
      // Upload external URL to Cloudinary
      try {
        const cloudinaryResult = await cloudinary.uploader.upload(image, {
          folder: "categories",
          resource_type: "auto",
        });
        updateData.image = cloudinaryResult.secure_url;
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image URL to Cloudinary",
          success: false,
        });
      }
    }

    const data = await Categories.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    res.status(200).json({ message: "Category updated successfully", data });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== delete category controller ====== -->
export const deleteCategory = async (req, res, next) => {
  const loginSchema = Joi.object({
    id: Joi.string().required(),
  });

  const { error } = loginSchema.validate(req.body);

  if (error) {
    return next(error);
  }

  const { id } = req.body;

  try {
    const data = await Categories.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      { new: true },
    );

    res
      .status(200)
      .json({ message: "Category deleted successfully", data, success: true });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

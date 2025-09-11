import Joi from "joi";
import { HeroBanner } from "../../models/heroBanner/heroBannerModel.js";
import logger from "../../config/logger.js";
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
        folder: "hero-banners",
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

const createOrUpdateSchema = Joi.object({
  bannerId: Joi.string(),
  imageUrl: Joi.string().optional(),
  heading: Joi.string().required(),
  subheading: Joi.string().allow(""),
  ctaText: Joi.string().allow(""),
  ctaUrl: Joi.string().uri().allow(""),
  sortOrder: Joi.number().min(0),
  isActive: Joi.boolean().default(false)
});

export const upsertBanner = async (req, res, next) => {
  try {
    const { error } = createOrUpdateSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { bannerId, isActive, imageUrl, ...data } = req.body;

    let cloudinaryResult;
    let finalImageUrl = imageUrl;

    // Handle image upload - either from file or URL
    if (req.file) {
      // Upload file to Cloudinary
      try {
        cloudinaryResult = await uploadToCloudinary(req.file);
        finalImageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          success: false,
        });
      }
    } else if (imageUrl) {
      // Upload external URL to Cloudinary
      try {
        cloudinaryResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "hero-banners",
          resource_type: "auto",
        });
        finalImageUrl = cloudinaryResult.secure_url;
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

    // Check for duplicate sortOrder
    if (data.sortOrder !== undefined) {
      const existingBanner = await HeroBanner.findOne({ 
        sortOrder: data.sortOrder,
        ...(bannerId ? { _id: { $ne: bannerId } } : {})
      });
      
      if (existingBanner) {
        return res.status(400).json({
          success: false,
          message: `A banner with sort order ${data.sortOrder} already exists`
        });
      }
    }

    if (isActive) {
      const activeCount = await HeroBanner.countDocuments({ isActive: true });
      if (activeCount >= 3) {
        if (bannerId) {
          const existing = await HeroBanner.findById(bannerId).select("isActive");
          if (!existing) {
            return res.status(404).json({ success: false, message: "Banner not found" });
          }
          if (!existing.isActive) {
            return res.status(400).json({ success: false, message: "Maximum of 3 active banners reached. Deactivate one before activating another." });
          }
        } else {
          return res.status(400).json({ success: false, message: "Maximum of 3 active banners reached. Deactivate one before activating another." });
        }
      }
    }

    let banner;
    if (bannerId) {
      banner = await HeroBanner.findByIdAndUpdate(
        bannerId,
        { ...data, imageUrl: finalImageUrl, ...(isActive !== undefined ? { isActive } : {}) },
        { new: true, runValidators: true }
      );
      if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
      }
    } else {
      banner = await new HeroBanner({ ...data, imageUrl: finalImageUrl, isActive: !!isActive }).save();
    }

    res.status(bannerId ? 200 : 201).json({
      success: true,
      message: bannerId ? "Banner updated successfully" : "Banner created successfully",
      data: banner
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

export const listBanners = async (req, res, next) => {
  try {
    const banners = await HeroBanner.find().sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

export const toggleBannerActive = async (req, res, next) => {
  try {
    const schema = Joi.object({ bannerId: Joi.string().required(), isActive: Joi.boolean().required() });
    const { error } = schema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { bannerId, isActive } = req.body;

    if (isActive) {
      const activeCount = await HeroBanner.countDocuments({ isActive: true });
      const existing = await HeroBanner.findById(bannerId).select("isActive");
      if (!existing) {
        return res.status(404).json({ success: false, message: "Banner not found" });
      }
      if (!existing.isActive && activeCount >= 3) {
        return res.status(400).json({ success: false, message: "Maximum of 3 active banners reached. Deactivate one before activating another." });
      }
    }

    const banner = await HeroBanner.findByIdAndUpdate(
      bannerId,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, data: banner });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const schema = Joi.object({ bannerId: Joi.string().required() });
    const { error } = schema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { bannerId } = req.body;

    const banner = await HeroBanner.findByIdAndDelete(bannerId);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Banner deleted successfully",
      data: banner 
    });
  } catch (err) {
    logger.error(err.message);
    return next(err);
  }
};



import Joi from "joi";
import { HeroBanner } from "../../models/heroBanner/heroBannerModel.js";
import logger from "../../config/logger.js";

const createOrUpdateSchema = Joi.object({
  bannerId: Joi.string(),
  imageUrl: Joi.string().uri().required(),
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

    const { bannerId, isActive, ...data } = req.body;

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
        { ...data, ...(isActive !== undefined ? { isActive } : {}) },
        { new: true, runValidators: true }
      );
      if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
      }
    } else {
      banner = await new HeroBanner({ ...data, isActive: !!isActive }).save();
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



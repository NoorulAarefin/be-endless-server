import { User } from "../../models/authModel/userModel.js";
import CustomErrorHandler from "../../services/customErrorHandler.js";
import logger from "../../config/logger.js";

// GET /user/addresses
export const getUserAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "homeAddress workAddress additionalAddresses"
    );
    if (!user) {
      return next(CustomErrorHandler.notFound("User not found"));
    }
    res.status(200).json({
      homeAddress: user.homeAddress,
      workAddress: user.workAddress,
      additionalAddresses: user.additionalAddresses || [],
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// POST /user/addresses/additional
export const addAdditionalAddress = async (req, res, next) => {
  const addressSchema = {
    label: "Other",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    location: undefined,
  };
  const Joi = (await import("joi")).default;
  const locationSchema = Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  });
  const schema = Joi.object({
    label: Joi.string().default("Other"),
    street: Joi.string().allow(""),
    city: Joi.string().allow(""),
    state: Joi.string().allow(""),
    postalCode: Joi.string().allow(""),
    country: Joi.string().allow(""),
    location: locationSchema.required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(CustomErrorHandler.notFound("User not found"));
    }
    user.additionalAddresses.push({ ...addressSchema, ...value });
    await user.save();
    res.status(201).json({ message: "Additional address added successfully", additionalAddresses: user.additionalAddresses });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// PUT /user/addresses
export const updateUserAddresses = async (req, res, next) => {
  const Joi = (await import("joi")).default;
  const locationSchema = Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  });
  const addressSchema = Joi.object({
    label: Joi.string().default("Other"),
    street: Joi.string().allow(""),
    city: Joi.string().allow(""),
    state: Joi.string().allow(""),
    postalCode: Joi.string().allow(""),
    country: Joi.string().allow(""),
    location: locationSchema.required(),
  });
  const schema = Joi.object({
    homeAddress: addressSchema.optional(),
    workAddress: addressSchema.optional(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(CustomErrorHandler.notFound("User not found"));
    }
    if (value.homeAddress) {
      user.homeAddress = value.homeAddress;
    }
    if (value.workAddress) {
      user.workAddress = value.workAddress;
    }
    await user.save();
    res.status(200).json({ message: "Addresses updated successfully", homeAddress: user.homeAddress, workAddress: user.workAddress });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// PATCH /user/addresses/additional/:id
export const updateAdditionalAddress = async (req, res, next) => {
  const Joi = (await import("joi")).default;
  const locationSchema = Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  });
  const addressSchema = Joi.object({
    label: Joi.string().default("Other"),
    street: Joi.string().allow(""),
    city: Joi.string().allow(""),
    state: Joi.string().allow(""),
    postalCode: Joi.string().allow(""),
    country: Joi.string().allow(""),
    location: locationSchema.optional(),
  });
  const { error, value } = addressSchema.validate(req.body);
  if (error) {
    return next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(CustomErrorHandler.notFound("User not found"));
    }
    const address = user.additionalAddresses.id(req.params.id);
    if (!address) {
      return next(CustomErrorHandler.notFound("Address not found"));
    }
    Object.assign(address, value);
    await user.save();
    res.status(200).json({ message: "Additional address updated successfully", address });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// DELETE /user/addresses/additional/:id
export const deleteAdditionalAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(CustomErrorHandler.notFound("User not found"));
    }
    const address = user.additionalAddresses.id(req.params.id);
    if (!address) {
      return next(CustomErrorHandler.notFound("Address not found"));
    }
    address.remove();
    await user.save();
    res.status(200).json({ message: "Additional address deleted successfully" });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
}; 
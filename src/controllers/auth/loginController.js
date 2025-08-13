import Joi from "joi";
import bcrypt from "bcrypt";

import CustomErrorHandler from "../../services/customErrorHandler.js";
import JwtService from "../../services/JwtService.js";

import { User } from "../../models/authModel/userModel.js";
// import { VerificationToken } from "../../models/authModel/verifyTokenModel.js"; // TEMPORARILY DISABLED
import { RefreshToken } from "../../models/authModel/refreshTokenModel.js";

// import sendEmail from "../../utils/sendEmail.js"; // TEMPORARILY DISABLED
// import otpGenerator from "otp-generator"; // TEMPORARILY DISABLED
import logger from "../../config/logger.js";
import { Config } from "../../config/index.js";

// <!-- ====== login controller ====== -->
const login = async (req, res, next) => {
  const { email, password } = req.body; // fcmToken removed - Firebase not needed

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    // fcmToken: Joi.string(), // FCM token validation disabled - Firebase not needed
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  try {
    // check user in the database
    const user = await User.findOne({
      email,
    });

    //if not user sending error with message through custom errror handler
    if (!user) {
      return next(CustomErrorHandler.wrongCredentials());
    }

    // compare the password
    const match = await bcrypt.compare(password, user.password);

    //if not match sending error with message through custom errror handler
    if (!match) {
      return next(CustomErrorHandler.wrongCredentials());
    }

    // check user verified or not if not verified then this code execute.
    // TEMPORARILY DISABLED: Email verification check bypassed
    /*
    if (!user.verified) {
      // cheaking in verificationToken schema token is present or not we have to send verification token on mail
      let verifyToken = await VerificationToken.findOne({ userId: user._id });

      // if not token we craete new token with user id
      if (!verifyToken) {
        const otp = otpGenerator.generate(4, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });

        verifyToken = await new VerificationToken({
          userId: user._id,
          otp: otp,
        }).save();
      }

      //sending mail this is our mail sending function in
      //this function we send userName,email,subject of mail,Url, and sub
      // sub is key word in our sendMail function we check through sub for sending email templates
      // await sendEmail({
      //   data: {
      //     name: user.fullName,
      //     email: user.email,
      //     subject: "Email Verification",
      //     sub: "verifyEmail",
      //     otp: verifyToken.otp,
      //   },
      // });

      return res
        .status(201)
        .json({ message: "User not verified. Email verification temporarily disabled." });
    }
    */

    // FCM token update disabled - Firebase not needed for now
    // if (fcmToken) {
    //   user.fcmToken = req.body.fcmToken;
    //   await user.save();
    // }

    // creating access token
    const access_token = JwtService.sign({ _id: user._id });
    var accessData = JwtService.verify(access_token);

    var unixTime = accessData.exp;
    const expiryDate = new Date(unixTime * 1000);
    // creating refresh token
    const refresh_token = JwtService.sign(
      { _id: user._id },
      "1y",
      Config.REFRESH_SECRET,
    );

    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    // saving refresh token to database for authentication if access token is expired we got request for new access token with refresh token.
    // we check the refresh token is valid with stored refresh token

    await RefreshToken.create({ token: refresh_token, userId: user.id });

    res.status(201).json({
      success: true,
      access_token,
      refresh_token,
      expiryDate,
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

export default login;

// <!-- ====== dashboard login controller ====== -->
export const dashboardLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  try {
    // check user in the database
    const user = await User.findOne({
      email,
    });

    //if not user sending error with message through custom errror handler
    if (!user) {
      return next(CustomErrorHandler.wrongCredentials());
    }

    // compare the password
    const match = await bcrypt.compare(password, user.password);

    //if not match sending error with message through custom errror handler
    if (!match) {
      return next(CustomErrorHandler.wrongCredentials());
    }

    if (user.role == "admin") {
      const access_token = JwtService.sign({ _id: user._id });

      // creating refresh token
      const refresh_token = JwtService.sign(
        { _id: user._id },
        "1y",
        Config.REFRESH_SECRET,
      );

      await RefreshToken.create({ token: refresh_token, userId: user.id });

      const userWithoutPassword = { ...user.toObject() };
      delete userWithoutPassword.password;

      res.status(201).json({
        success: true,
        access_token,
        refresh_token,
        user: userWithoutPassword,
      });
    } else {
      return next(CustomErrorHandler.wrongCredentials());
    }
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

// <!-- ====== profile controller ====== -->
export const myProfile = async (req, res, next) => {
  if (!req.user) {
    return next(CustomErrorHandler.notFound());
  }

  try {
    const user = await User.findById(req.user._id).select(
      "-password -updatedAt -__v",
    );

    res.status(200).json({ data: user });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(CustomErrorHandler.notFound());
    }
    const { name, mobileNumber, email, avatar } = req.body;
    const updateFields = {
      fullName: name,
      email: email,
      mobileNo: mobileNumber,
    };
    if (avatar) {
      updateFields.avatar = avatar;
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true },
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};
// <!-- ====== logout controller ====== -->
export const logout = async (req, res, next) => {
  try {
    // deleting refresh token from database
    await RefreshToken.deleteMany({ userId: req.user._id });

    res.status(201).json({ message: "successfuly logout" });
  } catch (err) {
    logger.error(err);
    return next(err);
  }
};

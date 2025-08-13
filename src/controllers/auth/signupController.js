import Joi from "joi";
import bcrypt from "bcrypt";
// import otpGenerator from "otp-generator"; // TEMPORARILY DISABLED

// import sendEmail from "../../utils/sendEmail.js"; // TEMPORARILY DISABLED
import logger from "../../config/logger.js";
import CustomErrorHandler from "../../services/customErrorHandler.js";

import { User } from "../../models/authModel/userModel.js";
// import { VerificationToken } from "../../models/authModel/verifyTokenModel.js"; // TEMPORARILY DISABLED

// <!-- ====== signup controller ====== -->
const signup = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      city,
      postalCode,
      mobileNo,
      dateOfBirth,
      gender
    } = req.body;

    const schema = Joi.object({
      fullName: Joi.string().min(3).max(30).required(),
      email: Joi.string()
        .email()
        .required()
        .pattern(new RegExp("^[a-zA-Z0-9.@]+$"))
        .message("Email address not valid"),
      password: Joi.string().min(6).max(20).messages({
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot be longer than 20 characters",
        "any.required": "Password is required",
      }),
      role: Joi.string().valid('user', 'admin').default('user'),
      city: Joi.string().allow(""),
      postalCode: Joi.string().allow(""),
      dateOfBirth: Joi.date(),
      mobileNo: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
          "string.pattern.base": "Mobile Number must be exactly 10 digits",
          "string.empty": "Mobile Number cannot be empty"
        }),
      gender: Joi.string(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(error);
    }

    // check if user is in the database already
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      // TEMPORARILY DISABLED: Email verification logic bypassed
      /*
      if (!existingUser.verified)
        // User exists but not verified, resend OTP
        let verifyToken = await VerificationToken.findOne({ userId: existingUser._id });
        let otp;
        if (!verifyToken) {
          otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
          });
          verifyToken = await new VerificationToken({
            userId: existingUser._id,
            otp: otp,
          }).save();
        } else {
          // Generate a new OTP and update the token
          otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
          });
          verifyToken.otp = otp;
          await verifyToken.save();
        }

        // Resend verification email
        // await sendEmail({
        //   data: {
        //     name: existingUser.fullName,
        //     email: existingUser.email,
        //     subject: "Email Verification ",
        //     sub: "verifyEmail",
        //     otp: otp,
        //   },
        // });

        return res.status(409).json({
          message: "Registration not completed — please verify to continue. A new OTP has been sent to your email.",
        });
      else
      */
      return next(
        CustomErrorHandler.alreadyExists(
          "This email address has already been registered",
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const backgroundColors = [
      "e57f7f",
      "69a69d",
      "7a9461",
      "98b8e1",
      "e0d084",
      "516087",
      "ab9f8e",
      "c150ad",
      "be94eb",
      "a6a7ae",
    ];

    const randomBackgroundColor =
      backgroundColors[Math.floor(Math.random() * backgroundColors.length)];

    // prepare the model
    const user = await new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      city,
      postalCode,
      dateOfBirth,
      gender,
      mobileNo,
      avatar: `https://ui-avatars.com/api/?name=${fullName}&&color=fff&&background=${randomBackgroundColor}&&rounded=true&&font-size=0.44`,
      verified: true, // TEMPORARILY AUTO-VERIFY USERS SINCE EMAIL IS DISABLED
    }).save();

    // TEMPORARILY DISABLED: OTP generation and verification token creation
    /*
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await new VerificationToken({
      userId: user._id,
      otp: otp,
    }).save();
    */

    //sending mail
    // await sendEmail({
    //   data: {
    //     name: user.fullName,
    //     email: user.email,
    //     subject: "Email Verification ",
    //     sub: "verifyEmail",
    //     otp: otp,
    //   },
    // });

    res
      .status(201)
      .send({ 
        success: true,
        message: "User registered successfully. Email verification temporarily disabled.",
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

export default signup;

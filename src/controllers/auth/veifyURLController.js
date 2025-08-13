import { User } from "../../models/authModel/userModel.js";
import { VerificationToken } from "../../models/authModel/verifyTokenModel.js";

import logger from "../../config/logger.js";
import CustomErrorHandler from "../../services/customErrorHandler.js";

// <!-- ====== otp-verify controller ====== -->
const verify = async (req, res, next) => {
  try {
    let otp = await VerificationToken.findOne({
      otp: req.body.otp,
    });

    if (!otp) return next(CustomErrorHandler.invalid("Invalid Otp"));

    let user = await User.findOne({ _id: otp.userId }).select("-password");

    if (!user) return next(CustomErrorHandler.invalid("User not found"));

    user.verified = true;
    await user.save();

    await otp.deleteOne();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

export default verify;

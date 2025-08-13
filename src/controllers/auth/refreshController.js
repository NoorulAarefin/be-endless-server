import Joi from "joi";
import JwtService from "../../services/JwtService.js";
import CustomErrorHandler from "../../services/customErrorHandler.js";
import logger from "../../config/logger.js";

import { RefreshToken } from "../../models/authModel/refreshTokenModel.js";
import { User } from "../../models/authModel/userModel.js";
import { Config } from "../../config/index.js";

// <!-- ====== refresh token controller ====== -->
const refreshController = async (req, res, next) => {
  const schema = Joi.object({
    refresh_token: Joi.string().required(),
  });

  const { error } = schema.validate(req.params);

  if (error) {
    return next(error);
  }

  try {
    let userId;

    const { _id } = await JwtService.verify(
      req.params.refresh_token,
      Config.REFRESH_SECRET,
    );

    userId = _id;

    const refreshtoken = await RefreshToken.findOne({
      userId: userId,
      token: req.params.refresh_token,
    });

    if (!refreshtoken) {
      return next(CustomErrorHandler.unAuthorized("Invalid refresh token"));
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return next(CustomErrorHandler.unAuthorized("No user found!"));
    }

    const access_token = JwtService.sign({ _id: user._id });

    const refresh_token = JwtService.sign(
      { _id: user._id },
      "1y",
      Config.REFRESH_SECRET,
    );

    await RefreshToken.updateOne({ userId: user.id }, { token: refresh_token });

    res.status(200).json({ access_token, refresh_token });
  } catch (error) {
    logger.error(error.message);
    return next(error);
  }
};

export default refreshController;

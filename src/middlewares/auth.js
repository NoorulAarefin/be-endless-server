import { User } from "../models/authModel/userModel.js";
import JwtService from "../services/JwtService.js";
import CustomErrorHandler from "../services/customErrorHandler.js";

export const isAuthenticated = async (req, res, next) => {
  let authHeader = req.headers.authorization;

  if (!authHeader) return next(CustomErrorHandler.unAuthorized());

  try {
    const jwtToken = authHeader.split(" ")[1];

    if (!jwtToken) return next(CustomErrorHandler.unAuthorized());

    const { _id } = await JwtService.verify(jwtToken);

    const user = {
      _id,
    };
    req.user = user;
    next();
  } catch (error) {
    return next(CustomErrorHandler.unAuthorized());
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id });

    if (user.role === "admin") {
      next();
    } else {
      return next(
        CustomErrorHandler.unAuthorized(
          "You do not have permission to engage in that activity.",
        ),
      );
    }
  } catch (err) {
    return next(CustomErrorHandler.serverError(err.message));
  }
};

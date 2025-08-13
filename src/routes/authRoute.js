import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";

import signup from "../controllers/auth/signupController.js";
import login, {
  dashboardLogin,
  logout,
  myProfile,
  updateProfile,
} from "../controllers/auth/loginController.js";
import verify from "../controllers/auth/veifyURLController.js";
import refreshController from "../controllers/auth/refreshController.js";
import { getUserAddresses, addAdditionalAddress, updateUserAddresses, updateAdditionalAddress, deleteAdditionalAddress } from "../controllers/auth/userAddressController.js";

const router = express.Router();

// <!-- ====== signup route ====== -->
router.post("/signup", signup);

// <!-- ====== login route ====== -->
router.post("/login", login);

// <!-- ====== Admin dashboard login route ====== -->
router.post("/dashboard-login", dashboardLogin);

// <!-- ====== profile route ====== -->
router.post("/me", isAuthenticated, myProfile);
router.post("/update-profile", isAuthenticated, updateProfile);

// <!-- ====== otp-verify route ====== -->
router.post("/otp-verify", verify);

// <!-- ====== refresh token route ====== -->
router.get("/refresh/:refresh_token", refreshController);

// <!-- ====== logout route ====== -->
router.post("/logout", isAuthenticated, logout);

// Add route for getting user addresses
router.get("/user/addresses", isAuthenticated, getUserAddresses);

// Add route for adding an additional address
router.post("/user/addresses/additional", isAuthenticated, addAdditionalAddress);

// Add route for updating home/work addresses
router.put("/user/addresses", isAuthenticated, updateUserAddresses);

// Add route for updating an additional address
router.patch("/user/addresses/additional/:id", isAuthenticated, updateAdditionalAddress);
// Add route for deleting an additional address
router.delete("/user/addresses/additional/:id", isAuthenticated, deleteAdditionalAddress);

export default router;

import { Router } from "express";
import {
  confirmPassword,
  forgetPassword,
  login,
  logout,
  register,
  verifyOtp,
} from "../../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forget-password", forgetPassword);

export default router;

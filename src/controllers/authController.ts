import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  createOTP,
  getOtpByPhone,
  getUserByPhone,
  updateOTP,
} from "../services/authServices";
import { checkOtpErrorIfSameDate, checkOtpRow, checkUserExits } from "../utlis/auth";
import { generateOTP, generateToken } from "../utlis/generate";
import * as bcrypt from "bcrypt"; // Import bcryptjs for password hashi
import moment from "moment";

export const register = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 10, max: 12 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserExits(user);

    // OTP Sendig logic here
    // Generate OTP && call OTP sendin api
    // if not sms sent,

    const otp = 123456; //for testing
    // const otp = generateOTP();
    const token = generateToken();
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);

    // save opt add db
    const otpRow = await getOtpByPhone(phone);

    let result;
    // Never request OTP before

    if (!otpRow) {
      const otpData = {
        phone,
        otp: hashOtp,
        rememberToken: token,
        count: 1,
      };

      result = await createOTP(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = lastOtpRequest === today;
      checkOtpErrorIfSameDate(isSameDate, otpRow.error);

      if (!isSameDate) {
        const otpData = {
          otp: hashOtp,
          rememberToken: token,
          count: 1,
          error: 0,
        };
        result = await updateOTP(otpRow.id, otpData);
      } else {
        if (otpRow.count === 3) {
          const error: any = new Error("OTP allowed is 3 times on per day");
          error.status = 405;
          error.code = "Error_OverLimit";
          return next(error);
        } else {
          const otpData = {
            otp: hashOtp,
            rememberToken: token,
            count: {
              increment: 1,
            },
          };
          result = await updateOTP(otpRow.id, otpData);
        }
      }
    }

    // console.log(result);
    res.status(200).json({
      message: `we are sending to OTP ${result.phone}`,
      phone: result.phone,
      token: result.rememberToken,
    });
  },
];

export const verifyOtp = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid_OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid_Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExits(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpVerify === today;
    //  If the otp verify  is  in the same date and limit
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // Token is wrong
    if (otpRow?.rememberToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOTP(otpRow!.id, otpData);
      const error: any = new Error("Invalid Token");
      error.status = 400;
      error.code = "Error-Invalid";
      return next(error);
    }

    //  OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
    if (isExpired) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = "Error_Expired";
      return next(error);
    }

    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
    //  Otp is wrong
    if (!isMatchOtp) {
      //  if OTP is wrong, first time on Today
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOTP(otpRow!.id, otpData);
      } else {
        // if otp is not first time on today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOTP(otpRow!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      error.status = 401;
      error.code = "Error_InvalidOtp";
      return next(error);
    }

    // ALl Otp ok
    const verifyToken = generateOTP();
    const otpData = {
      verifyToken,
      error: 0,
      count: 1,
    };
    const result = await updateOTP(otpRow!.id, otpData);

    res.status(200).json({
      message: "Otp is successfully verified",
      phone: result.phone,
      token: result.verifyToken,
    });
  },
];

export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "confirmPassword" });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "login" });
};

import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  createOTP,
  createUser,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
  updateUSER,
} from "../services/authService";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExits,
  checkUserIfNotExits,
} from "../utlis/auth";
import { generateOTP, generateToken } from "../utlis/generate";
import * as bcrypt from "bcrypt"; // Import bcryptjs for password hashing
import moment from "moment";
import jwt from "jsonwebtoken";

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
        result = await updateOtp(otpRow.id, otpData);
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
          result = await updateOtp(otpRow.id, otpData);
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
      await updateOtp(otpRow!.id, otpData);
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
        await updateOtp(otpRow!.id, otpData);
      } else {
        // if otp is not first time on today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      error.status = 401;
      error.code = "Error_InvalidOtp";
      return next(error);
    }

    // ALl Otp ok
    const verifyToken = generateToken();
    // console.log(typeof(verifyToken));
    // const hashVerifyToken = await bcrypt.hash(verifyToken.toString(), 10);
    // console.log(typeof(hashVerifyToken));
    const otpData = {
      verifyToken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "Otp is successfully verified",
      phone: result.phone,
      token: result.verifyToken,
    });
  },
];

// sending OTP --> verify OTP --> confirm-password ---> New account
export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Psaassword must be 8 digits")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid_Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const { phone, password, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExits(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    // Otp occurs is over limit
    if (otpRow?.error === 5) {
      const error: any = new Error("This request must be attacked");
      error.status = 400;
      error.code = "Error_BadRequest";
      return next(error);
    }

    // Token is wrong
    if (otpRow?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      const error: any = new Error("Invalid Token");
      error.status = 400;
      error.code = "Error-Invalid";
      return next(error);
    }

    // required expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 10;
    if (isExpired) {
      const error: any = new Error("Your request is expired,Please Try again");
      error.status = 403;
      error.code = "Error_Expired";
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const randomToken = "this token will be replace soon";

    // create new account
    const userData = {
      phone,
      password: hashPassword,
      randomToken,
    };

    const newUser = await createUser(userData);

    const accessTokenPayload = { id: newUser.id };
    const refreshTokenPayload = { id: newUser.id, phone: newUser.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15,
      }
    );
    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    // updateing token with refrsh token
    const userUpdateData = {
      randomToken: refreshToken,
    };

    await updateUSER(newUser.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 60 * 15 * 1000, // 15 minutes
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      .status(201)
      .json({
        message: "Your account is successfully created",
        userId: newUser.id,
      });
  },
];

export const login = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Psaassword must be 8 digits")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid_Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const { phone, password } = req.body;
    const user = await getUserByPhone(phone);
    checkUserIfNotExits(user);

    // if wrong password is over limit
    if (user?.status === "FREEZE") {
      const error: any = new Error(
        "Your phone number is temporary locked .Please contact us"
      );

      error.status = 401;
      error.code = "Error_FREEZE";
      return next(error);
    };


    // check password
    const isMatchPassword = await bcrypt.compare(password, user!.password);
    if(!isMatchPassword) {
      // Staring records wrong times
        
      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest === new Date().toLocaleDateString();
      if(!isSameDate) {
        // today password is wrong first time
        const userData = {
          errorLoginCount:1,
        };
        await updateUSER(user!.id, userData);;
      }
      // if  passworin wrong 2 times
      else
        if(user!.errorLoginCount >=2) {
//  Today password is wrong
        const userData = {
          status: "FREEZE",
        }
        await updateUSER(user!.id, userData);
 
        }else {
          // Today pasword wrong is one times
          const userData = {
            errorLoginCount: { increment: 1 },
          };
          await updateUSER(user!.id, userData);
        }

      // Ending
      const error: any = new Error("Password is incorrect");
      error.status = 401;
      error.code = "Error_InvalidPassword";
      return next(error);
    }


    res.status(200).json({ message: "login" });
  },
];

import  { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import {
  createOTP,
  createUser,
  getOtpByPhone,
  getUserById,
  getUserByPhone,
  updateOtp,
  updateUser,
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
import { errorCode } from "../../config/errorCode";
import { createError } from "../utlis/error";

export const register = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 10, max: 12 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      
      return next(createError(
        errors[0].msg,
        400,
        errorCode.invalid
      ));
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
        
          return next(createError(
            "OTP allowed is 3 times on per day",
            405,
            errorCode.overLimit
          ));
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
      return next(createError(errors[0].msg, 400, errorCode.invalid));
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
      //  if OTP is wrong, first time on Today
      return next(createError(
        "Invalid Token",
        400,
        errorCode.invalid
      ));
    }

    //  OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
    if (isExpired) {
      
      return next(createError(
        "OTP is expired",
        403,
        errorCode.otpExpired
      ));
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
     
      return next(createError(
        "OTP is incorrect",
        401,
        errorCode.invalid
      ));
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
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { phone, password, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExits(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    // Otp occurs is over limit
    if (otpRow?.error === 5) {
      
      return next(createError(
        "This request must be attacked.please try again tomorrow",
        400,
        errorCode.attack
      ));
    }

    // Token is wrong
    if (otpRow?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      
      return next(createError(
        "Invalid Token",
        400,
        errorCode.invalid
      ));
    }

    // required expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 10;
    if (isExpired) {
      
      return next(createError(
        "Your request is expired,Please Try again",
        403,
        errorCode.requestExpired
      ));
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
        expiresIn: 60 * 15, //15min
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

    await updateUser(newUser.id, userUpdateData);

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
  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),

  async (req: Request, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(
        errors[0].msg,
        400,
        errorCode.invalid
      ));
    }

    const password = req.body.password;
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExits(user);

    // if wrong password is over limit
    if (user?.status === "FREEZE") {
     
      return next(createError(
        "Your phone number is temporarily locked .Please contact us",
        401,
        errorCode.accountFreeze
      ));
    }

    // password check
    const isMatchPassword = await bcrypt.compare(password, user!.password);
    if (!isMatchPassword) {
      // Staring records wrong times

      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest === new Date().toLocaleDateString();

      if (!isSameDate) {
        const userData = {
          errorLoginCount: 1,
        };
        await updateUser(user!.id, userData);
      } else {
        // Today password was wrong 2 times
        if (user!.errorLoginCount >= 2) {
          const userData = {
            status: "FREEZE",
          };
          await updateUser(user!.id, userData);
        } else {
          // Today password was wrong one time
          const userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
          await updateUser(user!.id, userData);
        }
      }

      // Ending
      
      return next(createError(
        req.t("wrongPasswd"),
        401,
        errorCode.invalid 
      ));
    }

    // Authorization token
    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    const userData = {
      errorLoginCount: 0, // reset error count
      randomToken: refreshToken,
    };

    await updateUser(user!.id, userData);

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
      .status(200)
      .json({ message: "Login Successfully", userId: user!.id });
  },
];

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // clear http only cookies
  // update randomToken in user Table

  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  if (!refreshToken) {
    
    return next(createError(
      "You are not authenticated user",
      401,
      errorCode.unauthenticated
    ));
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      id: number;
      phone: string;
    };
  } catch (err: any) {
    
    return next(createError(
      "You are not authenticated user",
      401,
      errorCode.unauthenticated
    ));
  }

  if (isNaN(decoded.id)) {
    
    return next(createError(
      "You are not an authenticated user",
      401,
      errorCode.unauthenticated
    ));
  }

  const user = await getUserById(decoded.id);
  checkUserIfNotExits(user);

  if (user!.phone !== decoded.phone) {
   
    return next(createError(
      "You are not authenticated user",
      401,
      errorCode.unauthenticated
    ));
  }

  const userData = {
    randomToken: generateToken(), // generate new token
  };
  await updateUser(user!.id, userData);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });
  // clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });

  res.status(200).json({ message: "Successfully logged out.See you soon" });
};

export const forgetPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: Request, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    let phone = req.body.phone;

    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExits(user);


    //OTP sending logic here
    // Generate OTP && calll api
    // if sms otp cannot be sent,response error



    const otp = 123456;
    //  const otp = await generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token    =  generateToken();


    const otpRow = await getOtpByPhone(phone);
    // Warning -users change their phone number

    let result ;

    const lastOtpRequest = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpRequest === today;
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    if(!isSameDate){
     const otpData= {
      otp: hashOtp,
      rememberToken: token,
      count: 1,
      error:0
     }
      result = await updateOtp(otpRow!.id,otpData);
    }else {
        if(otpRow!.count === 5){
          // if otp is over limit
          return next(
            createError(
              "OTP allowed is 3 times on per day",
              405,
              errorCode.overLimit
            )
          );
        }else {
          const otpData = {
            otp: hashOtp,
            rememberToken: token,
            count: otpRow!.count +1
          };
          result = await updateOtp(otpRow!.id, otpData);
        }
    }


    res.status(200).json({
       message:`We are sending opt {result.phone} number`,
       phone: result.phone,
      token: result.rememberToken,
      });
  },
];

export const verifyOtpForPassword =[
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
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserIfNotExits(user);
    
    const otpRow = await getOtpByPhone(phone);

    const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today         =  new Date().toLocaleDateString();
    const isSameDate    =  lastOtpVerify === today; 

    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // if not same
    if(otpRow?.rememberToken !== token){
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      
      return next(
        createError(
          "Invalid Token",
          400,
          errorCode.invalid
        )
      );
    } ;

    //  OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
    if(isExpired) {
      
      return next(
        createError(
          "OTP is expired",
          403,
          errorCode.otpExpired
        )
      );
    };

    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
    //  Otp is wrong  
    if(!isMatchOtp){
      //  if OTP is wrong, first time on Today
      if(!isSameDate){
        const otpData ={
          error:1
        }

        await updateOtp(otpRow!.id, otpData);
      }else {
        // if otp is not first time on today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }

      
      return next(createError(
        "OTP is incorrect",
        401,
        errorCode.invalid
      ));
    }
    

    // ALL OTP is OK
   const verifyToken = generateToken();
    const otpData={
      verifyToken,
      error:0,
      count:1
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "Otp is successfully verified to reset password",
      phone: result.phone,
      token: result.verifyToken,
    });
    
  }
  ];

  export const resetPassword =[
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  
  body("token", "Invalid_Token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
    return next(createError(errors[0].msg, 400, errorCode.invalid));
    }


    const {phone ,token ,password} =req.body;

    const user = await getUserByPhone(phone);
    checkUserIfNotExits(user);

    const otpRow = await getOtpByPhone(phone);

    if(otpRow?.error === 5){
      
      return next(
        createError(
          "This request must be attacked.please try again tomorrow",
          400,
          errorCode.attack
        )

      );
    };

    if(otpRow?.verifyToken !== token){
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      
      return next(
        createError(
          "Invalid Token",
          400,
          errorCode.invalid
        )
      );
    };
    // required expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") >5;
    if(isExpired) {
      // required expired
      return next(
        createError(
          "Your request is expired,Please Try again",
          403,
          errorCode.requestExpired
        )
      );
    };

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // jwt token
    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };
    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    const userUpdateData ={
      password: hashPassword,
      randomToken: refreshToken,
      
    };

     await updateUser(user!.id, userUpdateData);

     res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 60 * 15 * 1000, // 15 minutes
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      .status(200)
      .json({ 
        message: "Password reset successfully" ,
        userId:user!.id,
      });
     }
  
];

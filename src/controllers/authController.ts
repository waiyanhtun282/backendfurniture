import  { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

 export const register =
 [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits")
  ,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log({errors: errors.array()});
    }
    res.status(200).json({ message: "register success" });
  }
];

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "verifyOtp" });
};

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

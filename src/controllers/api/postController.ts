import { Response, Request, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";

export const getPost = [
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
     res.status(200).json({
       message: "OK",
     });
  }
   
];

export const getPostByPagination = [
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

    res.status(200).json({
        message:"OK"
    })
  },
];
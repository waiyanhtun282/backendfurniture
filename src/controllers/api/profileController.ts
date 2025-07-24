import { Response, Request, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";

import { getUserById } from "../../services/authService";
import { checkUserIfNotExits } from "../../utlis/auth";
import { authorise } from "../../utlis/authorise";

interface CutomerRequest extends Request {
  userId?: number;
}
export const changeLanguage = [
  query("lng", "Invalid language code!.")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$")
    .isLength({ min: 2, max: 3 }),
  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { lng } = req.body;
    res.cookie("i18next", lng);

    res.status(200).json({
      message: req.t("changeLan", { lang: lng }),
    });
  },
];

export const testPermission = async (
  req: CutomerRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExits(user);

  const info: any = {
    title: "test permission",
  };

  // if user.role ="AUHTOR"
  const can =  authorise(true, user!.role, "AUTHOR");

  if ( can) {
    info.title = "You are authorised to view this page";
  }
  res.status(200).json({ info });
};


import { Request, Response, NextFunction } from "express";
interface CustomRequest extends Request {
  user?: any;
}
export const getAllUsers = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if(user.role === "ADMIN"){

  }

  res.status(200).json({ message: req.t("welcome"), currentUser: user.role });
};

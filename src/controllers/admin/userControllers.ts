
import { Request, Response, NextFunction } from "express";
interface CustomerRequest extends Request {
  user?: any;
}
export const getAllUsers = async (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if(user.role === "ADMIN"){

  }

  res.status(200).json({ message: req.t("welcome"), currentUser: user.role });
};

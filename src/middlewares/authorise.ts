import { Response, Request, NextFunction } from "express";
import { permission } from "process";
import { getUserById } from "../services/authService";
import { errorCode } from "../../config/errorCode";

interface CustomRequest extends Request {
  userId?: number;
  user?:any;
}

// authroise (true, "ADMIN","AUTHOR") //deny USER
// authroise (false, "USER") //allow "ADMIN" "USER"

export const authorise = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserById(userId!);

    if (!user) {
      const error: any = new Error("You are not an regsiter ");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const result = roles.includes(user.role);

    // permission & result

    if (permission && !result) {
      const error: any = new Error("This action is not allowed");
      error.status = 403;
      error.code = errorCode.unauthorised;
      return next(error);
    }

    if (!permission && result) {
      const error: any = new Error(
        "This action is not allowed"
      );
      error.status = 403;
      error.code = errorCode.unauthorised;
      return next(error);
    }
    req.user=user;

    next();
  };
};

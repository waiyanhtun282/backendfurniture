import { Response, Request, NextFunction } from "express";
import { getUserById } from "../services/authService";
import { errorCode } from "../../config/errorCode";
import { createError } from "../utlis/error";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}

// authroise (true, "ADMIN","AUTHOR") //deny USER
// authroise (false, "USER") //allow "ADMIN" "USER"

export const authorise = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserById(userId!);

    if (!user) {
      return next(
        createError(
          "You are not an regsiter ",
           401,
            errorCode.unauthenticated)
      );
    }

    const result = roles.includes(user.role);

    // permission & result

    if (permission && !result) {
      
      return next(createError(
        "This action is not allowed",
        403,
        errorCode.unauthorised
      ));
    }

    if (!permission && result) {
       return next(
         createError("This action is not allowed", 403, errorCode.unauthorised)
       );
    }
    req.user = user;

    next();
  };
};

import  { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
interface CustomRequest extends Request {
  userId?: number;
}
export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  if (!refreshToken) {
    const error: any = new Error("You are not authenticated user");
    error.status = 401;
    error.code = "Error_Unauthenticated";
    return next(error);
  }
  if (!accessToken) {
    const error: any = new Error("Access Token has expired");
    error.status = 401;
    error.code = "Error_AccessTokenExpired";
    return next(error);
  }

  //   verify access token
  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
        
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      error.message = "Access Token has expired";
      error.status = 401;
      error.code = "Error_AccessTokenExpired";
    } else {
      error.message = "Invalid accesstoken";
      error.status = 400;
      error.code = "Error_InvalidAccessToken";
    }
    return next(error);
  }
   req.userId = decoded.id;
  next();
};

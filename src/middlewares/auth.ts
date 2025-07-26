import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";
import { getUserById, updateUser } from "../services/authService";
import { createError } from "../utlis/error";
interface CustomRequest extends Request {
  userId?: number;
}

// api req -->
// <-- error expired res
// call refresh api -->
// <-- 2new tokens res
// api req -->c
export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  // const platform = req.headers["x-platform"];
  // if(platform === "mobile"){
  //   const accessTokenFromMobile =req.headers.authorization?.split(" ")[1];
  //   console.log("Access Token from mobile:", accessTokenFromMobile);
  // }else {
  //   console.log("Access Token from web:", );
  // }

  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  if (!refreshToken) {
   
    return next(createError("You are not authenticated user" 
      ,401,
      errorCode.unauthenticated));
  }

  const generateNewTokens = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (error) {
     return next(
       createError(
         "You are not authenticated user",
         401,
         errorCode.unauthenticated
       )
     );
    }

    if (isNaN(decoded.id)) {
     return next(
       createError(
         "You are not authenticated user",
         401,
         errorCode.unauthenticated
       )
     );
    }
    const user = await getUserById(decoded.id);
    if (!user) {
      return next(
        createError(
          "You are not authenticated user",
          401,
          errorCode.unauthenticated
        )
      );
    }

    if (user.phone !== decoded.phone) {
     return next(
       createError(
         "You are not authenticated user",
         401,
         errorCode.unauthenticated
       )
     );
    }

    if (user.randomToken !== refreshToken) {
      return next(
        createError(
          "You are not authenticated user",
          401,
          errorCode.unauthenticated
        )
      );
    }

    // Authorization token
    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };

    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );

    const newRefreshToken = jwt.sign(
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
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 60 * 15 * 1000, // 15 minutes
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

    req.userId = user.id;
    next();
  };

  if (!accessToken) {
    generateNewTokens();  //await
    // const error: any = new Error("Access Token has expired");
    // error.status = 401;
    // error.code = errorCode.accessTokenExpired;
    // return next(error);
  } else {
    //   verify access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };
      if (isNaN(decoded.id)) {
        return next(
          createError(
            "You are not authenticated user",
            401,
            errorCode.unauthenticated
          )
        );
      }
      req.userId = decoded.id;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        generateNewTokens();
        // error.message = "Access Token has expired";
        // error.status = 401;
        // error.code = errorCode.accessTokenExpired;
      } else {
       
        return next(
          createError(
            "Invalid accesstoken",
            400,
            errorCode.attack
          )
        );
      }
    }
  }
};

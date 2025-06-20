import {Request,Response,NextFunction} from 'express';
interface CustomRequest extends Request {
    userId?: number;
}
export const check  = (
    req:CustomRequest,
    res:Response,
    next:NextFunction
) => {
    const err:any =new Error("Token has expired");
    err.status =401;
    err.code ="Token_Expired";
    return next(err);
    req.userId=12345;
    next();

}
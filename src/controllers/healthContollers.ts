
import { Response,Request,NextFunction } from 'express';
interface CutomerRequest extends Request {
    userId?: number;
}
export const healthCheck = (req:CutomerRequest,res:Response,next:NextFunction) =>{
  res.status(200).json({
    message: "Server is running fine!",
    userId: req.userId,
  });
}
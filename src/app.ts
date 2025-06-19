import express, { NextFunction, urlencoded } from "express";
import { Response, Request } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";

import { check } from "./middlewares/check";
export const app = express();
app
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter);

interface CustomRequest extends Request {
  userId?: number;
}
app.get("/health", check, (req: CustomRequest, res: Response) => {
  throw new Error("new error occur");
  res.status(200).json({
    mesage: "Server is running fine!",
    user: req.userId,
  });
});

app.use((error: any, req: CustomRequest, res: Response, next: NextFunction) => {
const status =error.status || 500;
const message =error.message || " Server Error";
const errorCode =error.code || "Error_Code";
res.status(status).json({message,error:errorCode});
});

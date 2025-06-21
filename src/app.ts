import express, {  urlencoded } from "express";
import { Response, Request ,NextFunction} from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import healthRouter from "./routes/v1/health";
export const app = express();
app
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter);
  interface CutomerRequest extends Request {
    userId?: number;
  };
  
app.use("/api/v1",healthRouter);

app.use(
  (error: any, req: CutomerRequest, res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || " Server Error";
    const errorCode = error.code || "Error_Code";
    res.status(status).json({ message, error: errorCode });
  }
);

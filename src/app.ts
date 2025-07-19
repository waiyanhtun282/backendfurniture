import express, { urlencoded } from "express";
import { Response, Request, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import healthRoutes from "./routes/v1/health";
import authRoutes from "./routes/v1/auth";
import userRoutes from "./routes/v1/admins/user";
import ViewRoutes   from "./routes/v1/web/view";
import { auth } from "./middlewares/auth";
import cookieParser from "cookie-parser";
// import * as errorController from "./controllers/web/errorController";

export const app = express();

app.set('view engine', 'ejs');
app.set('views', 'src/views');

app
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter);
interface CutomerRequest extends Request {
  userId?: number;
}

app.use(express.static("public"));

app.use("/api/v1", healthRoutes);
app.use( ViewRoutes);
app.use("/api/v1",authRoutes);
app.use("/api/v1/admins", auth,userRoutes);

// app.use(errorController.notFound);


app.use(
  (error: any, req: CutomerRequest, res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || " Server Error";
    const errorCode = error.code || "Error_Code";
    res.status(status).json({ message, error: errorCode });
  }
);

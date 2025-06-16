import  express, { urlencoded }  from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";

export const app =express();
app.use(morgan("dev"));
app.use(urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

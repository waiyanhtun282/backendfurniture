import  express, { urlencoded }  from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";

export const app =express();
app.use(morgan("dev"))
   .use(urlencoded({ extended: true }))
   .use(express.json())
   .use(cors())
   .use(helmet())
   .use(compression())

import express, { urlencoded } from "express";
import { Response, Request, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import cookieParser from "cookie-parser";
import i18next from "i18next";
import middleware from "i18next-http-middleware";
import Backend from  "i18next-fs-backend";
import path from "path";
import routes from "./routes/v1"


export const app = express();

app.set('view engine', 'ejs');
app.set('views', 'src/views');


var whitelist = ["http://example1.com", "http://localhost:5173"];
var corsOptions = {
  origin: function (origin:any, callback: (err:Error | null ,origin?:any) =>void ) {
    
    if(!origin)  return callback(null, true); // Allow requests with origin (like mobile apps or Postman)
    if (whitelist.includes(origin) ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies to be sent with requests
};


app
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .use(helmet())
  .use(compression())
  .use(limiter);


  i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(
          process.cwd(),
          "src/locales",
          "{{lng}}",
          "{{ns}}.json"
        ),
      },
      detection: {
        order: ["querystring", "cookie"],
        caches: ["cookie"],
      },
      fallbackLng: "en",
      preload: ["en", "mm"],
    });

  app.use(middleware.handle(i18next))

// interface CutomerRequest extends Request {
//   userId?: number;
// }

app.use(express.static("public"));

app.use(routes);


app.use(
  (error: any, req: Request, res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || " Server Error";
    const errorCode = error.code || "Error_Code";
    res.status(status).json({ message, error: errorCode });
  }
);

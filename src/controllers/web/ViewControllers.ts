import { Request,Response,NextFunction } from "express";

export const home = (req: Request, res: Response, next: NextFunction) => {
  res.render("index", {title:"Home Screen"})
};

export const about = (req: Request, res: Response, next: NextFunction) => {
  const users =[
    { name: "Leo", age: 20 },
    { name: "John", age: 25 },
    { name: "Jane", age: 22 }
  ]
  res.render("about", { title: "About Us" ,users});
};
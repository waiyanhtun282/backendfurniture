import { Response, Request, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";
import { getUserById } from "../../services/authService";
import { checkUserIfNotExits } from "../../utlis/auth";
import { checkUploadFile } from "../../utlis/check";
import ImageQueue from "../../jobs/queues/imageQueue";
import { createOnePost, PostArgs } from "../../services/postService";

interface CutomerRequest extends Request {
  userId?: number;
};

export const createPost = [
  body("title", "Tile is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required").trim().notEmpty().escape(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tags is required").optional({nullable:true}).customSanitizer( (value) =>{
     if(value) {
        return value.split(",").filter( (tag :string) => tag.trim() !== "" )
     };
     return value;
  } ),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const  { title , content ,body , category ,type ,tags} =req.body;

    const userId =req.userId;
    const image =req.file;

    const user = await getUserById(userId!);
    checkUserIfNotExits(user);
    checkUploadFile(image);

    const splitFileName =req.file?.filename.split('.')[0];

    await ImageQueue.add(
      "optimize-image",
      {
        filePath: req.file?.path,
        fileName: `${splitFileName}.webp`,
        width: 835,
        height: 577,
        quality: 100,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );

    const data:PostArgs ={
      title,
      content,
      body,
      image:req.file?.filename!,
      authorId: user!.id,
      category,
      type,
      tags
    };
  
    const post = await createOnePost(data);

    res.status(201).json({
      message: "Successfully create new post;",
      postId: post.id
    })

}];

export const updatePost = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
  },
];


export const deletePost = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
  },
];
import { Response, Request, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";
import { checkUserIfNotExits } from "../../utlis/auth";
import { getUserById } from "../../services/authService";
import {  getPostsList, getPostWithRealationships } from "../../services/postService";

interface CutomerRequest extends Request {
  userId?: number;
}

export const getPost = [
  param("id", "Post ID is required.").isInt({ gt: 0 }),
  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const postId = req.params.id;
    const userId = req.userId;

    const user = await getUserById(userId!);
    checkUserIfNotExits(user);
    // const post = await getPostById(+postId);

    const post = await getPostWithRealationships(+postId);

    // const modifiedPost ={
    //   id:post!.id,
    //   title:post?.title,
    //   content:post?.content,
    //   body:post?.body,
    //   image:"/optimize/" + post?.image.split('.')[0] + ".webp",
    //   updatedAt:post?.updatedAt.toLocaleDateString("en-Us",
    //      {
    //     year:"numeric",
    //     month:"long",
    //     day:"numeric"
    //   }),
    //   fullName:( post?.author.firstName ?? "")+ " " +(post?.author.lastName ?? "") ,
    //   category:post?.category.name,
    //   type:post?.type.name,
    //   tags:post?.tags && post.tags.length > 0 ? post.tags.map((i) => i.name) :null



    // }

    res.status(200).json({
      message: "Post Detail",
      post,
    });
  },
];


//offsetpagination
export const getPostByPagination = [
  query("page", "Page number must be unsigined  integer").isInt({ gt : 0 }).optional(),
  query("limit", "Limit must be unsingned integer").isInt({ gt: 4 }).optional(),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
     
    const page =req.query.page || 1;
    const limit =req.query.limit || 5;

    const userId =req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExits(user);

    const skip = (+page-1) * +limit; // 2-1 * 5

    const options =  {
           skip,
           take: +limit +1,
           select :{
            id: true,
            title:true,
            content:true,
            image:true,
            updatedAt:true,
            author :{
              select:{

                fullName:true,
              }
            }
           },
           orderBy: {
            updatedAt: "desc"
           }

    };

    
    const posts = await getPostsList(options)

    const hashNextPage = posts.length > +limit; //6 >5
    let nextPage =null;
    const previousePage = +page !== 1 ? +page - 1 : null;


    if(hashNextPage) {
      posts.pop();
      nextPage = +page + 1;
    }

    res.status(200).json({
        message:"Get all Posts",
        currentPage:page,
        hashNextPage,
        nextPage,
        previousePage,
        posts
    })
  },
];


export const getInfinitePostByPagination = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: Request, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    res.status(200).json({
      message: "OK",
    });
  },
];
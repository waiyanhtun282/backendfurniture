import { Response, Request, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";
import { checkUserIfNotExits } from "../../utlis/auth";
import { getUserById } from "../../services/authService";

import { getOrSetCache } from "../../utlis/cache";
import { checkModelIfExit } from "../../utlis/check";
import { getProductWithRealationships } from "../../services/productService";

interface CutomerRequest extends Request {
  userId?: number;
}

export const getProduct = [
  param("id", "Product ID is required.").isInt({ gt: 0 }),
  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const productId = req.params.id;
    const userId = req.userId;

    const user = await getUserById(userId!);
    checkUserIfNotExits(user);
    // const post = await getPostById(+postId);

    // const post = await getPostWithRealationships(+postId);
    const cacheKey = `posts:${JSON.stringify(productId)}`;
    const product = await getOrSetCache(cacheKey, async () => {
      return await getProductWithRealationships(+productId);
    });
    checkModelIfExit(product);

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
      message: "Product Detail",
      product,
    });
  },
];
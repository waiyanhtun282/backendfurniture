import { Response, Request, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";
import { checkUserIfNotExits } from "../../utlis/auth";
import { getUserById } from "../../services/authService";

import { getOrSetCache } from "../../utlis/cache";
import { checkModelIfExit } from "../../utlis/check";
import { getProductWithRealationships, getProdutsList } from "../../services/productService";

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
    const cacheKey = `products:${JSON.stringify(productId)}`;
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


export const getProductsByPagination = [
  query("cursor", "Cursor must be Post ID").isInt({ gt: 0 }).optional(),
  query("limit", "Limit must be unsingned integer").isInt({ gt: 4 }).optional(),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;
    const category =req.query.category;
    const type = req.query.type;


    const userId = req.userId;
    const user = await getUserById(userId!); 
    checkUserIfNotExits(user);
    

    let categoryList: number[]= [];
    let typeList: number[]= [];

    if(category) {
      categoryList= category.toString().split(",").map((c) => Number
(c)).filter((c) => c >0);
    };

      if (type) {
        typeList = type
          .toString()
          .split(",")
          .map((t) => Number(t))
          .filter((t) => t > 0);
      }

      const where = {
        AND : [
          categoryList.length > 0 ? { categoryId: { in: categoryList } } : {},
          typeList.length > 0 ? { typeId: { in: typeList } } : {},
        ]
      };


    const options = {
      where,
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        name: true,
        description:true,
        price: true,
        discount: true,
        status: true,
        images: {
          select: {
            id:true,
            path:true
          },
          take: 1, // Get only the first image
        },
      },
      orderBy: {
        id: "desc",
      },
    };

    // const posts = await getPostsList(options);
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(cacheKey, async () => {
      return await getProdutsList(options);
    });
    const hashNextPage = products.length > +limit;

    if (hashNextPage) {
      products.pop();
    }

    const nextCursor = products.length > 0 ? products[products.length - 1].id : undefined;


    res.status(200).json({
      message: "Get All infinit Posts",
      hashNextPage,
      nextCursor,
      prevCursor:lastCursor,
      products,
    });
  },
];
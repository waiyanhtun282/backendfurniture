import { Response, Request, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import path from "path";
import { unlink } from "fs/promises";
import { errorCode } from "../../../config/errorCode";
import { createError } from "../../utlis/error";
import { getUserById } from "../../services/authService";
import { checkModelIfExit, checkUploadFile } from "../../utlis/check";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  createOnePost,
  deleteOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postService";
import { checkUserIfNotExits } from "../../utlis/auth";

interface CutomerRequest extends Request {
  userId?: number;
}

const removeFile = async (
  originalFile: string,
  optimizeFile: string | null
) => {
  try {
    const originalFilePath = path.join(
      __dirname,
      "../../..",
      "/uploads/images",
      originalFile
    );
    await unlink(originalFilePath);

    if (optimizeFile) {
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/optimize",
        optimizeFile
      );
      await unlink(optimizedFilePath);
    }
  } catch (error) {
    console.log(error);
  }
};

export const createPost = [
  body("title", "Tile is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tags is required")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;

    const userId = req.userId;

    checkUploadFile(req.file);

    const user = await getUserById(userId!);
    if (!user) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(
        createError(
          "This phone number has not registered yet.",
          401,
          errorCode.unauthenticated
        )
      );
    }

    const splitFileName = req.file?.filename.split(".")[0];

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

    const data: PostArgs = {
      title,
      content,
      body,
      image: req.file?.filename!,
      authorId: user!.id,
      category,
      type,
      tags,
    };

    const post = await createOnePost(data);

    res.status(201).json({
      message: "Successfully create new post;",
      postId: post.id,
    });
  },
];

export const updatePost = [
  body("postId", "podtId is required").trim().notEmpty().isInt({ min: 1 }),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tags is required")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),
  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { postId, title, content, body, category, type, tags } = req.body;

    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(
        createError(
          "This user has not registered yet.",
          401,
          errorCode.unauthenticated
        )
      );
    }

    const post = await getPostById(+postId); // database number but user add string

    if (!post) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(
        createError(
          "This data model does not exit yet!",
          401,
          errorCode.invalid
        )
      );
    }
    //Admin a => post 1 => update/delete
    //admin b => update/delete =>post 1 (nit allowed);

    if (user.id !== post.authorId) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(
        createError("This action not allowed", 403, errorCode.unauthorised)
      );
    }

    const data: any = {
      title,
      content,
      body,
      image: req.file,
      category,
      type,
      tags,
    };

    if (req.file) {
      data.image = req.file.filename;
      const splitFileName = req.file.filename.split(".")[0];

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

      const optimizeFile = post.image.split(".")[0] + ".webp";
      await removeFile(post.image, optimizeFile);
    }

    const postUpdated = await updateOnePost(post.id, data);

    res.status(200).json({
      message: "Successfully update one post",
      postId: postUpdated.id,
    });
  },
];

export const deletePost = [
  body("postId", "podtId is required").trim().notEmpty().isInt({ min: 1 }),

  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    // if validaiton errors occur
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { postId } = req.body;
    const userId = req.userId;

    const user = await getUserById(userId!);
    checkUserIfNotExits(user);

    const post = await getPostById(+postId);
    checkModelIfExit(post);

    if(user!.id !== post!.authorId){
   return next(
    createError(
      "this actione is not alowed",
      409,
      errorCode.unauthorised
    )
   )
    };


    const postDeleted = await deleteOnePost(post!.id);

    const optimizeFile =post!.image.split('.')[0] + ".webp";
    await removeFile(post!.image,optimizeFile)

    res.status(200).json({
      message: "Succefully delete post",
      postId:postDeleted.id
    })
  },

];

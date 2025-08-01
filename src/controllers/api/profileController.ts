import { Response, Request, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import path from "path";
import { unlink } from "fs/promises";
import { getUserById, updateUser } from "../../services/authService";
import { checkUserIfNotExits } from "../../utlis/auth";
import { authorise } from "../../utlis/authorise";
import { checkUploadFile } from "../../utlis/check";

interface CutomerRequest extends Request {
  userId?: number;
  file?: any;
}
export const changeLanguage = [
  query("lng", "Invalid language code!.")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$")
    .isLength({ min: 2, max: 3 }),
  async (req: CutomerRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { lng } = req.body;
    res.cookie("i18next", lng);

    res.status(200).json({
      message: req.t("changeLan", { lang: lng }),
    });
  },
];

export const testPermission = async (
  req: CutomerRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExits(user);

  const info: any = {
    title: "test permission",
  };

  // if user.role ="AUHTOR"
  const can = authorise(true, user!.role, "AUTHOR");

  if (can) {
    info.title = "You are authorised to view this page";
  }
  res.status(200).json({ info });
};

export const uploadFile = async (
  req: CutomerRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;

  const user = await getUserById(userId!);
  checkUserIfNotExits(user);
  checkUploadFile(image);

  // console.log("Image__",image);

  const fileName = image!.filename;

  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!
      );
      await unlink(filePath)
    } catch (error) {
      console.log(error);
    }
  }
  const userData = {
    image: fileName,
  };

  await updateUser(user!.id, userData);

  res.status(200).json({
    message: "Profile image is   upload successfully",
    image:fileName
  });
};

// just fot testing

export const myPhoto= async (
  req: CutomerRequest,
  res: Response,
  next: NextFunction
) =>{
  const file = path.join(
    __dirname,
    "../../..",
    "/uploads/images",
    "1754071766674-442812722-photo_2024-03-28_13-19-37.jpg"
  );
  res.sendFile(file,(err)=>{
    res.status(404).send("File not founf")
  })
};

export const MultipleUploadFile = async (
  req: CutomerRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("Mutlple",req.files);
  res.status(200).json({
    message: "MultipleProfile image is   upload successfully",
   
  });
}
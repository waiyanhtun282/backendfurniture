import { errorCode } from "../../config/errorCode";

export const checkUploadFile = (file: any) => {
  if (!file) {
    const error: any = new Error("Invalid Image");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};

export const checkModelIfExit = (model: any) => {
  if (!model) {
    const error: any = new Error("This model does not exit");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};
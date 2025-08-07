import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { createError } from "../../utlis/error";
import { errorCode } from "../../../config/errorCode";
import { createOrUpdateSettingStatus } from "../../services/settingService";

interface CustomerRequest extends Request {
  user?: any;
}
export const setMaintenance = [
  body("mode", "Mode must be boolean ").isBoolean(),
  async (req: CustomerRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    
      if (errors.length > 0) {
        return next(createError(errors[0].msg, 400, errorCode.invalid));
      }

    const { mode } = req.body;
    const value   = mode ? "true" : "false";
    const message = mode ? "Maintenance mode is enabled" : "Maintenance mode disabled";
    await createOrUpdateSettingStatus("maintenance", value);
    res.status(200).json({message});
  },
];

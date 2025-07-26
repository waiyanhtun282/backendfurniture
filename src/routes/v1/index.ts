import express from "express";
import authRoutes from "./auth";
import adminRoutes from "./admins";
import userRoutes from "./api";
import { auth } from "../../middlewares/auth";
import { authorise } from "../../middlewares/authorise";
// import healthRoutes from "../v1/health";
// import ViewRoutes   from "./web/view";
// import * as errorController from "./controllers/web/errorController";


const router = express.Router();

// router.use("/api/v1", healthRoutes);
// router.use( ViewRoutes);
// app.use(errorController.notFound);

router.use("/api/v1",authRoutes);
router.use("/api/v1/user", userRoutes);
router.use("/api/v1/admins", auth,authorise(true,"ADMIN"),adminRoutes);

export default router;

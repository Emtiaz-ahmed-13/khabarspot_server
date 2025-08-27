import express from "express";
import validateRequest from "../../middleware/validateRequest";
import { AuthControllers } from "./auth.controllers";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidation.loginSchema),
  AuthControllers.login
);
router.post(
  "/register",
  validateRequest(AuthValidation.registerSchema),
  AuthControllers.register
);
router.post(
  "/register-admin",
  validateRequest(AuthValidation.registerSchema),
  AuthControllers.registerAdmin
);

export const AuthRoutes = router;

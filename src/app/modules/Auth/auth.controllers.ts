import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthServices } from "./auth.services";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged in successfully",
    data: result,
  });
});

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.register(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const registerAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registerAdmin(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

export const AuthControllers = {
  login,
  register,
  registerAdmin,
};

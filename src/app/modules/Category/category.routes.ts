import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CategoryServices } from "./category.services";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

router.get(
  "/",
  catchAsync(async (req, res) => {
    const data = await CategoryServices.list();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Categories",
      data,
    });
  })
);

router.post(
  "/",
  auth("ADMIN"),
  validateRequest(CategoryValidation.create),
  catchAsync(async (req, res) => {
    const data = await CategoryServices.create(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Category created",
      data,
    });
  })
);

router.patch(
  "/:id",
  auth("ADMIN"),
  validateRequest(CategoryValidation.update),
  catchAsync(async (req, res) => {
    const data = await CategoryServices.update(req.params.id, req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Category updated",
      data,
    });
  })
);

router.delete(
  "/:id",
  auth("ADMIN"),
  catchAsync(async (req, res) => {
    await CategoryServices.remove(req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Category deleted",
      data: null,
    });
  })
);

export const CategoryRoutes = router;

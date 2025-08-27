import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ShopServices } from "./shop.services";
import { ShopValidation } from "./shop.validation";

const router = express.Router();

// Create a shop (ADMIN or VENDOR)
router.post(
  "/",
  auth("ADMIN", "VENDOR"),
  validateRequest(ShopValidation.create),
  catchAsync(async (req: any, res) => {
    const data = await ShopServices.create(req.user.id, req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Shop created",
      data,
    });
  })
);

// List shops
router.get(
  "/",
  auth(),
  catchAsync(async (req: any, res) => {
    const result = await ShopServices.list(req.query);
    res
      .status(200)
      .json({
        success: true,
        message: "Shops",
        meta: result.meta,
        data: result.items,
      });
  })
);

// Get my shops (owner)
router.get(
  "/my",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await ShopServices.myShops(req.user.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "My shops",
      data,
    });
  })
);

// Get shop by slug
router.get(
  "/slug/:slug",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await ShopServices.getBySlug(req.params.slug);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shop",
      data,
    });
  })
);

// Get shop by id
router.get(
  "/:id",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await ShopServices.getById(req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shop",
      data,
    });
  })
);

export const ShopRoutes = router;

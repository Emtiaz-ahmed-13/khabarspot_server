import express from "express";
import auth from "../../middleware/auth";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SubscriptionServices } from "./subscription.services";

const router = express.Router();

router.post(
  "/checkout",
  auth(),
  catchAsync(async (req: any, res) => {
    const provider = (req.body?.provider as string)?.toUpperCase() || "MOCK";
    const data = await SubscriptionServices.checkout(
      req.user.id,
      provider as any
    );
    const message =
      provider === "STRIPE" && (data as any).checkoutUrl
        ? "Stripe checkout session created"
        : "Checkout completed";
    sendResponse(res, { statusCode: 200, success: true, message, data });
  })
);

router.get(
  "/status",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await SubscriptionServices.status(req.user.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription status",
      data,
    });
  })
);

export const SubscriptionRoutes = router;

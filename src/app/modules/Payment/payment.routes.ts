import express from "express";
import auth from "../../middleware/auth";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PaymentServices } from "./payment.services";

const router = express.Router();

// Start a checkout with a provider
router.post(
  "/checkout",
  auth(),
  catchAsync(async (req: any, res) => {
    const provider = (
      (req.body?.provider as string) || "STRIPE"
    ).toUpperCase() as "STRIPE" | "MOCK";
    const data = await PaymentServices.createCheckout(req.user.id, provider);
    const message =
      provider === "STRIPE"
        ? "Stripe checkout session created"
        : "Checkout completed";
    sendResponse(res, { statusCode: 200, success: true, message, data });
  })
);

export const PaymentRoutes = router;

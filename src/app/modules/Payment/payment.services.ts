import Stripe from "stripe";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

export const PaymentServices = {
  async createCheckout(userId: string, provider: "MOCK" | "STRIPE") {
    if (provider === "MOCK") {
      const sub = await prisma.subscription.upsert({
        where: { userId },
        update: { provider: "MOCK" as any, status: "SUCCEEDED" as any },
        create: { userId, provider: "MOCK" as any, status: "SUCCEEDED" as any },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });
      return { message: "Subscription activated", subscription: sub };
    }

    if (provider === "STRIPE") {
      const secret = config.stripe.secret_key;
      if (
        !secret ||
        !config.stripe.price_id ||
        !config.stripe.success_url ||
        !config.stripe.cancel_url
      ) {
        throw new ApiError(
          500,
          "Stripe is not configured. Please set STRIPE_* env vars"
        );
      }
      const stripe = new Stripe(secret);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: config.stripe.price_id as string,
            quantity: 1,
          },
        ],
        success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: config.stripe.cancel_url as string,
        metadata: { userId },
      });
      return { checkoutUrl: session.url };
    }

    throw new ApiError(501, `${provider} integration not implemented yet`);
  },
};

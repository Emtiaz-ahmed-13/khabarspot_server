import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";
import { PaymentServices } from "../Payment/payment.services";

export const SubscriptionServices = {
  async checkout(
    userId: string,
    provider: "MOCK" | "SSLCOMMERZ" | "SHURJOPAY" | "STRIPE"
  ) {
    if (provider === "SSLCOMMERZ" || provider === "SHURJOPAY") {
      throw new ApiError(501, `${provider} integration not implemented yet`);
    }
    return PaymentServices.createCheckout(
      userId,
      provider as any as "MOCK" | "STRIPE"
    );
  },
  async status(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });
    const isPremium = user?.isPremium ?? false;
    return { isPremium, subscription: sub };
  },
};

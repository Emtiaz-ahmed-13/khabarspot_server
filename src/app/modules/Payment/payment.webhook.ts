import { Request, RequestHandler, Response } from "express";
import Stripe from "stripe";
import config from "../../../config";
import prisma from "../../shared/prisma";

export const stripeWebhookHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const secret = config.stripe.secret_key;
  const webhookSecret = config.stripe.webhook_secret as string;
  if (!secret || !webhookSecret) {
    res.status(500).send("Stripe not configured");
    return;
  }
  const stripe = new Stripe(secret);

  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    const payload = req.body as any as Buffer; // Express raw body
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            provider: "STRIPE" as any,
            status: "SUCCEEDED" as any,
            transactionId: session.id,
          },
          create: {
            userId,
            provider: "STRIPE" as any,
            status: "SUCCEEDED" as any,
            transactionId: session.id,
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

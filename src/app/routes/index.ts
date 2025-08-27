import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { CategoryRoutes } from "../modules/Category/category.routes";
import { PaymentRoutes } from "../modules/Payment/payment.routes";
import { PostsRoutes } from "../modules/Post/posts.routes";
import { ShopRoutes } from "../modules/Shop/shop.routes";
import { SubscriptionRoutes } from "../modules/Subscription/subscription.routes";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/categories", route: CategoryRoutes },
  { path: "/posts", route: PostsRoutes },
  { path: "/subscriptions", route: SubscriptionRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/shops", route: ShopRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

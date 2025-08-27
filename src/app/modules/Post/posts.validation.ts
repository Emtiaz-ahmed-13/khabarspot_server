import { z } from "zod";

export const PostsValidation = {
  create: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      location: z.string().min(1),
      imageUrl: z.string().url(),
      categoryId: z.string().uuid(),
      shopId: z.string().uuid().optional(),
      priceMin: z.number().int().min(0).optional(),
      priceMax: z.number().int().min(0).optional(),
    })
    .refine(
      (d) =>
        (d.priceMin == null && d.priceMax == null) ||
        (d.priceMin ?? 0) <= (d.priceMax ?? 0),
      {
        message: "priceMin must be <= priceMax",
        path: ["priceMax"],
      }
    ),

  approve: z.object({
    isPremium: z.boolean().optional(),
  }),

  reject: z.object({
    reason: z.string().min(1),
  }),

  query: z.object({
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    onlyPremium: z.string().optional(),
    sortBy: z.enum(["new", "popular", "rating", "price"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

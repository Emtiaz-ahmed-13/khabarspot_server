import { z } from "zod";

export const ShopValidation = {
  create: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
  }),
  query: z.object({
    q: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

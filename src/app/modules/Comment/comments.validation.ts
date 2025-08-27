import { z } from "zod";

export const CommentsValidation = {
  create: z.object({
    content: z.string().min(1),
    rating: z.number().int().min(1).max(5),
  }),
};

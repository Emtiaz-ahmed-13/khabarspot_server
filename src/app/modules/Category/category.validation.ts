import { z } from "zod";

const create = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

const update = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

export const CategoryValidation = { create, update };

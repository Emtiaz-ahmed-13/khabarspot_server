import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

export const CategoryServices = {
  async create(data: { name: string; slug?: string }) {
    const slug = (data.slug || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) throw new ApiError(409, "Category slug already exists");
    return prisma.category.create({ data: { name: data.name, slug } });
  },
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  async update(id: string, data: { name?: string; slug?: string }) {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.slug) {
      const slug = data.slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      payload.slug = slug;
    }
    return prisma.category.update({ where: { id }, data: payload });
  },
  async remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};

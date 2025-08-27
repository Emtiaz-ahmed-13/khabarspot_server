import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

const toInt = (s?: string) => (s ? parseInt(s, 10) : undefined);

export const ShopServices = {
  async create(
    ownerId: string,
    payload: { name: string; slug: string; description?: string }
  ) {
    const exists = await prisma.shop.findUnique({
      where: { slug: payload.slug },
    });
    if (exists) throw new ApiError(409, "Shop slug already exists");
    const shop = await prisma.shop.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        ownerId,
      },
    });
    return shop;
  },

  async list(query: any) {
    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? "12", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    return { meta: { page, limit, total }, items };
  },

  async getById(id: string) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new ApiError(404, "Shop not found");
    return shop;
  },

  async getBySlug(slug: string) {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: "APPROVED" },
          include: {
            category: true,
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: [{ createdAt: "desc" }],
        },
      },
    });
    if (!shop) throw new ApiError(404, "Shop not found");
    return shop;
  },

  async myShops(ownerId: string) {
    const shops = await prisma.shop.findMany({
      where: { ownerId },
      orderBy: [{ createdAt: "desc" }],
    });
    return shops;
  },
};

import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

const toInt = (s?: string) => (s ? parseInt(s, 10) : undefined);

export const PostsServices = {
  async create(
    user: { id: string; role?: string },
    data: {
      title: string;
      description: string;
      location: string;
      imageUrl: string;
      categoryId: string;
      shopId?: string;
      priceMin?: number;
      priceMax?: number;
    }
  ) {
    // ensure category exists
    const cat = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!cat) throw new ApiError(404, "Category not found");

    if (data.shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
      if (!shop) throw new ApiError(404, "Shop not found");
      if (user.role !== "ADMIN" && shop.ownerId !== user.id) {
        throw new ApiError(403, "You do not own this shop");
      }
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        shopId: data.shopId,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        authorId: user.id,
        status: "PENDING",
      },
      include: { category: true },
    });
    return post;
  },

  async getById(
    forUser: { id?: string; isPremium?: boolean; role?: string } | null,
    id: string
  ) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true, votes: true } },
      },
    });
    if (!post) throw new ApiError(404, "Post not found");

    const premiumAllowed = !!(forUser?.isPremium || forUser?.role === "ADMIN");
    if (post.isPremium && !premiumAllowed)
      throw new ApiError(403, "Premium content. Please subscribe.");
    if (
      post.status !== "APPROVED" &&
      forUser?.role !== "ADMIN" &&
      forUser?.id !== post.authorId
    ) {
      throw new ApiError(403, "Post not available");
    }

    return post;
  },

  async list(
    forUser: { id?: string; isPremium?: boolean; role?: string } | null,
    query: any
  ) {
    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? "10", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    // status gating
    if (forUser?.role === "ADMIN") {
      // allow filtering status via query
      where.status = query.status || undefined;
    } else {
      where.status = "APPROVED";
    }

    // premium gating
    const premiumAllowed = !!(forUser?.isPremium || forUser?.role === "ADMIN");
    const onlyPremium =
      query.onlyPremium === "1" || query.onlyPremium === "true";
    if (!premiumAllowed) {
      where.isPremium = false;
    } else if (onlyPremium) {
      where.isPremium = true;
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: query.categorySlug },
      });
      where.categoryId = cat?.id || "__none__"; // no results if missing
    }

    const minPrice = toInt(query.minPrice);
    const maxPrice = toInt(query.maxPrice);
    if (minPrice != null || maxPrice != null) {
      where.AND = where.AND || [];
      if (minPrice != null) {
        where.AND.push({
          OR: [
            { priceMin: { gte: minPrice } },
            { priceMax: { gte: minPrice } },
          ],
        });
      }
      if (maxPrice != null) {
        where.AND.push({
          OR: [
            { priceMin: { lte: maxPrice } },
            { priceMax: { lte: maxPrice } },
          ],
        });
      }
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          category: true,
          _count: { select: { comments: true, votes: true } },
        },
        orderBy: [
          { createdAt: (query.order as any) === "asc" ? "asc" : "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // enrich with rating average and vote score
    const postIds = items.map((p) => p.id);
    const [ratings, votes] = await Promise.all([
      prisma.comment.groupBy({
        by: ["postId"],
        _avg: { rating: true },
        where: { postId: { in: postIds } },
      }),
      prisma.vote.groupBy({
        by: ["postId"],
        _sum: { value: true },
        where: { postId: { in: postIds } },
      }),
    ]);
    const ratingMap = new Map(
      ratings.map((r) => [r.postId, r._avg.rating || 0])
    );
    const voteMap = new Map(votes.map((v) => [v.postId, v._sum.value || 0]));

    let data = items.map((p) => ({
      ...p,
      avgRating: ratingMap.get(p.id) || 0,
      score: voteMap.get(p.id) || 0,
    }));

    if (query.sortBy === "popular") {
      data = data.sort((a, b) => (b.score as number) - (a.score as number));
    } else if (query.sortBy === "rating") {
      data = data.sort(
        (a, b) => (b.avgRating as number) - (a.avgRating as number)
      );
    } else if (query.sortBy === "price") {
      data = data.sort(
        (a, b) =>
          (a.priceMin ?? a.priceMax ?? 0) - (b.priceMin ?? b.priceMax ?? 0)
      );
      if ((query.order || "asc") === "desc") data.reverse();
    }

    return {
      meta: { page, limit, total },
      items: data,
    };
  },

  async approve(adminId: string, id: string, payload: { isPremium?: boolean }) {
    // ensure post exists & pending/rejected allowed to approve too
    const post = await prisma.post.update({
      where: { id },
      data: {
        status: "APPROVED",
        isPremium: payload.isPremium ?? undefined,
        rejectReason: null,
      },
    });
    return post;
  },

  async reject(adminId: string, id: string, payload: { reason: string }) {
    const post = await prisma.post.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: payload.reason,
        isPremium: false,
      },
    });
    return post;
  },
};

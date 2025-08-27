import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

export const CommentsServices = {
  async create(
    userId: string,
    postId: string,
    data: { content: string; rating: number }
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { status: true },
    });
    if (!post) throw new ApiError(404, "Post not found");
    if (post.status !== "APPROVED")
      throw new ApiError(403, "Cannot comment on unapproved posts");
    if (data.rating < 1 || data.rating > 5)
      throw new ApiError(400, "Rating must be 1-5");
    return prisma.comment.create({
      data: { userId, postId, content: data.content, rating: data.rating },
    });
  },
  async list(postId: string) {
    return prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });
  },
  async remove(adminId: string, commentId: string) {
    return prisma.comment.delete({ where: { id: commentId } });
  },
};

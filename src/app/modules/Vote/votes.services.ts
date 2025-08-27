import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

export const VotesServices = {
  async upvote(userId: string, postId: string) {
    await ensurePostVisible(postId);
    return prisma.vote.upsert({
      where: { userId_postId: { userId, postId } },
      update: { value: 1 },
      create: { userId, postId, value: 1 },
    });
  },
  async downvote(userId: string, postId: string) {
    await ensurePostVisible(postId);
    return prisma.vote.upsert({
      where: { userId_postId: { userId, postId } },
      update: { value: -1 },
      create: { userId, postId, value: -1 },
    });
  },
  async unvote(userId: string, postId: string) {
    await ensurePostVisible(postId);
    try {
      await prisma.vote.delete({
        where: { userId_postId: { userId, postId } },
      });
    } catch (_) {}
    return { success: true };
  },
};

async function ensurePostVisible(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  });
  if (!post) throw new ApiError(404, "Post not found");
  if (post.status !== "APPROVED")
    throw new ApiError(403, "Voting only allowed on approved posts");
}

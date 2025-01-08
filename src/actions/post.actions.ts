"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, image: string) {
  try {
    // Retrieve the ID of the currently authenticated user
    const userId = await getDbUserId();

    if (!userId) return;

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    revalidatePath("/"); 
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      console.warn("User ID could not be retrieved. Ensure the user is authenticated.");
      return;
    }

    // Check if a like already exists for the current user and the specified post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // Retrieve the post and its author ID to ensure it exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("The post you are trying to interact with does not exist.");

    if (existingLike) {
      // If a like exists, remove it (unlike the post)
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // like and create notification (only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: userId, // Person who liked the post
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("An error occurred while toggling the like operation:", error);
    return { success: false, error: "Unable to process your request. Please try again later." };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      console.warn("User is not authenticated. Cannot create a comment.");
      return;
    }

    // Validate that the comment content is not empty
    if (!content) throw new Error("Content is required to create a comment.");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("The post you are trying to comment on does not exist.");

    // Use a transaction to ensure both comment creation and notification happen atomically
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create the comment
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // If the comment is on someone else's post, create a notification
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("An error occurred while creating a comment:", error);
    return { success: false, error: "Failed to create comment. Please try again later." };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) {
      console.warn("User is not authenticated. Cannot delete the post.");
      return { success: false, error: "User is not authenticated." };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("The post you are trying to delete does not exist.");

    if (post.authorId !== userId) {
      console.error(`Unauthorized delete attempt by user ${userId} on post ${postId}.`);
      throw new Error("Unauthorized - You do not have permission to delete this post.");
    }

    // Delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("An error occurred while deleting the post:", error);
    return { success: false, error: "Failed to delete post. Please try again later." };
  }
}
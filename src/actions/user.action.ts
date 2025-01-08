"use server"

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        // If user or userId is missing, exit the function
        if (!userId || !user) {
          console.log("Authentication failed: User not found.");
          return;
        }

        // Check if the user already exists in the database
        const existingUser = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        });

        // If the user exists, return the existing user
        if (existingUser) return existingUser;

        // If no existing user, create a new user in the database
        const dbUser = await prisma.user.create({
        data: {
            clerkId: userId,
            name: `${user.firstName || ""} ${user.lastName || ""}`,
            username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
            email: user.emailAddresses[0].emailAddress,
            image: user.imageUrl,
        },
        });

        return dbUser;
    } catch (error) {
      console.log("Error synchronizing user data", error);
    }
}

export async function getUserByClerkId(clerkId: string) {
  // Query the database for a user by their Clerk ID
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null

  const user = await getUserByClerkId(clerkId);

  if (!user) throw new Error(`Database error: No user found for Clerk ID "${clerkId}".`);

  return user.id;
}

export async function getRandomUsers() {
  try {
    // Retrieve the ID of the currently authenticated user
    const userId = await getDbUserId();

    // If the user is not authenticated, return an empty array
    if (!userId) {
      console.warn("User is not authenticated. Unable to fetch random users.");
      return [];
    }

    // Fetch 3 random users from the database who:
    // 1. Are not the current user.
    // 2. Are not already followed by the current user.
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } }, // Exclude the current user
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId, // Exclude users already followed by the current user
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true, // Include follower count for each user
          },
        },
      },
      take: 3,  // Limit to 3 random users
    });

    return randomUsers;
  } catch (error) {
    console.log("An error occurred while fetching random users:", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("Action not allowed: You cannot follow your own profile.");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // The user who is being followed
            creatorId: userId, // The user who initiated the follow action
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Unable to update follow status. Please try again later." };
  }
}
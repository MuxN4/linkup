import { getProfileByUsername, getUserLikedPosts, getUserPosts, isFollowing } from "@/actions/profile.actions";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

export async function generateMetadata({ 
  params 
}: {
  params: Promise<{ username: string }>
}) {
    const resolvedParams = await params; // Await the Promise to get the params
    if (!resolvedParams.username) return; // Handle the case where username is undefined

    const user = await getProfileByUsername(resolvedParams.username);
    if (!user) return;

    return {
        title: `${user.name ?? user.username}`,
        description: user.bio || `Check out ${user.username}'s profile.`,
    };
}

async function ProfilePageServer({ 
  params 
}: {
  params: Promise<{ username: string }>
}) {
    const resolvedParams = await params; // Await the Promise to get the params
    if (!resolvedParams.username) notFound(); // Handle the case where username is undefined

    const user = await getProfileByUsername(resolvedParams.username);
    if (!user) notFound(); // Handle the null case

    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id),
    ]);

    return (
        <ProfilePageClient
            user={user}
            posts={posts}
            likedPosts={likedPosts}
            isFollowing={isCurrentUserFollowing}
        />
    );
}

export default ProfilePageServer;

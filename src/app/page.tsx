import { currentUser } from "@clerk/nextjs/server";
import CreatePost from "@/components/CreatePost"
import SuggestedConnections from "@/components/SuggestedConnections";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/actions/post.actions";
import { getDbUserId } from "@/actions/user.action";

export default async function Home() {
  const user = await currentUser();
  const posts = await getPosts();
  const dbUserId = await getDbUserId();
  console.log({posts})
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div>
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} dbUserId={dbUserId} />
            ))}
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <SuggestedConnections />
      </div>
    </div>
    
  );
}

import { Header } from "@/components/layout/Header";
import { FriendFeed } from "@/components/social/FriendFeed";

export const metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Friend Activity" />
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2 md:px-6">
        <FriendFeed />
      </div>
    </div>
  );
}

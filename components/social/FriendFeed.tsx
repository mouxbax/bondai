"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Flame, Trophy, Target, ArrowUpCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FeedActivity {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null; companionName: string | null };
}

interface Friend {
  id: string;
  friendshipId: string;
  name: string | null;
  image: string | null;
  xp: number;
  level: number;
  companionName: string | null;
}

const TYPE_ICONS: Record<string, typeof Flame> = {
  streak: Flame,
  evolution: ArrowUpCircle,
  achievement: Trophy,
  goal_completed: Target,
  level_up: ArrowUpCircle,
  gift_sent: Gift,
};

const TYPE_COLORS: Record<string, string> = {
  streak: "text-orange-500",
  evolution: "text-purple-500",
  achievement: "text-amber-500",
  goal_completed: "text-emerald-500",
  level_up: "text-blue-500",
  gift_sent: "text-pink-500",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FriendFeed() {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<Friend[]>([]);
  const [hasFriends, setHasFriends] = useState(true);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/feed").then((r) => r.json()),
      fetch("/api/friends").then((r) => r.json()),
    ]).then(([feedData, friendData]) => {
      setActivities(feedData.activities ?? []);
      setHasFriends(feedData.hasFriends ?? false);
      setFriends(friendData.friends ?? []);
      setPendingIncoming(friendData.pendingIncoming ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sendRequest = async () => {
    if (!addEmail.trim()) return;
    setAddStatus(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddStatus("Request sent!");
        setAddEmail("");
      } else {
        setAddStatus(data.error || "Failed");
      }
    } catch {
      setAddStatus("Network error");
    }
  };

  const respondRequest = async (friendshipId: string, action: "accept" | "decline") => {
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    setPendingIncoming((prev) => prev.filter((p) => p.friendshipId !== friendshipId));
    if (action === "accept") {
      // Refresh friends list
      const res = await fetch("/api/friends").then((r) => r.json());
      setFriends(res.friends ?? []);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-stone-200/50 dark:bg-stone-800/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add friend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-stone-500" />
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            {friends.length} friend{friends.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs h-7 rounded-lg"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/50">
          <div className="flex gap-2">
            <Input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="Friend's email..."
              className="text-xs h-8 rounded-lg"
              onKeyDown={(e) => e.key === "Enter" && sendRequest()}
            />
            <Button size="sm" onClick={sendRequest} className="h-8 rounded-lg text-xs">
              Send
            </Button>
          </div>
          {addStatus && (
            <p className={`text-xs ${addStatus.includes("sent") ? "text-emerald-500" : "text-rose-500"}`}>
              {addStatus}
            </p>
          )}
        </div>
      )}

      {/* Pending requests */}
      {pendingIncoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-600">
            {pendingIncoming.length} pending request{pendingIncoming.length > 1 ? "s" : ""}
          </p>
          {pendingIncoming.map((p) => (
            <div
              key={p.friendshipId}
              className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >
              <span className="text-xs font-medium">{p.name ?? "Someone"}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => respondRequest(p.friendshipId, "accept")}
                  className="h-6 text-[10px] rounded-md"
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => respondRequest(p.friendshipId, "decline")}
                  className="h-6 text-[10px] rounded-md"
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity feed */}
      {!hasFriends || activities.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 mx-auto mb-2 text-stone-400" />
          <p className="text-xs text-stone-500">
            {!hasFriends
              ? "Add friends to see their activity here"
              : "No recent activity from friends"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => {
            const Icon = TYPE_ICONS[a.type] ?? Target;
            const color = TYPE_COLORS[a.type] ?? "text-stone-500";
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200/50 dark:border-stone-700/30"
              >
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {a.user.image && (
                      <img
                        src={a.user.image}
                        alt=""
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span className="text-xs font-semibold truncate">
                      {a.user.name}
                    </span>
                    <span className="text-[10px] text-stone-400 shrink-0">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    {a.title}
                  </p>
                  {a.detail && (
                    <p className="text-[10px] text-stone-500 mt-0.5">{a.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnlineUser {
  id: string;
  name: string;
  avatar?: string | null;
}

export const useOnlineUsers = () => {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        const seenIds = new Set<string>();

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (!seenIds.has(presence.user_id)) {
              seenIds.add(presence.user_id);
              users.push({
                id: presence.user_id,
                name: presence.user_name || "User",
                avatar: presence.user_avatar || null,
              });
            }
          });
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            user_name: user.name,
            user_avatar: user.avatar || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, user?.name, user?.avatar]);

  return { onlineUsers };
};

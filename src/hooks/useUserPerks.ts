import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserPerksData {
  active_perks: string[];
  custom_title: string | null;
  avatar_frame: string | null;
}

const MAX_ACTIVE_PERKS = 2;

export const useUserPerks = (userId: string | undefined | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-perks", userId],
    queryFn: async (): Promise<UserPerksData> => {
      if (!userId) return { active_perks: [], custom_title: null, avatar_frame: null };

      const { data, error } = await supabase
        .from("profiles")
        .select("active_perks, custom_title, avatar_frame")
        .eq("id", userId)
        .single();

      if (error || !data) return { active_perks: [], custom_title: null, avatar_frame: null };

      return {
        active_perks: (data as any).active_perks || [],
        custom_title: (data as any).custom_title || null,
        avatar_frame: (data as any).avatar_frame || null,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const updatePerks = useMutation({
    mutationFn: async (updates: Partial<UserPerksData>) => {
      if (!userId) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-perks", userId] });
    },
  });

  const togglePerk = async (perkKey: string) => {
    const current = query.data?.active_perks || [];
    let updated: string[];

    if (current.includes(perkKey)) {
      updated = current.filter((k) => k !== perkKey);
    } else {
      if (current.length >= MAX_ACTIVE_PERKS) {
        // Remove oldest, add new
        updated = [...current.slice(1), perkKey];
      } else {
        updated = [...current, perkKey];
      }
    }

    await updatePerks.mutateAsync({ active_perks: updated });
  };

  return {
    ...query,
    togglePerk,
    updatePerks: updatePerks.mutateAsync,
    isUpdating: updatePerks.isPending,
    MAX_ACTIVE_PERKS,
  };
};

export const AVATAR_FRAMES: Record<string, { name: string; nameEn: string; className: string }> = {
  gold: {
    name: "กรอบทอง",
    nameEn: "Gold Frame",
    className: "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background",
  },
  diamond: {
    name: "กรอบเพชร",
    nameEn: "Diamond Frame",
    className: "ring-4 ring-cyan-400 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(34,211,238,0.4)]",
  },
  fire: {
    name: "กรอบเพลิง",
    nameEn: "Fire Frame",
    className: "ring-4 ring-orange-500 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(249,115,22,0.4)]",
  },
  rainbow: {
    name: "กรอบรุ้ง",
    nameEn: "Rainbow Frame",
    className: "ring-4 ring-purple-500 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(168,85,247,0.4)]",
  },
};

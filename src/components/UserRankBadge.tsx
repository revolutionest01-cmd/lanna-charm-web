import { useUserRank } from "@/hooks/useUserRank";
import { useUserPerks } from "@/hooks/useUserPerks";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserRankBadgeProps {
  userId?: string | null;
  userName: string;
  showRankName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Component to display user's rank icon, name, and active perks
 * Shows rank badge + aura effect + custom title + premium badge
 */
export const UserRankBadge = ({
  userId,
  userName,
  showRankName = false,
  size = "md",
  className = "",
}: UserRankBadgeProps) => {
  const { data: rankData } = useUserRank(userId);
  const { data: perksData } = useUserPerks(userId);

  if (!rankData) {
    return <span className={className}>{userName}</span>;
  }

  const { rank } = rankData;
  const activePerks = perksData?.active_perks || [];
  const hasAura = activePerks.includes("aura-effect");
  const hasPremiumBadge = activePerks.includes("premium-badge");
  const customTitle = perksData?.custom_title;
  const hasCustomTitle = activePerks.includes("custom-title") && customTitle;

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center flex-wrap ${sizeClasses[size]} ${className}`}>
            <span
              className={`font-semibold text-foreground ${
                hasAura
                  ? "bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]"
                  : ""
              }`}
            >
              {userName}
            </span>
            {hasPremiumBadge && <span className="text-xs">⭐</span>}
            <Badge
              className={`${iconSizeClasses[size]} px-1.5 py-0.5 ${rank.bgColor} ${rank.nameColor} border ${rank.borderColor} cursor-help`}
              variant="outline"
            >
              {rank.icon}
              {showRankName && <span className="ml-1">{rank.name}</span>}
            </Badge>
            {hasCustomTitle && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                「{customTitle}」
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{rank.name}</p>
            <p className="text-xs">{rank.description}</p>
            <p className="text-xs opacity-75">{rankData.points} points</p>
            {hasCustomTitle && <p className="text-xs text-blue-500">「{customTitle}」</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

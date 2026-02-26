import { useUserRank } from "@/hooks/useUserRank";
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
 * Component to display user's rank icon and name
 * Shows rank badge next to username with tooltip
 */
export const UserRankBadge = ({
  userId,
  userName,
  showRankName = false,
  size = "md",
  className = "",
}: UserRankBadgeProps) => {
  const { data: rankData } = useUserRank(userId);

  if (!rankData) {
    return <span className={className}>{userName}</span>;
  }

  const { rank } = rankData;

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
          <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
            <span className="font-semibold text-foreground">{userName}</span>
            <Badge
              className={`${iconSizeClasses[size]} px-1.5 py-0.5 ${rank.bgColor} ${rank.nameColor} border ${rank.borderColor} cursor-help`}
              variant="outline"
            >
              {rank.icon}
              {showRankName && <span className="ml-1">{rank.name}</span>}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{rank.name}</p>
            <p className="text-xs">{rank.description}</p>
            <p className="text-xs opacity-75">{rankData.points} points</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

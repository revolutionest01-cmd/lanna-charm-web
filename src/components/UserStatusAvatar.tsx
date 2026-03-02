import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStatusMessage } from "@/hooks/useUserStatusMessage";
import { useUserRank } from "@/hooks/useUserRank";
import { cn } from "@/lib/utils";

interface UserStatusAvatarProps {
  userId?: string | null;
  userName: string;
  avatarUrl?: string | null;
  statusMessage?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  avatarClassName?: string;
  fallbackClassName?: string;
}

const SIZE_CLASS: Record<NonNullable<UserStatusAvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-28 w-28",
};

export const UserStatusAvatar = ({
  userId,
  userName,
  avatarUrl,
  statusMessage,
  size = "md",
  className,
  avatarClassName,
  fallbackClassName,
}: UserStatusAvatarProps) => {
  const { data: fetchedStatus } = useUserStatusMessage(userId, statusMessage);
  const { data: rankData } = useUserRank(userId);
  const message = fetchedStatus?.trim() || "";
  const fallbackIcon = rankData?.rank?.icon || userName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className={cn("relative inline-flex", className)}>
      {message && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-max max-w-[240px]">
          <div className="relative rounded-xl border border-slate-300/80 bg-white px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-700 shadow-sm text-center whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {message}
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 h-2.5 w-2.5 rotate-45 border-r border-b border-slate-300/80 bg-white" />
          </div>
        </div>
      )}
      <Avatar className={cn(SIZE_CLASS[size], avatarClassName)}>
        <AvatarImage src={avatarUrl || undefined} alt={userName} />
        <AvatarFallback className={cn("bg-primary/20 text-primary font-semibold", fallbackClassName)}>
          {fallbackIcon}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

import { Heart, MessageCircle, Eye, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCategoryLabel, getCategoryColor } from "@/lib/forumConfig";
import { ForumTopic } from "@/hooks/useWebboard";
import { UserRankBadge } from "@/components/UserRankBadge";
import { cn } from "@/lib/utils";

interface TopicCardProps {
  topic: ForumTopic;
  language: "th" | "en";
  isLiked?: boolean;
  onLike?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  variant?: "list" | "compact" | "featured";
}

const TopicCard = ({
  topic,
  language,
  isLiked = false,
  onLike,
  onClick,
  variant = "list",
}: TopicCardProps) => {
  const categoryColor = getCategoryColor(topic.category);
  const categoryLabel = getCategoryLabel(topic.category, language);

  const formattedDate = new Date(topic.created_at).toLocaleDateString(
    language === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const timeAgo = (() => {
    const now = new Date();
    const created = new Date(topic.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return language === "th" ? "เมื่อกี้" : "Just now";
    if (diffMins < 60) return `${diffMins} ${language === "th" ? "นาทีที่แล้ว" : "min ago"}`;
    if (diffHours < 24) return `${diffHours} ${language === "th" ? "ชั่วโมงที่แล้ว" : "hr ago"}`;
    if (diffDays < 7) return `${diffDays} ${language === "th" ? "วันที่แล้ว" : "d ago"}`;
    return formattedDate;
  })();

  const renderListVariant = () => (
    <CardContent className="p-0">
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Left: Avatar */}
        <div className="flex-shrink-0 pt-1">
          <Avatar className="w-10 h-10 ring-2 ring-primary/10">
            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/80 to-primary text-white">
              {(topic.author_name || "A").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Top: Author + Time + Category */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {topic.author_name && (
              <UserRankBadge
                userId={topic.user_id}
                userName={topic.author_name}
                size="sm"
                className="font-semibold text-sm text-foreground"
              />
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 font-semibold rounded-md",
                categoryColor.bg, categoryColor.text, categoryColor.border
              )}
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg leading-snug mb-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {topic.title}
          </h3>

          {/* Content Preview */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {topic.content}
          </p>

          {/* Image Preview */}
          {topic.image_url && (
            <div className="mb-3 rounded-xl overflow-hidden border border-border/50 max-w-xs">
              <img
                src={topic.image_url}
                alt={topic.title}
                className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-1">
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                isLiked
                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "hover:bg-muted text-muted-foreground hover:text-red-500"
              )}
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={isLiked ? "currentColor" : "none"}
              />
              <span>{topic.likes_count || 0}</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{topic.replies_count || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              <Eye className="w-3.5 h-3.5" />
              <span>{topic.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  );

  const renderCompactVariant = () => (
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-7 h-7 flex-shrink-0">
          <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-primary/80 to-primary text-white">
            {(topic.author_name || "A").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
            {topic.title}
          </h4>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {topic.views || 0}
            </span>
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1 transition-colors",
                isLiked ? "text-red-500" : "hover:text-red-500"
              )}
            >
              <Heart className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} />
              {topic.likes_count || 0}
            </button>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {topic.replies_count || 0}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  );

  const renderFeaturedVariant = () => (
    <CardContent className="p-0 overflow-hidden">
      {topic.image_url && (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden">
          <img
            src={topic.image_url}
            alt={topic.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <Badge
            variant="outline"
            className={cn(
              "absolute top-3 left-3 text-[10px] font-semibold backdrop-blur-sm",
              categoryColor.bg, categoryColor.text, categoryColor.border
            )}
          >
            {categoryLabel}
          </Badge>
        </div>
      )}
      <div className="p-4 sm:p-5">
        {!topic.image_url && (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold mb-3", categoryColor.bg, categoryColor.text, categoryColor.border)}
          >
            {categoryLabel}
          </Badge>
        )}
        <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 text-foreground">
          {topic.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {topic.content}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{topic.views || 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{topic.likes_count || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{topic.replies_count || 0}</span>
        </div>
      </div>
    </CardContent>
  );

  const content = (() => {
    switch (variant) {
      case "compact": return renderCompactVariant();
      case "featured": return renderFeaturedVariant();
      default: return renderListVariant();
    }
  })();

  return (
    <Card
      className={cn(
        "group border border-border/60 bg-white dark:bg-card shadow-md",
        "hover:shadow-xl hover:border-primary/20 hover:-translate-y-0.5",
        "transition-all duration-300 cursor-pointer overflow-hidden"
      )}
      onClick={onClick}
    >
      {content}
    </Card>
  );
};

export default TopicCard;

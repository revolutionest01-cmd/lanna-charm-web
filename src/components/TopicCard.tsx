import { Heart, MessageCircle, Eye, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCategoryLabel, getCategoryColor } from "@/lib/forumConfig";
import { ForumTopic } from "@/hooks/useWebboard";
import { UserRankBadge } from "@/components/UserRankBadge";

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

  // Format date
  const formattedDate = new Date(topic.created_at).toLocaleDateString(
    language === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const renderListVariant = () => (
    <CardContent className="p-4 sm:p-6 hover:bg-blue-50/50 dark:hover:bg-slate-900/30 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image */}
        {topic.image_url && (
          <div className="flex-shrink-0 w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
            <img
              src={topic.image_url}
              alt={topic.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border}`}
            >
              {categoryLabel}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
            {topic.title}
          </h3>

          {/* Content Preview */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {topic.content}
          </p>

          {/* Author & Stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {/* Author with Rank Badge */}
            {topic.author_name && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-400 text-white">
                    {topic.author_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <UserRankBadge
                  userId={topic.user_id}
                  userName={topic.author_name}
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                />
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Eye className="w-4 h-4" />
                <span>{topic.views || 0}</span>
              </div>

              <button
                onClick={onLike}
                className="flex items-center gap-1 transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                <Heart
                  className="w-4 h-4"
                  fill={isLiked ? "currentColor" : "none"}
                  color={isLiked ? "#ef4444" : "currentColor"}
                />
                <span>{topic.likes_count || 0}</span>
              </button>

              <div className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{topic.replies_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  );

  const renderCompactVariant = () => (
    <CardContent className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-900/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
          {/* Index number will be set by parent */}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-white mb-1">
            {topic.title}
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {topic.views || 0}
            </div>
            <button
              onClick={onLike}
              className="flex items-center gap-1 transition-colors hover:text-red-500 dark:hover:text-red-400"
            >
              <Heart
                className="w-3 h-3"
                fill={isLiked ? "currentColor" : "none"}
                color={isLiked ? "#ef4444" : "currentColor"}
              />
              {topic.likes_count || 0}
            </button>
          </div>
        </div>
      </div>
    </CardContent>
  );

  const renderFeaturedVariant = () => (
    <CardContent className="p-0 overflow-hidden">
      {topic.image_url && (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
          <img
            src={topic.image_url}
            alt={topic.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <Badge
          variant="outline"
          className={`${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} mb-3`}
        >
          {categoryLabel}
        </Badge>
        <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
          {topic.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {topic.content}
        </p>
        <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{topic.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{topic.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </CardContent>
  );

  const content = (() => {
    switch (variant) {
      case "compact":
        return renderCompactVariant();
      case "featured":
        return renderFeaturedVariant();
      default:
        return renderListVariant();
    }
  })();

  return (
    <Card
      className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {content}
    </Card>
  );
};

export default TopicCard;

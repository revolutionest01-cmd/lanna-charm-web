import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";

export const OnlineUsersPanel = () => {
  const { language } = useLanguage();
  const { onlineUsers } = useOnlineUsers();
  const navigate = useNavigate();
  const { isFeatureEnabled } = useFeatureToggle();
  const isUserProfileEnabled = isFeatureEnabled("user_profile");

  return (
    <Card className="border-border/60 bg-white dark:bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-white" />
          <h4 className="text-sm font-bold text-white">
            {language === "th" ? "สมาชิกออนไลน์" : "Online Members"}
          </h4>
          <Badge variant="secondary" className="ml-auto text-xs bg-white/20 text-white border-white/20 hover:bg-white/20">
            {onlineUsers.length}
          </Badge>
      </div>

      <CardContent className="p-0">

        {onlineUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 px-4">
            {language === "th" ? "ไม่มีสมาชิกออนไลน์" : "No members online"}
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
            {onlineUsers.map((u) => (
              <div
                key={u.id}
                className={`flex items-center gap-2 p-3.5 transition-colors ${
                  isUserProfileEnabled ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
                }`}
                onClick={isUserProfileEnabled ? () => navigate(`/members/${u.id}`) : undefined}
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.avatar || undefined} alt={u.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <span className="text-sm text-foreground truncate">{u.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

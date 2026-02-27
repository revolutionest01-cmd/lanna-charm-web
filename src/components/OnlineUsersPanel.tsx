import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const OnlineUsersPanel = () => {
  const { language } = useLanguage();
  const { onlineUsers } = useOnlineUsers();
  const navigate = useNavigate();

  return (
    <Card className="border-primary/10 dark:border-primary/20 rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary dark:text-primary/80" />
          <h4 className="font-semibold text-sm text-foreground">
            {language === "th" ? "สมาชิกออนไลน์" : "Online Members"}
          </h4>
          <Badge variant="secondary" className="ml-auto text-xs">
            {onlineUsers.length}
          </Badge>
        </div>

        {onlineUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {language === "th" ? "ไม่มีสมาชิกออนไลน์" : "No members online"}
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {onlineUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors"
                onClick={() => navigate(`/members/${u.id}`)}
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

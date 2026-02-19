import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, UserCog, Crown, User } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import { useAuth } from "@/hooks/useAuth";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "staff" | "user";
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

const roleConfig = {
  admin: { icon: Crown, color: "text-red-500", badge: "destructive" as const },
  staff: { icon: Shield, color: "text-blue-500", badge: "default" as const },
  user: { icon: User, color: "text-foreground/70", badge: "secondary" as const },
};

export const UserRolesManagement = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at");

    if (error) {
      console.error("Error fetching user roles:", error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each user
    const userIds = data.map((u) => u.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const merged: UserRole[] = data.map((ur) => {
      const profile = profileMap.get(ur.user_id);
      return {
        ...ur,
        role: ur.role as "admin" | "staff" | "user",
        display_name: profile?.display_name || "Unknown",
        avatar_url: profile?.avatar_url || null,
      };
    });

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userRoleId: string, userId: string, newRole: string) => {
    // Prevent changing own role
    if (userId === currentUser?.id) {
      sweetAlert.error(
        language === "th" ? "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : "Cannot change your own role"
      );
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === "th"
        ? `เปลี่ยนบทบาทเป็น "${newRole}"?`
        : `Change role to "${newRole}"?`,
      language === "th"
        ? "การเปลี่ยนบทบาทจะมีผลทันที"
        : "This change takes effect immediately"
    );

    if (!confirmed) return;

    setUpdating(userRoleId);

    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as "admin" | "staff" | "user" })
      .eq("id", userRoleId);

    if (error) {
      console.error("Error updating role:", error);
      sweetAlert.error(
        language === "th" ? "เกิดข้อผิดพลาดในการอัปเดต" : "Error updating role"
      );
    } else {
      sweetAlert.success(
        language === "th" ? "อัปเดตบทบาทสำเร็จ" : "Role updated successfully"
      );
      fetchUsers();
    }

    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            {language === "th" ? "จัดการบทบาทผู้ใช้" : "User Role Management"}
          </CardTitle>
          <CardDescription>
            {language === "th"
              ? `ทั้งหมด ${users.length} ผู้ใช้ — Admin: สิทธิ์เต็ม, Staff: แก้ไขเนื้อหา, User: ทั่วไป`
              : `${users.length} users total — Admin: full access, Staff: edit content, User: basic`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead>
                <TableHead>{language === "th" ? "บทบาท" : "Role"}</TableHead>
                <TableHead>{language === "th" ? "วันที่เข้าร่วม" : "Joined"}</TableHead>
                <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const config = roleConfig[u.role];
                const RoleIcon = config.icon;
                const isSelf = u.user_id === currentUser?.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>{u.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {u.display_name}
                            {isSelf && (
                              <span className="text-xs text-foreground/70 ml-1.5">
                                ({language === "th" ? "คุณ" : "You"})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badge} className="gap-1">
                        <RoleIcon className="w-3 h-3" />
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/70">
                      {new Date(u.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-xs text-foreground/70">—</span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(val) => handleRoleChange(u.id, u.user_id, val)}
                          disabled={updating === u.id}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

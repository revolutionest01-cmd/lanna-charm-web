import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, UserCog, Crown, User, Zap, Trash2 } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import { useAuth } from "@/hooks/useAuth";
import { DEVELOPER_ID } from "@/hooks/useAdminStatus";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

const roleConfig = {
  developer: { icon: Zap, color: "text-yellow-500", badge: "outline" as const, label: "Developer" },
  admin: { icon: Crown, color: "text-red-500", badge: "destructive" as const, label: "Admin" },
  staff: { icon: Shield, color: "text-blue-500", badge: "default" as const, label: "Staff" },
  user: { icon: User, color: "text-foreground/70", badge: "secondary" as const, label: "User" },
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

    const userIds = data.map((u) => u.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    setUsers(
      data.map((ur) => {
        const profile = profileMap.get(ur.user_id);
        return {
          ...ur,
          display_name: profile?.display_name || "Unknown",
          avatar_url: profile?.avatar_url || null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userRoleId: string, userId: string, newRole: string) => {
    // Protect developer
    if (userId === DEVELOPER_ID) {
      sweetAlert.error(language === "th" ? "ไม่สามารถเปลี่ยน Role ของ Developer ได้" : "Cannot change Developer role");
      return;
    }
    // Cannot assign developer role
    if (newRole === "developer") {
      sweetAlert.error(language === "th" ? "ไม่สามารถตั้ง Developer ให้คนอื่นได้" : "Cannot assign Developer role");
      return;
    }
    // Admin can only assign staff/user, not other admins
    if (userId === currentUser?.id) {
      sweetAlert.error(language === "th" ? "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : "Cannot change your own role");
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? `เปลี่ยนบทบาทเป็น "${newRole}"?` : `Change role to "${newRole}"?`,
      language === "th" ? "การเปลี่ยนบทบาทจะมีผลทันที" : "This change takes effect immediately"
    );
    if (!confirmed) return;

    setUpdating(userRoleId);
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", userRoleId);

    if (error) {
      sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error updating role");
    } else {
      sweetAlert.success(language === "th" ? "อัปเดตบทบาทสำเร็จ" : "Role updated successfully");
      fetchUsers();
    }
    setUpdating(null);
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (userId === DEVELOPER_ID) {
      sweetAlert.error(language === "th" ? "ไม่สามารถลบ Developer ได้" : "Cannot delete Developer");
      return;
    }
    if (userId === currentUser?.id) {
      sweetAlert.error(language === "th" ? "ไม่สามารถลบตัวเองได้" : "Cannot delete yourself");
      return;
    }

    const confirmed = await sweetAlert.modal.confirm(
      language === "th" ? `ลบผู้ใช้ "${displayName}"?` : `Delete user "${displayName}"?`,
      language === "th" ? "การลบจะไม่สามารถกู้คืนได้" : "This action cannot be undone"
    );
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      sweetAlert.success(language === "th" ? "ลบผู้ใช้สำเร็จ" : "User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      sweetAlert.error(err.message || (language === "th" ? "เกิดข้อผิดพลาด" : "Error deleting user"));
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

  // Filter out developer from the list for admin view (they see it but can't change it)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-2xl">
            <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {language === "th" ? "จัดการบทบาทผู้ใช้" : "User Role Management"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th"
              ? `ทั้งหมด ${users.length} ผู้ใช้ — Admin: เพิ่ม/ลบ Staff, Staff: แก้ไขเนื้อหา`
              : `${users.length} users — Admin: manage staff, Staff: edit content`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {users.map((u) => {
              const config = roleConfig[u.role as keyof typeof roleConfig] || roleConfig.user;
              const RoleIcon = config.icon;
              const isDev = u.user_id === DEVELOPER_ID;
              const isSelf = u.user_id === currentUser?.id;

              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {u.avatar_url && /^[\p{Emoji}]$/u.test(u.avatar_url) ? (
                    <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-semibold shrink-0">
                      {u.avatar_url}
                    </div>
                  ) : (
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{u.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {u.display_name}
                      {isDev && <span className="text-xs text-yellow-500 ml-1">🔒</span>}
                      {isSelf && <span className="text-xs text-muted-foreground ml-1">({language === "th" ? "คุณ" : "You"})</span>}
                    </p>
                    <Badge variant={config.badge} className="gap-0.5 text-[10px] h-5 mt-1">
                      <RoleIcon className="w-2.5 h-2.5" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isDev || isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <>
                        <Select
                          value={u.role}
                          onValueChange={(val) => handleRoleChange(u.id, u.user_id, val)}
                          disabled={updating === u.id || updating === u.user_id}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(u.user_id, u.display_name)}
                          disabled={updating === u.user_id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
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
                  const config = roleConfig[u.role as keyof typeof roleConfig] || roleConfig.user;
                  const RoleIcon = config.icon;
                  const isDev = u.user_id === DEVELOPER_ID;
                  const isSelf = u.user_id === currentUser?.id;

                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {u.avatar_url && /^[\p{Emoji}]$/u.test(u.avatar_url) ? (
                            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-semibold">
                              {u.avatar_url}
                            </div>
                          ) : (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{u.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <p className="font-medium text-sm">
                            {u.display_name}
                            {isDev && <span className="text-xs text-yellow-500 ml-1.5">🔒 Developer</span>}
                            {isSelf && <span className="text-xs text-muted-foreground ml-1.5">({language === "th" ? "คุณ" : "You"})</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.badge} className="gap-1">
                          <RoleIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                      </TableCell>
                      <TableCell className="text-right">
                        {isDev || isSelf ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Select
                              value={u.role}
                              onValueChange={(val) => handleRoleChange(u.id, u.user_id, val)}
                              disabled={updating === u.id || updating === u.user_id}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(u.user_id, u.display_name)}
                              disabled={updating === u.user_id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

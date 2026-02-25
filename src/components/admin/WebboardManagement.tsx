import { useState, useEffect } from "react";
import { useWebboard, ForumTopic, ForumReply } from "@/hooks/useWebboard";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ForumSetupModal } from "./ForumSetupModal";

export const WebboardManagement = () => {
  const {
    topics,
    loading,
    error,
    fetchTopics,
    updateTopic,
    deleteTopic,
    toggleTopicStatus,
  } = useWebboard();

  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Partial<ForumTopic> | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tablesExist, setTablesExist] = useState(true);
  const { toast } = useToast();

  // Check if forum tables exist on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkTablesExist = async () => {
      try {
        // Set timeout of 5 seconds for the check
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 5000);

        const { error } = await (supabase as any)
          .from("forum_topics")
          .select("id", { count: "exact", head: true });

        if (timeoutId) clearTimeout(timeoutId);

        if (!isMounted) return;

        if (error) {
          console.warn("[WebboardManagement] Tables don't exist:", error);
          setTablesExist(false);
          setShowSetupModal(true);
          return;
        }

        console.log("[WebboardManagement] Tables exist!");
        setTablesExist(true);
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!isMounted) return;
        console.warn("[WebboardManagement] Error checking tables:", err);
        setTablesExist(false);
        setShowSetupModal(true);
      }
    };

    checkTablesExist();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (tablesExist) {
      console.log("[WebboardManagement] Tables exist, fetching topics...");
      fetchTopics(true); // Include inactive topics for admin
    } else {
      console.log("[WebboardManagement] Tables don't exist, skipping fetch");
    }
  }, [tablesExist]);

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || topic.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && topic.is_active) ||
      (filterStatus === "inactive" && !topic.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewDetails = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    const { data: repliesData } = await (supabase as any)
      .from("forum_replies")
      .select("*")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: false });

    if (repliesData) {
      const enrichedReplies = await Promise.all(
        (repliesData as any[]).map(async (reply: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", reply.user_id)
            .single();

          return {
            ...reply,
            author_name: profile?.display_name || "Anonymous",
          };
        })
      );
      setReplies(enrichedReplies as ForumReply[]);
    }

    setShowDetailModal(true);
  };

  const handleToggleStatus = async (topic: ForumTopic) => {
    try {
      await toggleTopicStatus(topic.id, topic.is_active);
      toast({
        title: "Success",
        description: `Topic ${topic.is_active ? "hidden" : "shown"} successfully`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update topic status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteTopicId) return;

    try {
      await deleteTopic(deleteTopicId);
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
      setShowDeleteDialog(false);
      setDeleteTopicId(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("forum_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;

      setReplies(replies.filter((r) => r.id !== replyId));
      toast({
        title: "Success",
        description: "Reply deleted successfully",
      });
      setReplyToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete reply",
        variant: "destructive",
      });
    }
  };

  const handleEditTopic = (topic: ForumTopic) => {
    setEditingTopic({
      ...topic,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTopic || !editingTopic.id) return;

    try {
      await updateTopic(editingTopic.id, {
        title: editingTopic.title,
        content: editingTopic.content,
        category: editingTopic.category,
      });

      toast({
        title: "Success",
        description: "Topic updated successfully",
      });

      setShowEditModal(false);
      setEditingTopic(null);
      setShowDetailModal(false);
      setSelectedTopic(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalTopics: topics.length,
    activeTopics: topics.filter((t) => t.is_active).length,
    inactiveTopics: topics.filter((t) => !t.is_active).length,
    totalViews: topics.reduce((sum, t) => sum + (t.views || 0), 0),
    totalLikes: topics.reduce((sum, t) => sum + (t.likes_count || 0), 0),
    totalReplies: topics.reduce((sum, t) => sum + (t.replies_count || 0), 0),
  };

  if (loading && tablesExist) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading webboard data...</p>
          <p className="text-xs text-muted-foreground mt-2">กำลังโหลดข้อมูลกระทู้...</p>
        </div>
      </div>
    );
  }

  if (!tablesExist) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">
              The forum database tables need to be created. Click the button below to start the setup process.
            </p>
            <p className="text-xs text-red-600">
              ต้องตั้งค่าฐานข้อมูลกระทู้ก่อน กรุณาคลิกปุ่มด้านล่าง
            </p>
            <Button
              onClick={() => setShowSetupModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              🔧 Setup Forum Database
            </Button>
          </CardContent>
        </Card>

        <ForumSetupModal open={showSetupModal} onOpenChange={setShowSetupModal} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalTopics}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeTopics} active, {stats.inactiveTopics} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalLikes} likes, {stats.totalReplies} replies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Avg. Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalTopics > 0
                ? ((stats.totalLikes + stats.totalReplies) / stats.totalTopics).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              per topic
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="bg-card rounded-lg p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-semibold text-primary mb-1.5 sm:mb-2 block">
              Search Topics
            </label>
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background text-foreground text-sm"
            />
          </div>

          <div>
            <label className="text-xs sm:text-sm font-semibold text-primary mb-1.5 sm:mb-2 block">
              Category
            </label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-background text-foreground text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-semibold text-primary mb-1.5 sm:mb-2 block">
              Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-background text-foreground text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Topics - Mobile: Cards, Desktop: Table */}
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No topics found
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <Card key={topic.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground line-clamp-1">{topic.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {topic.content}
                    </p>
                  </div>
                  <Badge
                    variant={topic.is_active ? "default" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {topic.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      topic.category === "general"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : topic.category === "question"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : topic.category === "review"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                  >
                    {topic.category}
                  </Badge>
                  <span>👁 {topic.views || 0}</span>
                  <span>❤ {topic.likes_count || 0}</span>
                  <span>💬 {topic.replies_count || 0}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewDetails(topic)}>
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Detail
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleToggleStatus(topic)}>
                    {topic.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleEditTopic(topic)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => { setDeleteTopicId(topic.id); setShowDeleteDialog(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-primary font-semibold">Title</TableHead>
                <TableHead className="text-primary font-semibold">Category</TableHead>
                <TableHead className="text-primary font-semibold text-center">
                  Views
                </TableHead>
                <TableHead className="text-primary font-semibold text-center">
                  Likes
                </TableHead>
                <TableHead className="text-primary font-semibold text-center">
                  Replies
                </TableHead>
                <TableHead className="text-primary font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="text-primary font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTopics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No topics found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTopics.map((topic) => (
                  <TableRow key={topic.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-foreground">{topic.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {topic.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          topic.category === "general"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : topic.category === "question"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : topic.category === "review"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                      >
                        {topic.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {topic.views || 0}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {topic.likes_count || 0}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {topic.replies_count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={topic.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {topic.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(topic)}
                          title="View details and replies"
                          className="text-foreground hover:bg-accent"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(topic)}
                          title={
                            topic.is_active
                              ? "Hide topic"
                              : "Show topic"
                          }
                          className="text-foreground hover:bg-accent"
                        >
                          {topic.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTopic(topic)}
                          className="text-foreground hover:bg-accent"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTopicId(topic.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Topic Details</DialogTitle>
            <DialogDescription>
              View and manage topic information and replies
            </DialogDescription>
          </DialogHeader>

          {selectedTopic && (
            <div className="space-y-6">
              {/* Topic Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Title</p>
                  <p className="text-foreground">{selectedTopic.title}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Content</p>
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {selectedTopic.content}
                  </p>
                </div>
                {selectedTopic.image_url && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Image</p>
                    <img
                      src={selectedTopic.image_url}
                      alt="Topic"
                      className="max-w-xs h-auto rounded-lg"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-semibold text-foreground">
                      {selectedTopic.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-semibold text-foreground">
                      {selectedTopic.views}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Likes</p>
                    <p className="font-semibold text-foreground">
                      {selectedTopic.likes_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Replies</p>
                    <p className="font-semibold text-foreground">
                      {selectedTopic.replies_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              <div>
                <p className="font-semibold text-primary mb-3">
                  Replies ({replies.length})
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No replies yet
                    </p>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-gray-50 rounded-lg p-3 flex justify-between items-start gap-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {reply.author_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-foreground mt-1">
                            {reply.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyToDelete(reply.id);
                            handleDeleteReply(reply.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleEditTopic(selectedTopic);
                  }}
                >
                  Edit Topic
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Topic</DialogTitle>
            <DialogDescription>
              Update topic information
            </DialogDescription>
          </DialogHeader>

          {editingTopic && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-primary mb-2 block">
                  Title
                </label>
                <Input
                  value={editingTopic.title || ""}
                  onChange={(e) =>
                    setEditingTopic({ ...editingTopic, title: e.target.value })
                  }
                  className="bg-white text-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-primary mb-2 block">
                  Content
                </label>
                <Textarea
                  value={editingTopic.content || ""}
                  onChange={(e) =>
                    setEditingTopic({
                      ...editingTopic,
                      content: e.target.value,
                    })
                  }
                  className="bg-white text-foreground min-h-[150px]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-primary mb-2 block">
                  Category
                </label>
                <Select
                  value={editingTopic.category}
                  onValueChange={(value: any) =>
                    setEditingTopic({ ...editingTopic, category: value })
                  }
                >
                  <SelectTrigger className="bg-white text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be
              undone. All replies to this topic will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forum Setup Modal */}
      <ForumSetupModal open={showSetupModal} onOpenChange={setShowSetupModal} />
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ForumTopic {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'general' | 'question' | 'review' | 'shopping';
  image_url?: string;
  views: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  likes_count?: number;
  replies_count?: number;
  author_name?: string;
  has_liked?: boolean;
}

export interface ForumLike {
  id: string;
  topic_id: string;
  user_id: string;
  created_at: string;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

// Helper to access forum tables that aren't in generated types yet
const forumDb = {
  topics: () => (supabase as any).from("forum_topics"),
  likes: () => (supabase as any).from("forum_likes"),
  replies: () => (supabase as any).from("forum_replies"),
};

export const useWebboard = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIncludeInactive, setLastIncludeInactive] = useState(false);

  // Fetch all topics
  const fetchTopics = async (includeInactive = false) => {
    try {
      setLoading(true);
      setError(null);
      setLastIncludeInactive(includeInactive);

      let query = forumDb.topics()
        .select("*")
        .order("created_at", { ascending: false });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error: err } = await query;

      if (err) {
        console.error("[useWebboard] Query error:", err);
        throw err;
      }

      // Fetch additional data and enrich topics
      const enrichedTopics = await Promise.all(
        (data || []).map(async (topic: any) => {
          try {
            const [likesResult, repliesResult, profileResult] = await Promise.all([
              forumDb.likes()
                .select("id")
                .eq("topic_id", topic.id),
              forumDb.replies()
                .select("id")
                .eq("topic_id", topic.id),
              supabase
                .from("profiles")
                .select("display_name")
                .eq("id", topic.user_id)
                .maybeSingle(),
            ]);

            return {
              ...topic,
              likes_count: likesResult.data?.length || 0,
              replies_count: repliesResult.data?.length || 0,
              author_name: profileResult.data?.display_name || "Anonymous User",
            };
          } catch (topicErr) {
            console.warn("[useWebboard] Error enriching topic", topic.id, topicErr);
            return {
              ...topic,
              likes_count: 0,
              replies_count: 0,
              author_name: "Anonymous User",
            };
          }
        })
      );

      setTopics(enrichedTopics as ForumTopic[]);
      return enrichedTopics;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch topics";
      console.error("[useWebboard] Fetch error:", message, err);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create new topic
  const createTopic = async (
    userId: string,
    title: string,
    content: string,
    category: 'general' | 'question' | 'review' | 'shopping',
    imageUrl?: string
  ) => {
    try {
      setError(null);

      const { data, error: err } = await forumDb.topics()
        .insert([
          {
            user_id: userId,
            title: title.trim(),
            content: content.trim(),
            category,
            image_url: imageUrl || null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (err) throw err;

      await fetchTopics(lastIncludeInactive);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create topic";
      setError(message);
      console.error("Error creating topic:", err);
      throw err;
    }
  };

  // Update topic
  const updateTopic = async (
    topicId: string,
    updates: Partial<ForumTopic>
  ) => {
    try {
      setError(null);

      const { error: err } = await forumDb.topics()
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId);

      if (err) throw err;

      await fetchTopics(lastIncludeInactive);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update topic";
      setError(message);
      console.error("Error updating topic:", err);
      throw err;
    }
  };

  // Delete topic
  const deleteTopic = async (topicId: string) => {
    try {
      setError(null);

      const { error: err } = await forumDb.topics()
        .delete()
        .eq("id", topicId);

      if (err) throw err;

      await fetchTopics(lastIncludeInactive);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete topic";
      setError(message);
      console.error("Error deleting topic:", err);
      throw err;
    }
  };

  // Toggle topic active status
  const toggleTopicStatus = async (topicId: string, isActive: boolean) => {
    return updateTopic(topicId, { is_active: !isActive });
  };

  // Upload topic image
  const uploadTopicImage = async (topicId: string, file: File) => {
    try {
      setError(null);

      const fileExt = file.name.split(".").pop();
      const fileName = `topic-${topicId}-${Date.now()}.${fileExt}`;
      const filePath = `forum/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("forum")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("forum").getPublicUrl(filePath);

      await updateTopic(topicId, { image_url: publicUrl });
      return publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      setError(message);
      console.error("Error uploading image:", err);
      throw err;
    }
  };

  // Like/unlike topic
  const toggleTopicLike = async (topicId: string, userId: string) => {
    try {
      setError(null);

      const { data: existingLike } = await forumDb.likes()
        .select("id")
        .eq("topic_id", topicId)
        .eq("user_id", userId)
        .single();

      if (existingLike) {
        const { error: err } = await forumDb.likes()
          .delete()
          .eq("id", existingLike.id);

        if (err) throw err;
      } else {
        const { error: err } = await forumDb.likes()
          .insert([{ topic_id: topicId, user_id: userId }]);

        if (err) throw err;
      }

      await fetchTopics(lastIncludeInactive);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle like";
      setError(message);
      console.error("Error toggling like:", err);
      throw err;
    }
  };

  // Add reply
  const addReply = async (topicId: string, userId: string, content: string) => {
    try {
      setError(null);

      const { data, error: err } = await forumDb.replies()
        .insert([{ topic_id: topicId, user_id: userId, content: content.trim() }])
        .select()
        .single();

      if (err) throw err;

      await fetchTopics(lastIncludeInactive);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add reply";
      setError(message);
      console.error("Error adding reply:", err);
      throw err;
    }
  };

  // Get topic with all replies
  const getTopicWithReplies = async (topicId: string) => {
    try {
      setError(null);

      const { data: topic, error: topicErr } = await forumDb.topics()
        .select("*")
        .eq("id", topicId)
        .single();

      if (topicErr) throw topicErr;

      const { data: replies, error: repliesErr } = await forumDb.replies()
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true });

      if (repliesErr) throw repliesErr;

      const enrichedReplies = await Promise.all(
        (replies || []).map(async (reply: any) => {
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

      return { topic, replies: enrichedReplies };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch topic";
      setError(message);
      console.error("Error fetching topic:", err);
      throw err;
    }
  };

  return {
    topics,
    loading,
    error,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    toggleTopicStatus,
    uploadTopicImage,
    toggleTopicLike,
    addReply,
    getTopicWithReplies,
  };
};

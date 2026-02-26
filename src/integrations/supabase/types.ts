export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      business_info: {
        Row: {
          address_en: string | null
          address_th: string | null
          business_name_en: string
          business_name_th: string
          created_at: string
          email: string | null
          facebook: string | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          line_id: string | null
          opening_hours_en: string | null
          opening_hours_th: string | null
          phone_primary: string
          phone_secondary: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          address_en?: string | null
          address_th?: string | null
          business_name_en: string
          business_name_th: string
          created_at?: string
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          line_id?: string | null
          opening_hours_en?: string | null
          opening_hours_th?: string | null
          phone_primary: string
          phone_secondary?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          address_en?: string | null
          address_th?: string | null
          business_name_en?: string
          business_name_th?: string
          created_at?: string
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          line_id?: string | null
          opening_hours_en?: string | null
          opening_hours_th?: string | null
          phone_primary?: string
          phone_secondary?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          customer_avatar: string | null
          customer_id: string
          customer_name: string
          id: string
          last_message: string | null
          last_message_at: string | null
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_avatar?: string | null
          customer_id: string
          customer_name: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_avatar?: string | null
          customer_id?: string
          customer_name?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_logs: {
        Row: {
          ai_reply: string
          created_at: string
          id: string
          intent: string | null
          ip_hash: string | null
          language: string | null
          session_id: string
          user_id: string | null
          user_message: string
        }
        Insert: {
          ai_reply: string
          created_at?: string
          id?: string
          intent?: string | null
          ip_hash?: string | null
          language?: string | null
          session_id: string
          user_id?: string | null
          user_message: string
        }
        Update: {
          ai_reply?: string
          created_at?: string
          id?: string
          intent?: string | null
          ip_hash?: string | null
          language?: string | null
          session_id?: string
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_space_features: {
        Row: {
          created_at: string
          description_en: string | null
          description_th: string | null
          event_space_id: string
          icon_name: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title_en: string
          title_th: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          event_space_id: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_en: string
          title_th: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          event_space_id?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_space_features_event_space_id_fkey"
            columns: ["event_space_id"]
            isOneToOne: false
            referencedRelation: "event_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_space_images: {
        Row: {
          created_at: string
          event_space_id: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          event_space_id: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          event_space_id?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_space_images_event_space_id_fkey"
            columns: ["event_space_id"]
            isOneToOne: false
            referencedRelation: "event_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spaces: {
        Row: {
          created_at: string
          description_en: string | null
          description_th: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          keywords_en: string | null
          keywords_th: string | null
          title_en: string
          title_th: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          keywords_en?: string | null
          keywords_th?: string | null
          title_en: string
          title_th: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          keywords_en?: string | null
          keywords_th?: string | null
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_panels: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          logo_url: string | null
          sort_order: number | null
          subtitle_en: string | null
          subtitle_th: string | null
          title_en: string
          title_th: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          sort_order?: number | null
          subtitle_en?: string | null
          subtitle_th?: string | null
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          sort_order?: number | null
          subtitle_en?: string | null
          subtitle_th?: string | null
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_toggles: {
        Row: {
          created_at: string
          description_en: string | null
          description_th: string | null
          feature_key: string
          feature_name_en: string
          feature_name_th: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          feature_key: string
          feature_name_en: string
          feature_name_th: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          feature_key?: string
          feature_name_en?: string
          feature_name_th?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          title: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          title_en: string | null
          title_th: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          title_en?: string | null
          title_th?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          title_en?: string | null
          title_th?: string | null
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          subtitle_en: string | null
          subtitle_th: string | null
          title_en: string
          title_th: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          subtitle_en?: string | null
          subtitle_th?: string | null
          title_en: string
          title_th: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          subtitle_en?: string | null
          subtitle_th?: string | null
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_th: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_th: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_th?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      menus: {
        Row: {
          category_id: string | null
          created_at: string
          description_en: string | null
          description_th: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_recommended: boolean | null
          name_en: string
          name_th: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          name_en: string
          name_th: string
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          name_en?: string
          name_th?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_perks: string[]
          avatar_frame: string | null
          avatar_url: string | null
          created_at: string
          custom_title: string | null
          display_name: string
          id: string
          reputation_points: number
          updated_at: string
        }
        Insert: {
          active_perks?: string[]
          avatar_frame?: string | null
          avatar_url?: string | null
          created_at?: string
          custom_title?: string | null
          display_name: string
          id: string
          reputation_points?: number
          updated_at?: string
        }
        Update: {
          active_perks?: string[]
          avatar_frame?: string | null
          avatar_url?: string | null
          created_at?: string
          custom_title?: string | null
          display_name?: string
          id?: string
          reputation_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      review_likes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          helpful_count: number
          id: string
          image_url: string | null
          is_active: boolean | null
          rating: number
          review_text_en: string
          review_text_th: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          helpful_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating: number
          review_text_en: string
          review_text_th: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          helpful_count?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating?: number
          review_text_en?: string
          review_text_th?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      room_availability: {
        Row: {
          availability_date: string
          booked_by: string | null
          created_at: string
          id: string
          is_available: boolean
          notes: string | null
          room_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          availability_date: string
          booked_by?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          room_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          availability_date?: string
          booked_by?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          room_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          room_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          room_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          room_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities_en: string | null
          amenities_th: string | null
          capacity: string | null
          created_at: string
          description_en: string | null
          description_th: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          name_en: string
          name_th: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          amenities_en?: string | null
          amenities_th?: string | null
          capacity?: string | null
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name_en: string
          name_th: string
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          amenities_en?: string | null
          amenities_th?: string | null
          capacity?: string | null
          created_at?: string
          description_en?: string | null
          description_th?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name_en?: string
          name_th?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          total_visits: number
          unique_visitors: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          total_visits?: number
          unique_visitors?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          total_visits?: number
          unique_visitors?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor_stats: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "staff" | "user" | "developer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user", "developer"],
    },
  },
} as const

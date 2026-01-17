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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cloud_saves: {
        Row: {
          campaign_id: string
          campaign_name: string
          chapter_count: number
          character_level: number
          character_name: string
          checksum: string
          created_at: string
          id: string
          last_synced_at: string
          play_time: number
          primary_genre: string
          save_data: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          chapter_count?: number
          character_level?: number
          character_name: string
          checksum: string
          created_at?: string
          id?: string
          last_synced_at?: string
          play_time?: number
          primary_genre: string
          save_data: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          chapter_count?: number
          character_level?: number
          character_name?: string
          checksum?: string
          created_at?: string
          id?: string
          last_synced_at?: string
          play_time?: number
          primary_genre?: string
          save_data?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      generated_sounds: {
        Row: {
          category: string
          created_at: string | null
          duration_seconds: number | null
          filename: string
          id: string
          prompt: string
          public_url: string
          storage_path: string
        }
        Insert: {
          category: string
          created_at?: string | null
          duration_seconds?: number | null
          filename: string
          id?: string
          prompt: string
          public_url: string
          storage_path: string
        }
        Update: {
          category?: string
          created_at?: string | null
          duration_seconds?: number | null
          filename?: string
          id?: string
          prompt?: string
          public_url?: string
          storage_path?: string
        }
        Relationships: []
      }
      inventory_sync_logs: {
        Row: {
          app_version: string
          build_number: string
          campaign_id: string | null
          confidence: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          instance_id: string | null
          item_name: string | null
          matched_to: string | null
          pattern_used: string | null
          session_id: string
          source: string | null
          success: boolean
        }
        Insert: {
          app_version: string
          build_number: string
          campaign_id?: string | null
          confidence?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          instance_id?: string | null
          item_name?: string | null
          matched_to?: string | null
          pattern_used?: string | null
          session_id: string
          source?: string | null
          success?: boolean
        }
        Update: {
          app_version?: string
          build_number?: string
          campaign_id?: string | null
          confidence?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          instance_id?: string | null
          item_name?: string | null
          matched_to?: string | null
          pattern_used?: string | null
          session_id?: string
          source?: string | null
          success?: boolean
        }
        Relationships: []
      }
      lifetime_stats: {
        Row: {
          created_at: string
          id: string
          stats_data: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          stats_data?: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          stats_data?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      npc_portraits: {
        Row: {
          created_at: string
          id: string
          npc_id: string
          portrait_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          npc_id: string
          portrait_url: string
        }
        Update: {
          created_at?: string
          id?: string
          npc_id?: string
          portrait_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          api_key: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          model: string | null
          provider: Database["public"]["Enums"]["ai_provider"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          provider: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback_comments: {
        Row: {
          content: string
          created_at: string | null
          feedback_id: string
          id: string
          is_internal: boolean | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          feedback_id: string
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          feedback_id?: string
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedbacks"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          analysis: Json | null
          conversation_at: string | null
          created_at: string | null
          customer_name: string | null
          description: string | null
          external_created_at: string | null
          external_id: string | null
          external_updated_at: string | null
          id: string
          integration_id: string | null
          interviewee_name: string | null
          is_topic_analyzed: boolean
          metadata: Json | null
          priority: Database["public"]["Enums"]["feedback_priority"] | null
          source: Database["public"]["Enums"]["feedback_source"]
          status: Database["public"]["Enums"]["feedback_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          conversation_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          external_created_at?: string | null
          external_id?: string | null
          external_updated_at?: string | null
          id?: string
          integration_id?: string | null
          interviewee_name?: string | null
          is_topic_analyzed?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          source: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          conversation_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          external_created_at?: string | null
          external_id?: string | null
          external_updated_at?: string | null
          id?: string
          integration_id?: string | null
          interviewee_name?: string | null
          is_topic_analyzed?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          source?: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          action: string | null
          created_at: string
          description: string
          id: string
          severity: Database["public"]["Enums"]["insight_severity"]
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          description: string
          id?: string
          severity: Database["public"]["Enums"]["insight_severity"]
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Update: {
          action?: string | null
          created_at?: string
          description?: string
          id?: string
          severity?: Database["public"]["Enums"]["insight_severity"]
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["insight_type"]
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          source: Database["public"]["Enums"]["feedback_source"]
          sync_frequency: Database["public"]["Enums"]["integration_sync_frequency"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          source: Database["public"]["Enums"]["feedback_source"]
          sync_frequency?: Database["public"]["Enums"]["integration_sync_frequency"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          source?: Database["public"]["Enums"]["feedback_source"]
          sync_frequency?: Database["public"]["Enums"]["integration_sync_frequency"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      opportunity_insights: {
        Row: {
          insight_id: string
          opportunity_id: string
        }
        Insert: {
          insight_id: string
          opportunity_id: string
        }
        Update: {
          insight_id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_insights_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_insights_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "product_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      product_opportunities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          integration_id: string
          items_created: number | null
          items_processed: number | null
          items_updated: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          items_created?: number | null
          items_processed?: number | null
          items_updated?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          items_created?: number | null
          items_processed?: number | null
          items_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_analysis_results: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          status: string
          topics: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          topics?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          topics?: Json | null
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
      ai_provider: "openai" | "google"
      feedback_priority: "low" | "medium" | "high" | "critical"
      feedback_source: "jira" | "notion" | "zoho" | "manual" | "zapier"
      feedback_status: "new" | "in_progress" | "resolved" | "closed"
      insight_severity: "info" | "warning" | "success" | "error"
      insight_type: "trend" | "alert" | "opportunity" | "other"
      integration_sync_frequency: "manual" | "hourly" | "twice_daily" | "daily"
      opportunity_status: "backlog" | "próximo" | "em_andamento" | "concluído"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_provider: ["openai", "google"],
      feedback_priority: ["low", "medium", "high", "critical"],
      feedback_source: ["jira", "notion", "zoho", "manual", "zapier"],
      feedback_status: ["new", "in_progress", "resolved", "closed"],
      insight_severity: ["info", "warning", "success", "error"],
      insight_type: ["trend", "alert", "opportunity", "other"],
      integration_sync_frequency: ["manual", "hourly", "twice_daily", "daily"],
      opportunity_status: ["backlog", "próximo", "em_andamento", "concluído"],
    },
  },
} as const

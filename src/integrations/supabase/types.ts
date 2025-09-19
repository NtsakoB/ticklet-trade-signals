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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accuracy_snapshots: {
        Row: {
          accuracy_curve: number[]
          created_at: string | null
          curve_length: number | null
          id: string
          max_accuracy: number | null
          min_accuracy: number | null
          strategy: string
          timestamp: string | null
        }
        Insert: {
          accuracy_curve: number[]
          created_at?: string | null
          curve_length?: number | null
          id?: string
          max_accuracy?: number | null
          min_accuracy?: number | null
          strategy: string
          timestamp?: string | null
        }
        Update: {
          accuracy_curve?: number[]
          created_at?: string | null
          curve_length?: number | null
          id?: string
          max_accuracy?: number | null
          min_accuracy?: number | null
          strategy?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      chat_logs: {
        Row: {
          conversation: Json
          created_at: string
          id: string
          message_count: number | null
          strategy: string
          timestamp: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation?: Json
          created_at?: string
          id?: string
          message_count?: number | null
          strategy?: string
          timestamp?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation?: Json
          created_at?: string
          id?: string
          message_count?: number | null
          strategy?: string
          timestamp?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_logs_audit: {
        Row: {
          audit_id: number
          chat_log_id: string
          new_value: Json | null
          old_value: Json | null
          operation: string
          timestamp: string
          user_id: string
        }
        Insert: {
          audit_id?: number
          chat_log_id: string
          new_value?: Json | null
          old_value?: Json | null
          operation: string
          timestamp?: string
          user_id: string
        }
        Update: {
          audit_id?: number
          chat_log_id?: string
          new_value?: Json | null
          old_value?: Json | null
          operation?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          extra: Json | null
          id: number
          role: string
          session_id: string | null
          tool_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          extra?: Json | null
          id?: number
          role: string
          session_id?: string | null
          tool_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          extra?: Json | null
          id?: number
          role?: string
          session_id?: string | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          meta: Json | null
          title: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          meta?: Json | null
          title?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          meta?: Json | null
          title?: string | null
        }
        Relationships: []
      }
      engine_settings: {
        Row: {
          id: boolean
          live_enabled: boolean
          paper_enabled: boolean
          paper_strategy: string
        }
        Insert: {
          id?: boolean
          live_enabled?: boolean
          paper_enabled?: boolean
          paper_strategy?: string
        }
        Update: {
          id?: boolean
          live_enabled?: boolean
          paper_enabled?: boolean
          paper_strategy?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_settings_paper_strategy_fkey"
            columns: ["paper_strategy"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["name"]
          },
        ]
      }
      learning_entries: {
        Row: {
          context: Json
          created_at: string
          id: string
          instruction: string
          response: string
          strategy: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          instruction: string
          response: string
          strategy: string
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          instruction?: string
          response?: string
          strategy?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_entries_audit: {
        Row: {
          audit_id: number
          learning_entry_id: string
          new_value: Json | null
          old_value: Json | null
          operation: string
          timestamp: string
          user_id: string
        }
        Insert: {
          audit_id?: number
          learning_entry_id: string
          new_value?: Json | null
          old_value?: Json | null
          operation: string
          timestamp?: string
          user_id: string
        }
        Update: {
          audit_id?: number
          learning_entry_id?: string
          new_value?: Json | null
          old_value?: Json | null
          operation?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          closed_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          leverage: number | null
          opened_at: string
          pnl: number | null
          qty: number
          reason_closed: string | null
          side: string
          signal_id: string | null
          status: string
          strategy: string
          symbol: string
        }
        Insert: {
          closed_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          leverage?: number | null
          opened_at?: string
          pnl?: number | null
          qty: number
          reason_closed?: string | null
          side: string
          signal_id?: string | null
          status?: string
          strategy: string
          symbol: string
        }
        Update: {
          closed_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          leverage?: number | null
          opened_at?: string
          pnl?: number | null
          qty?: number
          reason_closed?: string | null
          side?: string
          signal_id?: string | null
          status?: string
          strategy?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_trades_strategy_fkey"
            columns: ["strategy"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["name"]
          },
        ]
      }
      report_failures: {
        Row: {
          component: string
          created_at: string
          detail: string
          id: string
          meta: Json | null
          timestamp: string
        }
        Insert: {
          component: string
          created_at?: string
          detail: string
          id?: string
          meta?: Json | null
          timestamp?: string
        }
        Update: {
          component?: string
          created_at?: string
          detail?: string
          id?: string
          meta?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      signal_events: {
        Row: {
          at: string
          details: Json | null
          event: string
          id: number
          price: number | null
          signal_id: string
        }
        Insert: {
          at?: string
          details?: Json | null
          event: string
          id?: number
          price?: number | null
          signal_id: string
        }
        Update: {
          at?: string
          details?: Json | null
          event?: string
          id?: number
          price?: number | null
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_events_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_scores: {
        Row: {
          anomaly: number | null
          confidence: number | null
          created_at: string | null
          id: string
          macd: number | null
          rsi: number | null
          strategy: string
          symbol: string
          timestamp: string | null
        }
        Insert: {
          anomaly?: number | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          macd?: number | null
          rsi?: number | null
          strategy: string
          symbol: string
          timestamp?: string | null
        }
        Update: {
          anomaly?: number | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          macd?: number | null
          rsi?: number | null
          strategy?: string
          symbol?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          closed_at: string | null
          created_at: string
          entry_price: number
          id: string
          meta: Json | null
          reason_closed: string | null
          stage: string
          status: string
          stop_price: number
          strategy: string
          symbol: string
          targets: Json
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry_price: number
          id?: string
          meta?: Json | null
          reason_closed?: string | null
          stage?: string
          status: string
          stop_price: number
          strategy: string
          symbol: string
          targets: Json
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          id?: string
          meta?: Json | null
          reason_closed?: string | null
          stage?: string
          status?: string
          stop_price?: number
          strategy?: string
          symbol?: string
          targets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "signals_strategy_fkey"
            columns: ["strategy"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["name"]
          },
        ]
      }
      strategies: {
        Row: {
          active: boolean
          name: string
        }
        Insert: {
          active?: boolean
          name: string
        }
        Update: {
          active?: boolean
          name?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: number
          joined_at: string | null
          role: string
          team_id: number
          user_id: string
        }
        Insert: {
          id?: never
          joined_at?: string | null
          role?: string
          team_id: number
          user_id: string
        }
        Update: {
          id?: never
          joined_at?: string | null
          role?: string
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      Ticklet: {
        Row: {
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      trade_history_log: {
        Row: {
          confidence: number | null
          created_at: string
          entry_price: number | null
          id: string
          pnl: number | null
          signal_id: string | null
          stop_loss_hit: boolean | null
          stop_loss_price: number | null
          strategy: string
          symbol: string
          tp1_hit: boolean | null
          tp1_price: number | null
          tp2_hit: boolean | null
          tp2_price: number | null
          tp3_hit: boolean | null
          tp3_price: number | null
          trade_duration: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          id?: string
          pnl?: number | null
          signal_id?: string | null
          stop_loss_hit?: boolean | null
          stop_loss_price?: number | null
          strategy?: string
          symbol: string
          tp1_hit?: boolean | null
          tp1_price?: number | null
          tp2_hit?: boolean | null
          tp2_price?: number | null
          tp3_hit?: boolean | null
          tp3_price?: number | null
          trade_duration?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          id?: string
          pnl?: number | null
          signal_id?: string | null
          stop_loss_hit?: boolean | null
          stop_loss_price?: number | null
          strategy?: string
          symbol?: string
          tp1_hit?: boolean | null
          tp1_price?: number | null
          tp2_hit?: boolean | null
          tp2_price?: number | null
          tp3_hit?: boolean | null
          tp3_price?: number | null
          trade_duration?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          closed_at: string | null
          entry_price: number
          id: string
          leverage: number | null
          mode: string
          opened_at: string
          pnl_abs: number | null
          pnl_pct: number | null
          qty: number | null
          status: string
          strategy: string
          symbol: string
        }
        Insert: {
          closed_at?: string | null
          entry_price: number
          id?: string
          leverage?: number | null
          mode?: string
          opened_at?: string
          pnl_abs?: number | null
          pnl_pct?: number | null
          qty?: number | null
          status?: string
          strategy?: string
          symbol: string
        }
        Update: {
          closed_at?: string | null
          entry_price?: number
          id?: string
          leverage?: number | null
          mode?: string
          opened_at?: string
          pnl_abs?: number | null
          pnl_pct?: number | null
          qty?: number | null
          status?: string
          strategy?: string
          symbol?: string
        }
        Relationships: []
      }
      user_trade_counters: {
        Row: {
          created_at: string
          last_retrain_at: string | null
          trade_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_retrain_at?: string | null
          trade_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_retrain_at?: string | null
          trade_count?: number
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
      debug_team_membership: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_message: string
          error_type: string
        }[]
      }
      get_teams_for_user: {
        Args: { p_user_id: string }
        Returns: {
          joined_at: string
          team_id: number
          team_name: string
          user_role: string
        }[]
      }
      is_team_member: {
        Args: { p_team_id: number; p_user_id: string }
        Returns: boolean
      }
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

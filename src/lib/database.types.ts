
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_content": {
                  Row: {
                    "content_type": string,"created_at": string,"description": string,"id": string,"payload": NonNullable<Json>,"slug": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content_type": string,"created_at"?: string,"description"?: string,"id"?: string,"payload"?: NonNullable<Json>,"slug": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "content_type"?: string,"created_at"?: string,"description"?: string,"id"?: string,"payload"?: NonNullable<Json>,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"billing_config": {
                  Row: {
                    "past_due_grace_days": number,"paywall_enabled": boolean,"singleton": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "past_due_grace_days"?: number,"paywall_enabled"?: boolean,"singleton"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "past_due_grace_days"?: number,"paywall_enabled"?: boolean,"singleton"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"display_name_blocklist": {
                  Row: {
                    "blocked_name": string,"match_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_name": string,"match_type"?: string
                  }
                  Update: {
                    "blocked_name"?: string,"match_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"entitlement_features": {
                  Row: {
                    "feature": string
                  }
                  ComputedFields: never
                  Insert: {
                    "feature": string
                  }
                  Update: {
                    "feature"?: string
                  }
                  Relationships: [
                    
                  ]
                },"entitlements": {
                  Row: {
                    "current_period_end": string | null,"feature": string,"granted_at": string,"id": string,"past_due_since": string | null,"source": string,"status": string,"stripe_checkout_session_id": string | null,"stripe_payment_intent_id": string | null,"stripe_subscription_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "current_period_end"?: string | null,"feature": string,"granted_at"?: string,"id"?: string,"past_due_since"?: string | null,"source": string,"status": string,"stripe_checkout_session_id"?: string | null,"stripe_payment_intent_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "current_period_end"?: string | null,"feature"?: string,"granted_at"?: string,"id"?: string,"past_due_since"?: string | null,"source"?: string,"status"?: string,"stripe_checkout_session_id"?: string | null,"stripe_payment_intent_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entitlements_feature_fkey"
      columns: ["feature"]
isOneToOne: false
      referencedRelation: "entitlement_features"
      referencedColumns: ["feature"]
    }
                  ]
                },"game_catalog": {
                  Row: {
                    "active": boolean,"game_id": string,"kind": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"game_id": string,"kind": string
                  }
                  Update: {
                    "active"?: boolean,"game_id"?: string,"kind"?: string
                  }
                  Relationships: [
                    
                  ]
                },"game_results": {
                  Row: {
                    "attempts": number | null,"client_result_id": string,"created_at": string,"difficulty": string,"duration_ms": number | null,"flagged": boolean,"game_id": string,"hints_used": number,"id": string,"imported": boolean,"match_mode": string,"move_count": number | null,"outcome": string,"points_awarded": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number | null,"client_result_id": string,"created_at"?: string,"difficulty": string,"duration_ms"?: number | null,"flagged"?: boolean,"game_id": string,"hints_used"?: number,"id"?: string,"imported"?: boolean,"match_mode"?: string,"move_count"?: number | null,"outcome": string,"points_awarded"?: number,"user_id": string
                  }
                  Update: {
                    "attempts"?: number | null,"client_result_id"?: string,"created_at"?: string,"difficulty"?: string,"duration_ms"?: number | null,"flagged"?: boolean,"game_id"?: string,"hints_used"?: number,"id"?: string,"imported"?: boolean,"match_mode"?: string,"move_count"?: number | null,"outcome"?: string,"points_awarded"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "game_results_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "game_catalog"
      referencedColumns: ["game_id"]
    },{
      foreignKeyName: "game_results_game_id_games_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    }
                  ]
                },"game_stats": {
                  Row: {
                    "best_attempts": number | null,"best_streak": number,"current_streak": number,"difficulty": string,"draws": number,"game_id": string,"losses": number,"played": number,"points": number,"total_attempts_in_wins": number,"updated_at": string,"user_id": string,"wins": number
                  }
                  ComputedFields: never
                  Insert: {
                    "best_attempts"?: number | null,"best_streak"?: number,"current_streak"?: number,"difficulty": string,"draws"?: number,"game_id": string,"losses"?: number,"played"?: number,"points"?: number,"total_attempts_in_wins"?: number,"updated_at"?: string,"user_id": string,"wins"?: number
                  }
                  Update: {
                    "best_attempts"?: number | null,"best_streak"?: number,"current_streak"?: number,"difficulty"?: string,"draws"?: number,"game_id"?: string,"losses"?: number,"played"?: number,"points"?: number,"total_attempts_in_wins"?: number,"updated_at"?: string,"user_id"?: string,"wins"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "game_stats_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "game_catalog"
      referencedColumns: ["game_id"]
    },{
      foreignKeyName: "game_stats_game_id_games_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    }
                  ]
                },"games": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id": string,"name": string,"type": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"imported_stats": {
                  Row: {
                    "best_attempts": number | null,"best_streak": number,"difficulty": string,"draws": number,"game_id": string,"imported": boolean,"imported_at": string,"losses": number,"played": number,"points": number,"total_attempts_in_wins": number,"user_id": string,"wins": number
                  }
                  ComputedFields: never
                  Insert: {
                    "best_attempts"?: number | null,"best_streak"?: number,"difficulty": string,"draws"?: number,"game_id": string,"imported"?: boolean,"imported_at"?: string,"losses"?: number,"played"?: number,"points"?: number,"total_attempts_in_wins"?: number,"user_id": string,"wins"?: number
                  }
                  Update: {
                    "best_attempts"?: number | null,"best_streak"?: number,"difficulty"?: string,"draws"?: number,"game_id"?: string,"imported"?: boolean,"imported_at"?: string,"losses"?: number,"played"?: number,"points"?: number,"total_attempts_in_wins"?: number,"user_id"?: string,"wins"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "imported_stats_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "game_catalog"
      referencedColumns: ["game_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"imported_local_stats": boolean,"stats_imported": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"imported_local_stats"?: boolean,"stats_imported"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"imported_local_stats"?: boolean,"stats_imported"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"puzzle_limits": {
                  Row: {
                    "difficulty": string,"game_id": string,"max_attempts": number
                  }
                  ComputedFields: never
                  Insert: {
                    "difficulty": string,"game_id": string,"max_attempts": number
                  }
                  Update: {
                    "difficulty"?: string,"game_id"?: string,"max_attempts"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "puzzle_limits_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "game_catalog"
      referencedColumns: ["game_id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"reason": string,"reported_display_name": string,"reporter_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason": string,"reported_display_name": string,"reporter_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string,"reported_display_name"?: string,"reporter_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stripe_customers": {
                  Row: {
                    "created_at": string,"stripe_customer_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"stripe_customer_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"stripe_customer_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stripe_events": {
                  Row: {
                    "claimed_at": string,"error": string | null,"event_id": string,"processed_at": string | null,"received_at": string,"status": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "claimed_at"?: string,"error"?: string | null,"event_id": string,"processed_at"?: string | null,"received_at"?: string,"status"?: string,"type": string
                  }
                  Update: {
                    "claimed_at"?: string,"error"?: string | null,"event_id"?: string,"processed_at"?: string | null,"received_at"?: string,"status"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "leaderboard_all_time": {
                  Row: {
                    "display_name": string | null,"game_id": string | null,"points": number | null,"rank": number | null,"wins": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"leaderboard_weekly": {
                  Row: {
                    "display_name": string | null,"game_id": string | null,"points": number | null,"rank": number | null,"wins": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "_has_entitlement_for_user":
{ Args: { "p_feature": string,"p_user_id": string }; Returns: boolean
                           },
"_result_totals":
{ Args: { "p_difficulty": string,"p_game": string,"p_user": string }; Returns: Json
                           },
"apply_entitlement_changes":
{ Args: { "p_changes": Json }; Returns: number
                           },
"claim_stripe_event":
{ Args: { "p_event_id": string,"p_type": string }; Returns: string
                           },
"complete_stripe_event":
{ Args: { "p_error"?: string,"p_event_id": string,"p_ok": boolean }; Returns: undefined
                           },
"compute_points":
{ Args: { "p_attempts": number,"p_difficulty": string,"p_hints": number,"p_kind": string,"p_max_attempts": number,"p_outcome": string,"p_streak": number }; Returns: number
                           },
"delete_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"has_entitlement":
{ Args: { "p_feature": string }; Returns: boolean
                           },
"import_local_stats":
{ Args: { "p_payload": Json }; Returns: Json
                           },
"is_expert_allowed":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"latrunculi_admin_metrics":
{ Args: { "window_days"?: number }; Returns: Json
                           },
"my_entitlements":
{ Args: Record<PropertyKey, never>; Returns: {
              "current_period_end": string,"feature": string,"is_active": boolean,"status": string
            }[]
                           },
"my_rank":
{ Args: { "p_game_id": string,"p_period": string }; Returns: {
              "points": number,"rank": number,"wins": number
            }[]
                           },
"normalise_display_name":
{ Args: { "p_name": string }; Returns: string
                           },
"submit_result":
{ Args: { "p_attempts"?: number,"p_client_result_id": string,"p_difficulty": string,"p_game_id": string,"p_hints_used"?: number,"p_outcome": string }; Returns: Json
                           } |
{ Args: { "p_attempts": number,"p_client_result_id": string,"p_difficulty": string,"p_game_id": string,"p_hints_used": number,"p_match_mode": string,"p_outcome": string }; Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

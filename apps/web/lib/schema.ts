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
      access_audit_log: {
        Row: {
          access_audit_log_id: string
          action: string
          actor_id: string
          created_at: string
          legal_purpose: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          access_audit_log_id?: string
          action: string
          actor_id: string
          created_at?: string
          legal_purpose: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          access_audit_log_id?: string
          action?: string
          actor_id?: string
          created_at?: string
          legal_purpose?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      authority_submission: {
        Row: {
          acknowledgement_ref: string | null
          authority_submission_id: string
          authority_type: string
          company_id: string
          created_at: string
          payload_enc: string | null
          payroll_period_id: string | null
          status: string
          submission_type: string
          submitted_at: string | null
        }
        Insert: {
          acknowledgement_ref?: string | null
          authority_submission_id?: string
          authority_type: string
          company_id: string
          created_at?: string
          payload_enc?: string | null
          payroll_period_id?: string | null
          status: string
          submission_type: string
          submitted_at?: string | null
        }
        Update: {
          acknowledgement_ref?: string | null
          authority_submission_id?: string
          authority_type?: string
          company_id?: string
          created_at?: string
          payload_enc?: string | null
          payroll_period_id?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authority_submission_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "authority_submission_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_period"
            referencedColumns: ["payroll_period_id"]
          },
        ]
      }
      company: {
        Row: {
          company_id: string
          country_code: string
          created_at: string
          legal_name: string
        }
        Insert: {
          company_id?: string
          country_code: string
          created_at?: string
          legal_name: string
        }
        Update: {
          company_id?: string
          country_code?: string
          created_at?: string
          legal_name?: string
        }
        Relationships: []
      }
      company_onchain_binding: {
        Row: {
          active: boolean
          chain_id: number
          company_id: string
          company_onchain_binding_id: string
          created_at: string
          employer_wallet_address: string
          payroll_contract_address: string
        }
        Insert: {
          active?: boolean
          chain_id: number
          company_id: string
          company_onchain_binding_id?: string
          created_at?: string
          employer_wallet_address: string
          payroll_contract_address: string
        }
        Update: {
          active?: boolean
          chain_id?: number
          company_id?: string
          company_onchain_binding_id?: string
          created_at?: string
          employer_wallet_address?: string
          payroll_contract_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_onchain_binding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["company_id"]
          },
        ]
      }
      data_subject_request: {
        Row: {
          closed_at: string | null
          dsr_id: string
          due_at: string
          person_id: string
          received_at: string
          request_type: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          dsr_id?: string
          due_at: string
          person_id: string
          received_at?: string
          request_type: string
          status: string
        }
        Update: {
          closed_at?: string | null
          dsr_id?: string
          due_at?: string
          person_id?: string
          received_at?: string
          request_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_request_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      employment: {
        Row: {
          company_id: string
          created_at: string
          employment_id: string
          employment_status: string
          end_date: string | null
          job_title: string | null
          payroll_cadence: string
          person_id: string
          start_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employment_id?: string
          employment_status: string
          end_date?: string | null
          job_title?: string | null
          payroll_cadence?: string
          person_id: string
          start_date: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employment_id?: string
          employment_status?: string
          end_date?: string | null
          job_title?: string | null
          payroll_cadence?: string
          person_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "employment_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      employment_chain_binding: {
        Row: {
          active: boolean
          company_onchain_binding_id: string
          employment_chain_binding_id: string
          employment_id: string
          linked_at: string
          person_wallet_id: string
          unlinked_at: string | null
        }
        Insert: {
          active?: boolean
          company_onchain_binding_id: string
          employment_chain_binding_id?: string
          employment_id: string
          linked_at?: string
          person_wallet_id: string
          unlinked_at?: string | null
        }
        Update: {
          active?: boolean
          company_onchain_binding_id?: string
          employment_chain_binding_id?: string
          employment_id?: string
          linked_at?: string
          person_wallet_id?: string
          unlinked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_chain_binding_company_onchain_binding_id_fkey"
            columns: ["company_onchain_binding_id"]
            isOneToOne: false
            referencedRelation: "company_onchain_binding"
            referencedColumns: ["company_onchain_binding_id"]
          },
          {
            foreignKeyName: "employment_chain_binding_employment_id_fkey"
            columns: ["employment_id"]
            isOneToOne: false
            referencedRelation: "employment"
            referencedColumns: ["employment_id"]
          },
          {
            foreignKeyName: "employment_chain_binding_person_wallet_id_fkey"
            columns: ["person_wallet_id"]
            isOneToOne: false
            referencedRelation: "person_wallet"
            referencedColumns: ["person_wallet_id"]
          },
        ]
      }
      payroll_entry: {
        Row: {
          created_at: string
          currency_code: string
          employment_id: string
          gross_amount_minor: number
          net_amount_minor: number
          onchain_payment_status: string
          onchain_payment_tx_hash: string | null
          payroll_entry_id: string
          payroll_period_id: string
          social_security_minor: number | null
          tax_withheld_minor: number | null
        }
        Insert: {
          created_at?: string
          currency_code: string
          employment_id: string
          gross_amount_minor: number
          net_amount_minor: number
          onchain_payment_status: string
          onchain_payment_tx_hash?: string | null
          payroll_entry_id?: string
          payroll_period_id: string
          social_security_minor?: number | null
          tax_withheld_minor?: number | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          employment_id?: string
          gross_amount_minor?: number
          net_amount_minor?: number
          onchain_payment_status?: string
          onchain_payment_tx_hash?: string | null
          payroll_entry_id?: string
          payroll_period_id?: string
          social_security_minor?: number | null
          tax_withheld_minor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entry_employment_id_fkey"
            columns: ["employment_id"]
            isOneToOne: false
            referencedRelation: "employment"
            referencedColumns: ["employment_id"]
          },
          {
            foreignKeyName: "payroll_entry_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_period"
            referencedColumns: ["payroll_period_id"]
          },
        ]
      }
      payroll_period: {
        Row: {
          company_id: string
          created_at: string
          pay_date: string
          payroll_period_id: string
          period_code: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          pay_date: string
          payroll_period_id?: string
          period_code: string
          period_end: string
          period_start: string
          status: string
        }
        Update: {
          company_id?: string
          created_at?: string
          pay_date?: string
          payroll_period_id?: string
          period_code?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_period_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["company_id"]
          },
        ]
      }
      person: {
        Row: {
          created_at: string
          person_id: string
          status: string
        }
        Insert: {
          created_at?: string
          person_id?: string
          status: string
        }
        Update: {
          created_at?: string
          person_id?: string
          status?: string
        }
        Relationships: []
      }
      person_identity: {
        Row: {
          address_enc: string | null
          dni_search_hmac: string
          dni_type: string
          dni_value_enc: string
          email_enc: string | null
          encryption_key_ref: string
          family_name_enc: string
          given_name_enc: string
          person_id: string
          ssn_value_enc: string | null
          updated_at: string
        }
        Insert: {
          address_enc?: string | null
          dni_search_hmac: string
          dni_type: string
          dni_value_enc: string
          email_enc?: string | null
          encryption_key_ref: string
          family_name_enc: string
          given_name_enc: string
          person_id: string
          ssn_value_enc?: string | null
          updated_at?: string
        }
        Update: {
          address_enc?: string | null
          dni_search_hmac?: string
          dni_type?: string
          dni_value_enc?: string
          email_enc?: string | null
          encryption_key_ref?: string
          family_name_enc?: string
          given_name_enc?: string
          person_id?: string
          ssn_value_enc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_identity_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      person_wallet: {
        Row: {
          active: boolean
          chain_id: number
          created_at: string
          person_id: string
          person_wallet_id: string
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          active?: boolean
          chain_id: number
          created_at?: string
          person_id: string
          person_wallet_id?: string
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          active?: boolean
          chain_id?: number
          created_at?: string
          person_id?: string
          person_wallet_id?: string
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_wallet_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
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

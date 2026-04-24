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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          acquisition_date: string | null
          branch: string
          category: string
          code: string
          condition: string
          created_at: string
          description: string | null
          floor: string | null
          id: string
          image_url: string | null
          inventoried: boolean
          name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          branch: string
          category: string
          code: string
          condition?: string
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          image_url?: string | null
          inventoried?: boolean
          name: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          branch?: string
          category?: string
          code?: string
          condition?: string
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          image_url?: string | null
          inventoried?: boolean
          name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          active: boolean
          created_at: string
          department: string
          floor: string | null
          id: string
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department: string
          floor?: string | null
          id?: string
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          floor?: string | null
          id?: string
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          allocations: Json | null
          amount: number
          card_name: string | null
          category: string
          company: string
          cost_center: string
          created_at: string
          description: string
          expense_date: string
          id: string
          installment_count: number | null
          installment_current: number | null
          is_installment: boolean
          notes: string | null
          receipt_url: string | null
          status: string
          supplier: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          allocations?: Json | null
          amount?: number
          card_name?: string | null
          category: string
          company: string
          cost_center: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          installment_count?: number | null
          installment_current?: number | null
          is_installment?: boolean
          notes?: string | null
          receipt_url?: string | null
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          allocations?: Json | null
          amount?: number
          card_name?: string | null
          category?: string
          company?: string
          cost_center?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          installment_count?: number | null
          installment_current?: number | null
          is_installment?: boolean
          notes?: string | null
          receipt_url?: string | null
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          actual_cost: number | null
          branch: string
          category: string
          completed_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          floor: string | null
          id: string
          maintenance_type: string
          notes: string | null
          priority: string
          recurrence_months: number | null
          status: string
          supplier: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          branch?: string
          category: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          floor?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          priority?: string
          recurrence_months?: number | null
          status?: string
          supplier?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          branch?: string
          category?: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          floor?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          priority?: string
          recurrence_months?: number | null
          status?: string
          supplier?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nf_items: {
        Row: {
          category: string | null
          financial_link_type: string | null
          id: string
          name: string
          nf_upload_id: string
          quantity: number
          total_price: number
          unit_of_measure: string | null
          unit_price: number
        }
        Insert: {
          category?: string | null
          financial_link_type?: string | null
          id?: string
          name: string
          nf_upload_id: string
          quantity: number
          total_price?: number
          unit_of_measure?: string | null
          unit_price?: number
        }
        Update: {
          category?: string | null
          financial_link_type?: string | null
          id?: string
          name?: string
          nf_upload_id?: string
          quantity?: number
          total_price?: number
          unit_of_measure?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nf_items_nf_upload_id_fkey"
            columns: ["nf_upload_id"]
            isOneToOne: false
            referencedRelation: "nf_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      nf_uploads: {
        Row: {
          created_at: string
          discount_value: number | null
          file_name: string
          file_url: string | null
          freight_value: number | null
          id: string
          issue_date: string | null
          other_expenses: number | null
          recipient_city: string | null
          recipient_doc: string | null
          recipient_doc_type: string | null
          recipient_name: string | null
          status: string
          supplier: string | null
          supplier_cnpj: string | null
          total_value: number | null
          unit: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          discount_value?: number | null
          file_name: string
          file_url?: string | null
          freight_value?: number | null
          id?: string
          issue_date?: string | null
          other_expenses?: number | null
          recipient_city?: string | null
          recipient_doc?: string | null
          recipient_doc_type?: string | null
          recipient_name?: string | null
          status?: string
          supplier?: string | null
          supplier_cnpj?: string | null
          total_value?: number | null
          unit?: string
          updated_at?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          discount_value?: number | null
          file_name?: string
          file_url?: string | null
          freight_value?: number | null
          id?: string
          issue_date?: string | null
          other_expenses?: number | null
          recipient_city?: string | null
          recipient_doc?: string | null
          recipient_doc_type?: string | null
          recipient_name?: string | null
          status?: string
          supplier?: string | null
          supplier_cnpj?: string | null
          total_value?: number | null
          unit?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: []
      }
      operational_budgets_monthly: {
        Row: {
          amount: number
          branch: string
          category: string
          created_at: string
          id: string
          macrobloco: string
          month: number
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          branch: string
          category: string
          created_at?: string
          id?: string
          macrobloco: string
          month: number
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          branch?: string
          category?: string
          created_at?: string
          id?: string
          macrobloco?: string
          month?: number
          notes?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      operational_expenses: {
        Row: {
          amount: number
          branch: string
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          macrobloco: string
          notes: string | null
          receipt_url: string | null
          supplier: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          branch: string
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          macrobloco: string
          notes?: string | null
          receipt_url?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          branch?: string
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          macrobloco?: string
          notes?: string | null
          receipt_url?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          allocations: Json | null
          amount: number
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          boleto_url: string | null
          category: string
          company: string
          cost_center: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          pix_key: string | null
          receipt_url: string | null
          request_date: string
          status: string
          supplier: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          allocations?: Json | null
          amount?: number
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          boleto_url?: string | null
          category: string
          company: string
          cost_center: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pix_key?: string | null
          receipt_url?: string | null
          request_date?: string
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          allocations?: Json | null
          amount?: number
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          boleto_url?: string | null
          category?: string
          company?: string
          cost_center?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          pix_key?: string | null
          receipt_url?: string | null
          request_date?: string
          status?: string
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          min_stock: number | null
          name: string
          quantity: number
          total_price: number
          unit: string
          unit_of_measure: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          min_stock?: number | null
          name: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          min_stock?: number | null
          name?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      recurring_expense_runs: {
        Row: {
          generated_at: string
          id: string
          month: number
          payment_request_id: string | null
          recurring_expense_id: string
          year: number
        }
        Insert: {
          generated_at?: string
          id?: string
          month: number
          payment_request_id?: string | null
          recurring_expense_id: string
          year: number
        }
        Update: {
          generated_at?: string
          id?: string
          month?: number
          payment_request_id?: string | null
          recurring_expense_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expense_runs_recurring_expense_id_fkey"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          active: boolean
          amount: number
          branch: string
          category: string
          company: string
          cost_center: string
          created_at: string
          description: string
          due_day: number
          id: string
          macrobloco: string
          notes: string | null
          payment_method: string | null
          supplier: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          branch: string
          category: string
          company: string
          cost_center: string
          created_at?: string
          description: string
          due_day?: number
          id?: string
          macrobloco?: string
          notes?: string | null
          payment_method?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          branch?: string
          category?: string
          company?: string
          cost_center?: string
          created_at?: string
          description?: string
          due_day?: number
          id?: string
          macrobloco?: string
          notes?: string | null
          payment_method?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          date: string
          floor: string | null
          id: string
          notes: string | null
          product_id: string
          product_name: string
          quantity: number
          responsible: string | null
          type: string
          unit: string
          unit_of_measure: string | null
          user: string
        }
        Insert: {
          created_at?: string
          date?: string
          floor?: string | null
          id?: string
          notes?: string | null
          product_id: string
          product_name: string
          quantity: number
          responsible?: string | null
          type: string
          unit?: string
          unit_of_measure?: string | null
          user?: string
        }
        Update: {
          created_at?: string
          date?: string
          floor?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          responsible?: string | null
          type?: string
          unit?: string
          unit_of_measure?: string | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          cnpj_cpf: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          payment_method: string | null
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cnpj_cpf?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          payment_method?: string | null
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cnpj_cpf?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          payment_method?: string | null
          pix_key?: string | null
          updated_at?: string
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

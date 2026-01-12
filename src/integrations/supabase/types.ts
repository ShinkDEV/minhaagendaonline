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
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          content: string
          created_at: string
          created_by: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          type?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      appointment_logs: {
        Row: {
          action: string
          appointment_id: string
          changes: Json | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          appointment_id: string
          changes?: Json | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          appointment_id?: string
          changes?: Json | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          price_charged: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          price_charged: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          price_charged?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancelled_reason: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          notes: string | null
          professional_id: string
          salon_id: string
          start_at: string
          status: string
          total_amount: number | null
        }
        Insert: {
          cancelled_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          notes?: string | null
          professional_id: string
          salon_id: string
          start_at: string
          status?: string
          total_amount?: number | null
        }
        Update: {
          cancelled_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          salon_id?: string
          start_at?: string
          status?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          salon_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          salon_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          salon_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_entries: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          occurred_at: string
          related_appointment_id: string | null
          salon_id: string
          type: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          related_appointment_id?: string | null
          salon_id: string
          type: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          related_appointment_id?: string | null
          salon_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cashflow_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credit_movements: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          salon_id: string
          type: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          salon_id: string
          type: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          salon_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_credit_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credit_movements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          credit_balance: number
          email: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          rg: string | null
          salon_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          salon_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          admin_fee_amount: number | null
          amount: number
          appointment_id: string
          calculated_at: string
          card_fee_amount: number | null
          created_at: string
          gross_amount: number | null
          id: string
          paid_at: string | null
          payment_method: string | null
          professional_id: string
          salon_id: string
          status: string
        }
        Insert: {
          admin_fee_amount?: number | null
          amount: number
          appointment_id: string
          calculated_at?: string
          card_fee_amount?: number | null
          created_at?: string
          gross_amount?: number | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          professional_id: string
          salon_id: string
          status?: string
        }
        Update: {
          admin_fee_amount?: number | null
          amount?: number
          appointment_id?: string
          calculated_at?: string
          card_fee_amount?: number | null
          created_at?: string
          gross_amount?: number | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          professional_id?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      free_trial_users: {
        Row: {
          activated_at: string | null
          cancelled_at: string | null
          created_at: string
          email: string
          id: string
          invite_link_id: string | null
          invited_by: string | null
          notes: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          email: string
          id?: string
          invite_link_id?: string | null
          invited_by?: string | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_link_id?: string | null
          invited_by?: string | null
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_trial_users_invite_link_id_fkey"
            columns: ["invite_link_id"]
            isOneToOne: false
            referencedRelation: "trial_invite_links"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          salon_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          salon_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          salon_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          id: string
          method: string
          paid_at: string
          salon_id: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          id?: string
          method: string
          paid_at?: string
          salon_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          id?: string
          method?: string
          paid_at?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          id: string
          max_professionals: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          max_professionals: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          max_professionals?: number
          name?: string
        }
        Relationships: []
      }
      product_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          related_appointment_id: string | null
          salon_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          related_appointment_id?: string | null
          salon_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          related_appointment_id?: string | null
          salon_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_movements_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_movements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          min_quantity: number | null
          name: string
          price: number
          quantity: number
          salon_id: string
          sku: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          price?: number
          quantity?: number
          salon_id: string
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          price?: number
          quantity?: number
          salon_id?: string
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_service_commissions: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          salon_id: string
          service_id: string
          type: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          salon_id: string
          service_id: string
          type: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          salon_id?: string
          service_id?: string
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          can_delete_appointments: boolean
          commission_percent_default: number | null
          cpf: string | null
          created_at: string
          display_name: string
          id: string
          legal_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          position: string | null
          profile_id: string | null
          salon_id: string
        }
        Insert: {
          active?: boolean
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          can_delete_appointments?: boolean
          commission_percent_default?: number | null
          cpf?: string | null
          created_at?: string
          display_name: string
          id?: string
          legal_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          position?: string | null
          profile_id?: string | null
          salon_id: string
        }
        Update: {
          active?: boolean
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          can_delete_appointments?: boolean
          commission_percent_default?: number | null
          cpf?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legal_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          position?: string | null
          profile_id?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          phone: string | null
          salon_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          salon_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_plan: {
        Row: {
          plan_id: string
          salon_id: string
          started_at: string
        }
        Insert: {
          plan_id: string
          salon_id: string
          started_at?: string
        }
        Update: {
          plan_id?: string
          salon_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_plan_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          admin_fee_percent: number
          card_fee_percent: number
          card_fees_by_installment: Json
          created_at: string
          id: string
          name: string
          phone: string | null
          timezone: string | null
        }
        Insert: {
          address?: string | null
          admin_fee_percent?: number
          card_fee_percent?: number
          card_fees_by_installment?: Json
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          timezone?: string | null
        }
        Update: {
          address?: string | null
          admin_fee_percent?: number
          card_fee_percent?: number
          card_fees_by_installment?: Json
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price: number
          salon_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price?: number
          salon_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          is_recurring: boolean
          notes: string | null
          professional_id: string
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          salon_id: string
          start_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          professional_id: string
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          salon_id: string
          start_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          professional_id?: string
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          salon_id?: string
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_invite_links: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          usage_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          usage_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          end_time: string
          id: string
          professional_id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          end_time: string
          id?: string
          professional_id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          end_time?: string
          id?: string
          professional_id?: string
          salon_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          role: string
          salon_id: string
          salon_name: string
          status: string
        }[]
      }
      get_professionals_with_email: {
        Args: { p_salon_id: string }
        Returns: {
          active: boolean
          commission_percent_default: number
          created_at: string
          display_name: string
          id: string
          profile_id: string
          salon_id: string
          user_email: string
        }[]
      }
      get_user_salon_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_trial_link_usage: {
        Args: { link_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "professional" | "super_admin"
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
      app_role: ["admin", "professional", "super_admin"],
    },
  },
} as const

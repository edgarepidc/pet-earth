export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string | null;
          timezone: string;
          is_active: boolean;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address?: string | null;
          timezone?: string;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      staff_memberships: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          branch_id: string | null;
          role: 'owner' | 'admin' | 'vet' | 'reception';
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          branch_id?: string | null;
          role?: 'owner' | 'admin' | 'vet' | 'reception';
          status?: 'active' | 'inactive';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_memberships']['Insert']>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          full_name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          rfc: string | null;
          tax_zip: string | null;
          uso_cfdi: string;
          fiscal_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          rfc?: string | null;
          tax_zip?: string | null;
          uso_cfdi?: string;
          fiscal_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'patients_client_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['client_id'];
          },
        ];
      };
      patients: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          name: string;
          species: 'dog' | 'cat' | 'other';
          breed: string | null;
          sex: 'male' | 'female' | 'unknown';
          neutered: boolean;
          birth_date: string | null;
          microchip: string | null;
          color: string | null;
          allergies: string | null;
          alerts: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          name: string;
          species?: 'dog' | 'cat' | 'other';
          breed?: string | null;
          sex?: 'male' | 'female' | 'unknown';
          neutered?: boolean;
          birth_date?: string | null;
          microchip?: string | null;
          color?: string | null;
          allergies?: string | null;
          alerts?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'patients_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
      };
      weight_logs: {
        Row: {
          id: string;
          patient_id: string;
          recorded_at: string;
          weight_kg: number;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          recorded_at?: string;
          weight_kg: number;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['weight_logs']['Insert']>;
        Relationships: [];
      };
      catalog_items: {
        Row: {
          id: string;
          organization_id: string;
          kind: 'service' | 'product';
          name: string;
          sku: string | null;
          unit_price: number;
          stock: number | null;
          min_stock: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          kind: 'service' | 'product';
          name: string;
          sku?: string | null;
          unit_price?: number;
          stock?: number | null;
          min_stock?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['catalog_items']['Insert']>;
        Relationships: [];
      };
      clinical_media: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          visit_id: string | null;
          kind: 'photo' | 'study';
          storage_path: string;
          caption: string | null;
          content_type: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          visit_id?: string | null;
          kind?: 'photo' | 'study';
          storage_path: string;
          caption?: string | null;
          content_type?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clinical_media']['Insert']>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          client_id: string;
          patient_id: string;
          vet_id: string | null;
          starts_at: string;
          ends_at: string;
          status:
            | 'scheduled'
            | 'confirmed'
            | 'waiting'
            | 'in_consult'
            | 'completed'
            | 'no_show'
            | 'cancelled';
          reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          client_id: string;
          patient_id: string;
          vet_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?:
            | 'scheduled'
            | 'confirmed'
            | 'waiting'
            | 'in_consult'
            | 'completed'
            | 'no_show'
            | 'cancelled';
          reason?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
        ];
      };
      visits: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          appointment_id: string | null;
          client_id: string;
          patient_id: string;
          vet_id: string | null;
          status: 'in_progress' | 'completed';
          subjective: string | null;
          objective: string | null;
          assessment: string | null;
          plan: string | null;
          weight_kg: number | null;
          temperature_c: number | null;
          heart_rate: number | null;
          respiratory_rate: number | null;
          followup_at: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          appointment_id?: string | null;
          client_id: string;
          patient_id: string;
          vet_id?: string | null;
          status?: 'in_progress' | 'completed';
          subjective?: string | null;
          objective?: string | null;
          assessment?: string | null;
          plan?: string | null;
          weight_kg?: number | null;
          temperature_c?: number | null;
          heart_rate?: number | null;
          respiratory_rate?: number | null;
          followup_at?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['visits']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'visits_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visits_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visit_lines_visit_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'visit_lines';
            referencedColumns: ['visit_id'];
          },
          {
            foreignKeyName: 'vaccine_records_visit_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'vaccine_records';
            referencedColumns: ['visit_id'];
          },
        ];
      };
      visit_lines: {
        Row: {
          id: string;
          visit_id: string;
          catalog_item_id: string | null;
          kind: 'service' | 'product';
          description: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          catalog_item_id?: string | null;
          kind: 'service' | 'product';
          description: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['visit_lines']['Insert']>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          client_id: string;
          visit_id: string | null;
          status: 'estimate' | 'open' | 'paid' | 'cancelled';
          services_total: number;
          products_total: number;
          total: number;
          cfdi_status: 'none' | 'requested' | 'stamped' | 'error';
          cfdi_uuid: string | null;
          receptor_rfc: string | null;
          receptor_name: string | null;
          receptor_zip: string | null;
          uso_cfdi: string | null;
          cfdi_requested_at: string | null;
          cfdi_error: string | null;
          cfdi_stamped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          client_id: string;
          visit_id?: string | null;
          status?: 'estimate' | 'open' | 'paid' | 'cancelled';
          services_total?: number;
          products_total?: number;
          total?: number;
          cfdi_status?: 'none' | 'requested' | 'stamped' | 'error';
          cfdi_uuid?: string | null;
          receptor_rfc?: string | null;
          receptor_name?: string | null;
          receptor_zip?: string | null;
          uso_cfdi?: string | null;
          cfdi_requested_at?: string | null;
          cfdi_error?: string | null;
          cfdi_stamped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'invoice_lines_invoice_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'invoice_lines';
            referencedColumns: ['invoice_id'];
          },
        ];
      };
      invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          visit_line_id: string | null;
          kind: 'service' | 'product';
          description: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          visit_line_id?: string | null;
          kind: 'service' | 'product';
          description: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoice_lines']['Insert']>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          method: 'cash' | 'card' | 'transfer';
          amount: number;
          paid_at: string;
          received_by: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          method?: 'cash' | 'card' | 'transfer';
          amount: number;
          paid_at?: string;
          received_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
        Relationships: [];
      };
      vaccine_records: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          visit_id: string | null;
          catalog_item_id: string | null;
          name: string;
          lot: string | null;
          applied_on: string;
          next_due: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          visit_id?: string | null;
          catalog_item_id?: string | null;
          name: string;
          lot?: string | null;
          applied_on?: string;
          next_due?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vaccine_records']['Insert']>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          patient_id: string;
          appointment_id: string | null;
          kind: 'appointment' | 'vaccine' | 'followup' | 'deworming';
          title: string;
          due_on: string;
          status: 'pending' | 'done' | 'cancelled';
          last_emailed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          patient_id: string;
          appointment_id?: string | null;
          kind: 'appointment' | 'vaccine' | 'followup' | 'deworming';
          title: string;
          due_on: string;
          status?: 'pending' | 'done' | 'cancelled';
          last_emailed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'reminders_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reminders_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      pe_check_in_appointment: {
        Args: { p_appointment_id: string };
        Returns: Database['public']['Tables']['appointments']['Row'];
      };
      pe_start_visit: {
        Args: { p_appointment_id: string };
        Returns: string;
      };
      pe_add_visit_line: {
        Args: {
          p_visit_id: string;
          p_catalog_item_id: string | null;
          p_quantity: number;
          p_unit_price: number | null;
          p_description: string | null;
        };
        Returns: string;
      };
      pe_apply_vaccine: {
        Args: {
          p_visit_id: string;
          p_catalog_item_id: string | null;
          p_name: string | null;
          p_lot: string | null;
          p_next_due: string | null;
          p_notes: string | null;
        };
        Returns: string;
      };
      pe_complete_visit: {
        Args: {
          p_visit_id: string;
          p_subjective: string | null;
          p_objective: string | null;
          p_assessment: string | null;
          p_plan: string | null;
          p_weight_kg: number | null;
          p_temperature_c: number | null;
          p_heart_rate: number | null;
          p_respiratory_rate: number | null;
          p_followup_on: string | null;
        };
        Returns: Database['public']['Tables']['visits']['Row'];
      };
      pe_pay_invoice: {
        Args: {
          p_invoice_id: string;
          p_method: 'cash' | 'card' | 'transfer';
          p_amount: number | null;
        };
        Returns: Database['public']['Tables']['invoices']['Row'];
      };
    };
    Enums: {
      staff_role: 'owner' | 'admin' | 'vet' | 'reception';
      species: 'dog' | 'cat' | 'other';
      sex: 'male' | 'female' | 'unknown';
      appointment_status:
        | 'scheduled'
        | 'confirmed'
        | 'waiting'
        | 'in_consult'
        | 'completed'
        | 'no_show'
        | 'cancelled';
      visit_status: 'in_progress' | 'completed';
      catalog_kind: 'service' | 'product';
      invoice_status: 'estimate' | 'open' | 'paid' | 'cancelled';
      payment_method: 'cash' | 'card' | 'transfer';
      reminder_kind: 'appointment' | 'vaccine' | 'followup' | 'deworming';
      reminder_status: 'pending' | 'done' | 'cancelled';
    };
    CompositeTypes: Record<string, never>;
  };
}

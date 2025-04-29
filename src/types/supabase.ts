export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: string | null
          created_at: string | null
        }
        Insert: {
          group_id: string
          user_id: string
          role?: string | null
          created_at?: string | null
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: string | null
          created_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string | null
          description: string
          amount: number
          paid_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          group_id?: string | null
          description: string
          amount: number
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string | null
          description?: string
          amount?: number
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expense_participants: {
        Row: {
          expense_id: string
          user_id: string
          share_amount: number
          created_at: string | null
        }
        Insert: {
          expense_id: string
          user_id: string
          share_amount: number
          created_at?: string | null
        }
        Update: {
          expense_id?: string
          user_id?: string
          share_amount?: number
          created_at?: string | null
        }
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
  }
}
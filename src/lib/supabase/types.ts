// Hand-written types mirroring supabase/schema.sql.
// If you change the schema, run `supabase gen types typescript` against
// your project and replace this file for full accuracy.

export type OrderStatus = "Pending" | "Ready" | "Done";

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
  topper?: string;
}

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          id: string;
          name: string;
          price: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          fee: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fee: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["delivery_zones"]["Insert"]
        >;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          customer_name: string;
          contact: string;
          batch_date: string;
          items: OrderItem[];
          zone_id: string | null;
          delivery_fee: number;
          items_total: number;
          grand_total: number;
          paid: boolean;
          status: OrderStatus;
          notes: string | null;
          greeting_card: string | null;
          delivery_name: string | null;
          delivery_phone: string | null;
          delivery_address: string | null;
          pickup_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          contact: string;
          batch_date: string;
          items: OrderItem[];
          zone_id?: string | null;
          delivery_fee?: number;
          items_total: number;
          grand_total: number;
          paid?: boolean;
          status?: OrderStatus;
          notes?: string | null;
          greeting_card?: string | null;
          delivery_name?: string | null;
          delivery_phone?: string | null;
          delivery_address?: string | null;
          pickup_time?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_zone_id_fkey";
            columns: ["zone_id"];
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          }
        ];
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          unit: string;
          cost_per_unit: number;
          stock: number;
          reorder_threshold: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          cost_per_unit?: number;
          stock?: number;
          reorder_threshold?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ingredients"]["Insert"]
        >;
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          menu_item_id: string;
          ingredient_id: string;
          qty_per_unit: number;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          ingredient_id: string;
          qty_per_unit: number;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey";
            columns: ["menu_item_id"];
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_ingredient_id_fkey";
            columns: ["ingredient_id"];
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          }
        ];
      };
      batch_history: {
        Row: {
          id: string;
          batch_date: string;
          revenue: number;
          ingredient_cost: number;
          other_costs: number;
          other_costs_note: string | null;
          profit: number;
          archived_at: string;
        };
        Insert: {
          id?: string;
          batch_date: string;
          revenue?: number;
          ingredient_cost?: number;
          other_costs?: number;
          other_costs_note?: string | null;
          profit?: number;
          archived_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["batch_history"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      close_batch: {
        Args: {
          p_batch_date: string;
          p_other_costs: number;
          p_other_costs_note: string | null;
        };
        Returns: Database["public"]["Tables"]["batch_history"]["Row"];
      };
    };
  };
}

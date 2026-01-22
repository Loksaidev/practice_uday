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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      board_cads: {
        Row: {
          created_at: string | null
          custom_item: string
          id: string
          original_item: string | null
          player_id: string
          topic_name: string
        }
        Insert: {
          created_at?: string | null
          custom_item: string
          id?: string
          original_item?: string | null
          player_id: string
          topic_name: string
        }
        Update: {
          created_at?: string | null
          custom_item?: string
          id?: string
          original_item?: string | null
          player_id?: string
          topic_name?: string
        }
        Relationships: []
      }
      browser_specs: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          color_depth: number | null
          connection_type: string | null
          cookies_enabled: boolean | null
          cpu_cores: number | null
          created_at: string | null
          device_memory: number | null
          device_pixel_ratio: number | null
          device_type: string | null
          do_not_track: boolean | null
          downlink: number | null
          effective_type: string | null
          id: string
          is_mobile: boolean | null
          is_online: boolean | null
          is_tablet: boolean | null
          language: string | null
          languages: string[] | null
          max_touch_points: number | null
          page_title: string | null
          page_url: string | null
          platform: string | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          timezone: string | null
          timezone_offset: number | null
          user_agent: string | null
          user_id: string | null
          viewport_height: number | null
          viewport_width: number | null
          visitor_id: string
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          color_depth?: number | null
          connection_type?: string | null
          cookies_enabled?: boolean | null
          cpu_cores?: number | null
          created_at?: string | null
          device_memory?: number | null
          device_pixel_ratio?: number | null
          device_type?: string | null
          do_not_track?: boolean | null
          downlink?: number | null
          effective_type?: string | null
          id?: string
          is_mobile?: boolean | null
          is_online?: boolean | null
          is_tablet?: boolean | null
          language?: string | null
          languages?: string[] | null
          max_touch_points?: number | null
          page_title?: string | null
          page_url?: string | null
          platform?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          timezone?: string | null
          timezone_offset?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id: string
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          color_depth?: number | null
          connection_type?: string | null
          cookies_enabled?: boolean | null
          cpu_cores?: number | null
          created_at?: string | null
          device_memory?: number | null
          device_pixel_ratio?: number | null
          device_type?: string | null
          do_not_track?: boolean | null
          downlink?: number | null
          effective_type?: string | null
          id?: string
          is_mobile?: boolean | null
          is_online?: boolean | null
          is_tablet?: boolean | null
          language?: string | null
          languages?: string[] | null
          max_touch_points?: number | null
          page_title?: string | null
          page_url?: string | null
          platform?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          timezone?: string | null
          timezone_offset?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_sales: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          status: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      custom_topic_items: {
        Row: {
          created_at: string
          custom_topic_id: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          custom_topic_id: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          custom_topic_id?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_topic_items_custom_topic_id_fkey"
            columns: ["custom_topic_id"]
            isOneToOne: false
            referencedRelation: "custom_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_topics: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      game_history: {
        Row: {
          created_at: string
          finished_at: string
          host_name: string
          id: string
          join_code: string
          started_at: string
          total_rounds: number
          winner_name: string | null
        }
        Insert: {
          created_at?: string
          finished_at?: string
          host_name: string
          id?: string
          join_code: string
          started_at: string
          total_rounds?: number
          winner_name?: string | null
        }
        Update: {
          created_at?: string
          finished_at?: string
          host_name?: string
          id?: string
          join_code?: string
          started_at?: string
          total_rounds?: number
          winner_name?: string | null
        }
        Relationships: []
      }
      game_rooms: {
        Row: {
          created_at: string | null
          current_round: number | null
          current_vip_id: string | null
          game_phase: string | null
          host_name: string
          id: string
          join_code: string
          organization_id: string | null
          status: string
          total_rounds: number | null
          updated_at: string | null
          vips_completed: number | null
        }
        Insert: {
          created_at?: string | null
          current_round?: number | null
          current_vip_id?: string | null
          game_phase?: string | null
          host_name: string
          id?: string
          join_code?: string
          organization_id?: string | null
          status?: string
          total_rounds?: number | null
          updated_at?: string | null
          vips_completed?: number | null
        }
        Update: {
          created_at?: string | null
          current_round?: number | null
          current_vip_id?: string | null
          game_phase?: string | null
          host_name?: string
          id?: string
          join_code?: string
          organization_id?: string | null
          status?: string
          total_rounds?: number | null
          updated_at?: string | null
          vips_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_current_vip_id_fkey"
            columns: ["current_vip_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_description: string
          product_id: string | null
          product_image: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_description: string
          product_id?: string | null
          product_image: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_description?: string
          product_id?: string | null
          product_image?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          order_number: string
          organization_id: string | null
          payment_status: string
          paypal_order_id: string | null
          paypal_transaction_id: string | null
          phone: string | null
          shipping_address: Json
          shipping_amount: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          order_number: string
          organization_id?: string | null
          payment_status?: string
          paypal_order_id?: string | null
          paypal_transaction_id?: string | null
          phone?: string | null
          shipping_address: Json
          shipping_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          organization_id?: string | null
          payment_status?: string
          paypal_order_id?: string | null
          paypal_transaction_id?: string | null
          phone?: string | null
          shipping_address?: Json
          shipping_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_store_items: {
        Row: {
          category: string
          created_at: string
          description: string
          featured: boolean | null
          id: string
          image_url: string
          name: string
          organization_id: string
          price: number
          rating: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          featured?: boolean | null
          id?: string
          image_url: string
          name: string
          organization_id: string
          price: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          id?: string
          image_url?: string
          name?: string
          organization_id?: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_store_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_translations: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          locale: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          locale: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          locale?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_translations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          background_image_url: string | null
          created_at: string
          created_by: string | null
          custom_content: string | null
          default_locale: string | null
          description: string | null
          enable_popup: boolean | null
          enabled_locales: string[] | null
          font_family: string | null
          id: string
          logo_url: string | null
          name: string
          popup_description: string | null
          primary_color: string | null
          require_login: boolean | null
          secondary_color: string | null
          slug: string
          status: string | null
          updated_at: string
          use_knowsy_topics: boolean | null
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_content?: string | null
          default_locale?: string | null
          description?: string | null
          enable_popup?: boolean | null
          enabled_locales?: string[] | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          name: string
          popup_description?: string | null
          primary_color?: string | null
          require_login?: boolean | null
          secondary_color?: string | null
          slug: string
          status?: string | null
          updated_at?: string
          use_knowsy_topics?: boolean | null
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_content?: string | null
          default_locale?: string | null
          description?: string | null
          enable_popup?: boolean | null
          enabled_locales?: string[] | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          popup_description?: string | null
          primary_color?: string | null
          require_login?: boolean | null
          secondary_color?: string | null
          slug?: string
          status?: string | null
          updated_at?: string
          use_knowsy_topics?: boolean | null
        }
        Relationships: []
      }
      player_guesses: {
        Row: {
          created_at: string | null
          guessed_order: Json
          id: string
          player_id: string
          room_id: string
          round: number
          score: number | null
          vip_player_id: string
        }
        Insert: {
          created_at?: string | null
          guessed_order: Json
          id?: string
          player_id: string
          room_id: string
          round?: number
          score?: number | null
          vip_player_id: string
        }
        Update: {
          created_at?: string | null
          guessed_order?: Json
          id?: string
          player_id?: string
          room_id?: string
          round?: number
          score?: number | null
          vip_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_guesses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_guesses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_guesses_vip_player_id_fkey"
            columns: ["vip_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_selections: {
        Row: {
          created_at: string | null
          id: string
          ordered_items: Json
          player_id: string
          room_id: string
          round: number
          topic_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordered_items: Json
          player_id: string
          room_id: string
          round?: number
          topic_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ordered_items?: Json
          player_id?: string
          room_id?: string
          round?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_selections_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_selections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          is_ai: boolean | null
          is_host: boolean | null
          joined_at: string | null
          left_at: string | null
          name: string
          organization_id: string | null
          room_id: string
          score: number | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_ai?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          name: string
          organization_id?: string | null
          room_id: string
          score?: number | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_ai?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          name?: string
          organization_id?: string | null
          room_id?: string
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          cost_inr: number
          country_code: string
          created_at: string
          id: string
          max_weight_kg: number
          min_weight_kg: number
        }
        Insert: {
          cost_inr: number
          country_code: string
          created_at?: string
          id?: string
          max_weight_kg: number
          min_weight_kg: number
        }
        Update: {
          cost_inr?: number
          country_code?: string
          created_at?: string
          id?: string
          max_weight_kg?: number
          min_weight_kg?: number
        }
        Relationships: []
      }
      store_items: {
        Row: {
          category: string
          created_at: string
          description: string
          featured: boolean | null
          id: string
          image_url: string
          name: string
          price: number
          rating: number | null
          stock: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          featured?: boolean | null
          id?: string
          image_url: string
          name: string
          price: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          id?: string
          image_url?: string
          name?: string
          price?: number
          rating?: number | null
          stock?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      topic_items: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          topic_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          topic_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      browser_specs_analytics: {
        Row: {
          anonymous_sessions: number | null
          browser_name: string | null
          date: string | null
          device_type: string | null
          logged_in_users: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      player_selections_analytics: {
        Row: {
          created_at: string | null
          host_name: string | null
          id: string | null
          is_auth_player: boolean | null
          is_custom_topic: boolean | null
          join_code: string | null
          ordered_items: Json | null
          organization_id: string | null
          player_id: string | null
          player_name: string | null
          room_id: string | null
          room_status: string | null
          round: number | null
          topic_category: string | null
          topic_id: string | null
          topic_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_selections_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_selections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      end_game_early: { Args: { p_room_id: string }; Returns: undefined }
      generate_join_code: { Args: never; Returns: string }
      get_all_player_selections_analytics: {
        Args: {
          _end_date?: string
          _limit?: number
          _offset?: number
          _org_id?: string
          _start_date?: string
        }
        Returns: {
          created_at: string | null
          host_name: string | null
          id: string | null
          is_auth_player: boolean | null
          is_custom_topic: boolean | null
          join_code: string | null
          ordered_items: Json | null
          organization_id: string | null
          player_id: string | null
          player_name: string | null
          room_id: string | null
          room_status: string | null
          round: number | null
          topic_category: string | null
          topic_id: string | null
          topic_name: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "player_selections_analytics"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_org_player_selections_analytics: {
        Args: { _org_id: string }
        Returns: {
          created_at: string | null
          host_name: string | null
          id: string | null
          is_auth_player: boolean | null
          is_custom_topic: boolean | null
          join_code: string | null
          ordered_items: Json | null
          organization_id: string | null
          player_id: string | null
          player_name: string | null
          room_id: string | null
          room_status: string | null
          round: number | null
          topic_category: string | null
          topic_id: string | null
          topic_name: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "player_selections_analytics"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_in_room: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      kick_inactive_player: {
        Args: { p_player_id: string; p_room_id: string }
        Returns: number
      }
      reassign_host: {
        Args: { p_leaving_player_id: string; p_room_id: string }
        Returns: {
          new_host_id: string
          new_host_name: string
        }[]
      }
      refresh_player_selections_analytics: { Args: never; Returns: undefined }
      validate_join_code: {
        Args: { _join_code: string }
        Returns: Record<string, unknown>
      }
    }
    Enums: {
      app_role: "super_admin" | "org_admin" | "player"
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
      app_role: ["super_admin", "org_admin", "player"],
    },
  },
} as const

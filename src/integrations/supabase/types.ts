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
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link_href: string | null
          message: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_href?: string | null
          message: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_href?: string | null
          message?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      artist_profiles: {
        Row: {
          bio: string | null
          booking_info: string | null
          created_at: string
          gallery_images: string[] | null
          id: string
          instagram: string | null
          interview: Json | null
          location: string | null
          long_bio: string | null
          name: string
          portrait_url: string | null
          slug: string
          specialty: string | null
          stored_portrait_url: string | null
          studio: string | null
          styles: string[] | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          booking_info?: string | null
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          instagram?: string | null
          interview?: Json | null
          location?: string | null
          long_bio?: string | null
          name: string
          portrait_url?: string | null
          slug: string
          specialty?: string | null
          stored_portrait_url?: string | null
          studio?: string | null
          styles?: string[] | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          booking_info?: string | null
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          instagram?: string | null
          interview?: Json | null
          location?: string | null
          long_bio?: string | null
          name?: string
          portrait_url?: string | null
          slug?: string
          specialty?: string | null
          stored_portrait_url?: string | null
          studio?: string | null
          styles?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      artist_stories: {
        Row: {
          created_at: string
          id: string
          name: string
          scraped_at: string
          sections: Json
          slug: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scraped_at?: string
          sections?: Json
          slug: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scraped_at?: string
          sections?: Json
          slug?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      back_in_stock_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean
          product_handle: string
          product_title: string
          variant_id: string
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean
          product_handle: string
          product_title: string
          variant_id: string
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean
          product_handle?: string
          product_title?: string
          variant_id?: string
          variant_title?: string | null
        }
        Relationships: []
      }
      bundle_configs: {
        Row: {
          bundle_tag: string
          collection_handle: string
          created_at: string
          discount_type: string
          fixed_amount: number | null
          id: string
          is_active: boolean
          label: string
          min_qty: number
          updated_at: string
        }
        Insert: {
          bundle_tag: string
          collection_handle: string
          created_at?: string
          discount_type?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          label: string
          min_qty?: number
          updated_at?: string
        }
        Update: {
          bundle_tag?: string
          collection_handle?: string
          created_at?: string
          discount_type?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          label?: string
          min_qty?: number
          updated_at?: string
        }
        Relationships: []
      }
      capsule_drops: {
        Row: {
          collection_handle: string
          created_at: string
          drop_date: string
          id: string
          is_active: boolean
          slug: string
          subtitle: string | null
          teaser_label: string | null
          title: string
          updated_at: string
          vault_early_access: boolean
        }
        Insert: {
          collection_handle: string
          created_at?: string
          drop_date: string
          id?: string
          is_active?: boolean
          slug: string
          subtitle?: string | null
          teaser_label?: string | null
          title: string
          updated_at?: string
          vault_early_access?: boolean
        }
        Update: {
          collection_handle?: string
          created_at?: string
          drop_date?: string
          id?: string
          is_active?: boolean
          slug?: string
          subtitle?: string | null
          teaser_label?: string | null
          title?: string
          updated_at?: string
          vault_early_access?: boolean
        }
        Relationships: []
      }
      cart_incentives: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          label: string
          position: number
          threshold: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          threshold?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          threshold?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          active_count: number
          created_at: string
          deleted_count: number
          error: string | null
          function_name: string
          id: string
        }
        Insert: {
          active_count?: number
          created_at?: string
          deleted_count?: number
          error?: string | null
          function_name: string
          id?: string
        }
        Update: {
          active_count?: number
          created_at?: string
          deleted_count?: number
          error?: string | null
          function_name?: string
          id?: string
        }
        Relationships: []
      }
      color_swatches: {
        Row: {
          color_name: string
          created_at: string
          hex_fallback: string | null
          id: string
          image_url: string | null
          is_split: boolean
          split_color_1: string | null
          split_color_2: string | null
          stroke_color: string | null
          updated_at: string
        }
        Insert: {
          color_name: string
          created_at?: string
          hex_fallback?: string | null
          id?: string
          image_url?: string | null
          is_split?: boolean
          split_color_1?: string | null
          split_color_2?: string | null
          stroke_color?: string | null
          updated_at?: string
        }
        Update: {
          color_name?: string
          created_at?: string
          hex_fallback?: string | null
          id?: string
          image_url?: string | null
          is_split?: boolean
          split_color_1?: string | null
          split_color_2?: string | null
          stroke_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_surveys: {
        Row: {
          admin_notes: string | null
          answers: Json
          created_at: string
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          id?: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      drop_notifications: {
        Row: {
          created_at: string
          drop_handle: string
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          drop_handle: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          drop_handle?: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      featured_slides: {
        Row: {
          background_image_url: string | null
          created_at: string
          handle: string
          id: string
          is_active: boolean
          label: string | null
          position: number
          scheduled_from: string | null
          scheduled_until: string | null
          type: string
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          handle: string
          id?: string
          is_active?: boolean
          label?: string | null
          position?: number
          scheduled_from?: string | null
          scheduled_until?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          handle?: string
          id?: string
          is_active?: boolean
          label?: string | null
          position?: number
          scheduled_from?: string | null
          scheduled_until?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      issue_logs: {
        Row: {
          category: string | null
          created_at: string
          customer_email: string | null
          customer_message: string | null
          id: string
          metadata: Json | null
          order_number: string | null
          session_id: string | null
          source: string
          summary: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          customer_email?: string | null
          customer_message?: string | null
          id?: string
          metadata?: Json | null
          order_number?: string | null
          session_id?: string | null
          source?: string
          summary: string
        }
        Update: {
          category?: string | null
          created_at?: string
          customer_email?: string | null
          customer_message?: string | null
          id?: string
          metadata?: Json | null
          order_number?: string | null
          session_id?: string | null
          source?: string
          summary?: string
        }
        Relationships: []
      }
      issue_patterns: {
        Row: {
          category: string
          created_at: string
          description: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          notified_at: string | null
          occurrence_count: number
          resolution_notes: string | null
          status: string
          threshold_notified: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          notified_at?: string | null
          occurrence_count?: number
          resolution_notes?: string | null
          status?: string
          threshold_notified?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          notified_at?: string | null
          occurrence_count?: number
          resolution_notes?: string | null
          status?: string
          threshold_notified?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_href: string | null
          mobile_image_url: string | null
          mobile_video_url: string | null
          position: number
          scheduled_from: string | null
          scheduled_until: string | null
          slot: Database["public"]["Enums"]["marketing_image_slot"]
          subtitle: string | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_href?: string | null
          mobile_image_url?: string | null
          mobile_video_url?: string | null
          position?: number
          scheduled_from?: string | null
          scheduled_until?: string | null
          slot: Database["public"]["Enums"]["marketing_image_slot"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_href?: string | null
          mobile_image_url?: string | null
          mobile_video_url?: string | null
          position?: number
          scheduled_from?: string | null
          scheduled_until?: string | null
          slot?: Database["public"]["Enums"]["marketing_image_slot"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      okendo_migration: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          corrected_balance: number
          created_at: string
          email: string
          id: string
          points_spent: number
          tier: string
          total_order_value: number
          total_orders: number
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          corrected_balance?: number
          created_at?: string
          email: string
          id?: string
          points_spent?: number
          tier?: string
          total_order_value?: number
          total_orders?: number
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          corrected_balance?: number
          created_at?: string
          email?: string
          id?: string
          points_spent?: number
          tier?: string
          total_order_value?: number
          total_orders?: number
        }
        Relationships: []
      }
      order_history: {
        Row: {
          created_at: string
          currency: string
          email: string
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          line_items: Json
          order_date: string
          order_id: string
          order_name: string
          shipping_address: Json | null
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          email: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          line_items?: Json
          order_date?: string
          order_id: string
          order_name: string
          shipping_address?: Json | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          line_items?: Json
          order_date?: string
          order_id?: string
          order_name?: string
          shipping_address?: Json | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_tracking: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          email: string
          estimated_delivery: string | null
          id: string
          last_shopify_sync: string | null
          order_id: string
          order_name: string
          shipped_at: string | null
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          estimated_delivery?: string | null
          id?: string
          last_shopify_sync?: string | null
          order_id: string
          order_name: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          estimated_delivery?: string | null
          id?: string
          last_shopify_sync?: string | null
          order_id?: string
          order_name?: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_tracking_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          occurred_at: string
          order_tracking_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          order_tracking_id: string
          status: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          occurred_at?: string
          order_tracking_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_events_order_tracking_id_fkey"
            columns: ["order_tracking_id"]
            isOneToOne: false
            referencedRelation: "order_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      product_qanda: {
        Row: {
          answer_body: string | null
          answer_created_at: string | null
          answer_is_published: boolean | null
          answerer_name: string | null
          created_at: string
          id: string
          product_id: string
          question_body: string
          question_created_at: string
          questioner_email: string | null
          questioner_name: string
        }
        Insert: {
          answer_body?: string | null
          answer_created_at?: string | null
          answer_is_published?: boolean | null
          answerer_name?: string | null
          created_at?: string
          id?: string
          product_id: string
          question_body: string
          question_created_at?: string
          questioner_email?: string | null
          questioner_name?: string
        }
        Update: {
          answer_body?: string | null
          answer_created_at?: string | null
          answer_is_published?: boolean | null
          answerer_name?: string | null
          created_at?: string
          id?: string
          product_id?: string
          question_body?: string
          question_created_at?: string
          questioner_email?: string | null
          questioner_name?: string
        }
        Relationships: []
      }
      product_videos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          position: number
          poster_url: string | null
          product_handle: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          poster_url?: string | null
          product_handle: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          poster_url?: string | null
          product_handle?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birthday: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          key: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      return_items: {
        Row: {
          created_at: string
          exchange_product_handle: string | null
          exchange_variant_id: string | null
          exchange_variant_title: string | null
          id: string
          line_item_image: string | null
          line_item_price: number
          line_item_title: string
          line_item_variant: string | null
          quantity: number
          resolution: Database["public"]["Enums"]["return_resolution"]
          return_request_id: string
        }
        Insert: {
          created_at?: string
          exchange_product_handle?: string | null
          exchange_variant_id?: string | null
          exchange_variant_title?: string | null
          id?: string
          line_item_image?: string | null
          line_item_price?: number
          line_item_title: string
          line_item_variant?: string | null
          quantity?: number
          resolution?: Database["public"]["Enums"]["return_resolution"]
          return_request_id: string
        }
        Update: {
          created_at?: string
          exchange_product_handle?: string | null
          exchange_variant_id?: string | null
          exchange_variant_title?: string | null
          id?: string
          line_item_image?: string | null
          line_item_price?: number
          line_item_title?: string
          line_item_variant?: string | null
          quantity?: number
          resolution?: Database["public"]["Enums"]["return_resolution"]
          return_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          fraud_flags: string[]
          fraud_score: number
          id: string
          order_email: string
          order_id: string
          order_name: string
          reason: string | null
          return_label_url: string | null
          shopify_return_id: string | null
          status: Database["public"]["Enums"]["return_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          fraud_flags?: string[]
          fraud_score?: number
          id?: string
          order_email: string
          order_id: string
          order_name: string
          reason?: string | null
          return_label_url?: string | null
          shopify_return_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          fraud_flags?: string[]
          fraud_score?: number
          id?: string
          order_email?: string
          order_id?: string
          order_name?: string
          reason?: string | null
          return_label_url?: string | null
          shopify_return_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_request_tokens: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_name: string
          email: string
          id: string
          line_items: Json
          order_id: string
          order_name: string
          send_after: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          email: string
          id?: string
          line_items?: Json
          order_id: string
          order_name: string
          send_after?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          email?: string
          id?: string
          line_items?: Json
          order_id?: string
          order_name?: string
          send_after?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      review_summaries: {
        Row: {
          avg_rating: number
          created_at: string
          group_key: string
          id: string
          review_count: number
          summary: string
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          created_at?: string
          group_key: string
          id?: string
          review_count?: number
          summary: string
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          created_at?: string
          group_key?: string
          id?: string
          review_count?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_notes: string | null
          body: string
          created_at: string
          id: string
          media_urls: string[] | null
          metadata: Json | null
          product_handle: string
          product_image: string | null
          product_title: string
          rating: number
          review_group: string | null
          reviewer_email: string
          reviewer_name: string
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string | null
          verified_purchase: boolean
        }
        Insert: {
          admin_notes?: string | null
          body: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          product_handle: string
          product_image?: string | null
          product_title: string
          rating: number
          review_group?: string | null
          reviewer_email: string
          reviewer_name: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Update: {
          admin_notes?: string | null
          body?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          product_handle?: string
          product_image?: string | null
          product_title?: string
          rating?: number
          review_group?: string | null
          reviewer_email?: string
          reviewer_name?: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          discount_amount: number
          discount_code: string
          id: string
          points_spent: number
          transaction_id: string | null
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount: number
          discount_code: string
          id?: string
          points_spent: number
          transaction_id?: string | null
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_code?: string
          id?: string
          points_spent?: number
          transaction_id?: string | null
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "reward_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_tiers: {
        Row: {
          annual_threshold: number | null
          color_hex: string | null
          created_at: string
          early_access_hours: number | null
          earn_rate: number
          free_shipping_minimum: number | null
          icon: string
          id: string
          min_lifetime_spend: number
          name: string
          perks: string[] | null
          position: number
          pts_per_dollar: number | null
          slug: string | null
        }
        Insert: {
          annual_threshold?: number | null
          color_hex?: string | null
          created_at?: string
          early_access_hours?: number | null
          earn_rate?: number
          free_shipping_minimum?: number | null
          icon?: string
          id?: string
          min_lifetime_spend?: number
          name: string
          perks?: string[] | null
          position?: number
          pts_per_dollar?: number | null
          slug?: string | null
        }
        Update: {
          annual_threshold?: number | null
          color_hex?: string | null
          created_at?: string
          early_access_hours?: number | null
          earn_rate?: number
          free_shipping_minimum?: number | null
          icon?: string
          id?: string
          min_lifetime_spend?: number
          name?: string
          perks?: string[] | null
          position?: number
          pts_per_dollar?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          multiplier: number | null
          points: number
          reference_id: string | null
          source: string | null
          type: Database["public"]["Enums"]["reward_transaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          multiplier?: number | null
          points: number
          reference_id?: string | null
          source?: string | null
          type: Database["public"]["Enums"]["reward_transaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          multiplier?: number | null
          points?: number
          reference_id?: string | null
          source?: string | null
          type?: Database["public"]["Enums"]["reward_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          role: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          role: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          role?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      site_themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      unboxing_campaigns: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          reward_discount_amount: number | null
          reward_discount_codes: string[] | null
          reward_points_max: number | null
          reward_points_min: number | null
          reward_type: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward_discount_amount?: number | null
          reward_discount_codes?: string[] | null
          reward_points_max?: number | null
          reward_points_min?: number | null
          reward_type?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward_discount_amount?: number | null
          reward_discount_codes?: string[] | null
          reward_points_max?: number | null
          reward_points_min?: number | null
          reward_type?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      unboxing_claims: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          order_id: string | null
          reward_type: string
          reward_value: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          reward_type: string
          reward_value: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          reward_type?: string
          reward_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unboxing_claims_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "unboxing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      uptime_checks: {
        Row: {
          alert_sent: boolean
          checked_at: string
          error_message: string | null
          id: string
          is_up: boolean
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          alert_sent?: boolean
          checked_at?: string
          error_message?: string | null
          id?: string
          is_up?: boolean
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          alert_sent?: boolean
          checked_at?: string
          error_message?: string | null
          id?: string
          is_up?: boolean
          response_time_ms?: number | null
          status_code?: number | null
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
      vault_access_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_tier: string | null
          shopify_tag: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_tier?: string | null
          shopify_tag?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_tier?: string | null
          shopify_tag?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      vault_bonus_events: {
        Row: {
          active: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          min_tier: string | null
          name: string
          points_flat: number | null
          points_multiplier: number | null
          start_date: string | null
          trigger: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          min_tier?: string | null
          name: string
          points_flat?: number | null
          points_multiplier?: number | null
          start_date?: string | null
          trigger: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          min_tier?: string | null
          name?: string
          points_flat?: number | null
          points_multiplier?: number | null
          start_date?: string | null
          trigger?: string
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          collection_handle: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          position: number
          section: string
        }
        Insert: {
          collection_handle: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          position?: number
          section?: string
        }
        Update: {
          collection_handle?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          position?: number
          section?: string
        }
        Relationships: []
      }
      vault_members: {
        Row: {
          annual_spend: number | null
          annual_spend_year: number | null
          created_at: string | null
          current_tier: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          lifetime_spend: number | null
          points_frozen: boolean | null
          points_last_active: string | null
          shopify_customer_id: string | null
          tier_locked_until: string | null
          updated_at: string | null
          user_id: string | null
          welcome_bonus_claimed: boolean | null
        }
        Insert: {
          annual_spend?: number | null
          annual_spend_year?: number | null
          created_at?: string | null
          current_tier?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lifetime_spend?: number | null
          points_frozen?: boolean | null
          points_last_active?: string | null
          shopify_customer_id?: string | null
          tier_locked_until?: string | null
          updated_at?: string | null
          user_id?: string | null
          welcome_bonus_claimed?: boolean | null
        }
        Update: {
          annual_spend?: number | null
          annual_spend_year?: number | null
          created_at?: string | null
          current_tier?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lifetime_spend?: number | null
          points_frozen?: boolean | null
          points_last_active?: string | null
          shopify_customer_id?: string | null
          tier_locked_until?: string | null
          updated_at?: string | null
          user_id?: string | null
          welcome_bonus_claimed?: boolean | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          currency_code: string | null
          id: string
          product_handle: string
          product_image: string | null
          product_price: string | null
          product_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency_code?: string | null
          id?: string
          product_handle: string
          product_image?: string | null
          product_price?: string | null
          product_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency_code?: string | null
          id?: string
          product_handle?: string
          product_image?: string | null
          product_price?: string | null
          product_title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_qanda_public: {
        Row: {
          answer_body: string | null
          answer_created_at: string | null
          answer_is_published: boolean | null
          answerer_name: string | null
          created_at: string | null
          id: string | null
          product_id: string | null
          question_body: string | null
          question_created_at: string | null
          questioner_name: string | null
        }
        Insert: {
          answer_body?: string | null
          answer_created_at?: string | null
          answer_is_published?: boolean | null
          answerer_name?: string | null
          created_at?: string | null
          id?: string | null
          product_id?: string | null
          question_body?: string | null
          question_created_at?: string | null
          questioner_name?: string | null
        }
        Update: {
          answer_body?: string | null
          answer_created_at?: string | null
          answer_is_published?: boolean | null
          answerer_name?: string | null
          created_at?: string | null
          id?: string | null
          product_id?: string | null
          question_body?: string | null
          question_created_at?: string | null
          questioner_name?: string | null
        }
        Relationships: []
      }
      reviews_public: {
        Row: {
          body: string | null
          created_at: string | null
          id: string | null
          media_urls: string[] | null
          metadata: Json | null
          product_handle: string | null
          product_image: string | null
          product_title: string | null
          rating: number | null
          review_group: string | null
          reviewer_name: string | null
          status: Database["public"]["Enums"]["review_status"] | null
          title: string | null
          updated_at: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          product_handle?: string | null
          product_image?: string | null
          product_title?: string | null
          rating?: number | null
          review_group?: string | null
          reviewer_name?: string | null
          status?: Database["public"]["Enums"]["review_status"] | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          product_handle?: string | null
          product_image?: string | null
          product_title?: string | null
          rating?: number | null
          review_group?: string | null
          reviewer_name?: string | null
          status?: Database["public"]["Enums"]["review_status"] | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_vault_tier: { Args: { p_member_id: string }; Returns: string }
      atomic_redeem_points: {
        Args: {
          p_description: string
          p_points: number
          p_reference_id: string
          p_user_id: string
        }
        Returns: string
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      claim_okendo_points: {
        Args: { p_email: string; p_user_id: string }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_vault_member: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      get_okendo_migration_stats: { Args: never; Returns: Json }
      get_review_aggregate: {
        Args: { p_product_handle?: string }
        Returns: Json
      }
      get_user_lifetime_points: { Args: { p_user_id: string }; Returns: number }
      get_user_points_balance: { Args: { p_user_id: string }; Returns: number }
      grant_signup_bonus: { Args: { p_user_id: string }; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      submit_survey_with_points: {
        Args: { p_answers: Json; p_points: number; p_user_id: string }
        Returns: boolean
      }
      vault_annual_reset: { Args: never; Returns: number }
      vault_earn_points: {
        Args: {
          p_member_id: string
          p_order_total: number
          p_source_reference?: string
        }
        Returns: number
      }
      vault_reverse_cancelled_spend: {
        Args: { p_amount: number; p_email: string }
        Returns: undefined
      }
      verify_vault_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user" | "artist_manager" | "customer_service"
      marketing_image_slot:
        | "hero_slider"
        | "collection_row"
        | "featured_product"
        | "category_link"
        | "mega_menu_featured"
        | "cart_banner"
      return_resolution: "exchange" | "store_credit" | "refund"
      return_status:
        | "pending"
        | "approved"
        | "rejected"
        | "shipped"
        | "received"
        | "completed"
        | "cancelled"
      review_status: "pending" | "approved" | "rejected"
      reward_transaction_type:
        | "signup_bonus"
        | "purchase"
        | "review"
        | "referral"
        | "social_follow"
        | "birthday"
        | "redemption"
        | "admin_adjustment"
        | "okendo_import"
        | "collect_the_set"
        | "birthday_multiplier"
        | "survey"
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
      app_role: ["admin", "user", "artist_manager", "customer_service"],
      marketing_image_slot: [
        "hero_slider",
        "collection_row",
        "featured_product",
        "category_link",
        "mega_menu_featured",
        "cart_banner",
      ],
      return_resolution: ["exchange", "store_credit", "refund"],
      return_status: [
        "pending",
        "approved",
        "rejected",
        "shipped",
        "received",
        "completed",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected"],
      reward_transaction_type: [
        "signup_bonus",
        "purchase",
        "review",
        "referral",
        "social_follow",
        "birthday",
        "redemption",
        "admin_adjustment",
        "okendo_import",
        "collect_the_set",
        "birthday_multiplier",
        "survey",
      ],
    },
  },
} as const

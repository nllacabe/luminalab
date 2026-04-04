// This file contains the database types for Supabase.
//
// To generate types from your Supabase project, run:
//   npx supabase gen types typescript --project-id <your-project-id> > lib/supabase/types.ts
//
// Manual type definitions matching supabase-schema.sql

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
                Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
                Relationships: [];
            };
            user_preferences: {
                Row: {
                    id: string;
                    user_id: string;
                    budget_min: number | null;
                    budget_max: number | null;
                    skin_type: "oily" | "dry" | "combination" | "sensitive" | null;
                    product_types: string[];
                    preferred_brands: string[];      // ← was preferred_brand_ids: string[]
                    is_cruelty_free: boolean;
                    is_vegan: boolean;
                    prefers_local: boolean;
                    finish_preferences: string[];
                    occasion: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    budget_min?: number | null;
                    budget_max?: number | null;
                    skin_type?: "oily" | "dry" | "combination" | "sensitive" | null;
                    product_types?: string[];
                    preferred_brands?: string[];     // ← fix here too
                    is_cruelty_free?: boolean;
                    is_vegan?: boolean;
                    prefers_local?: boolean;
                    finish_preferences?: string[];
                    occasion?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>;
                Relationships: [];
            };
            brands: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    origin_country: string | null;
                    is_local: boolean;
                    is_cruelty_free: boolean;
                    is_vegan: boolean;
                    logo_url: string | null;
                    website_url: string | null;
                    created_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & { name: string; slug: string };
                Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
                Relationships: [];
            };
            products: {
                Row: {
                    id: string;
                    brand_id: string;
                    name: string;
                    shade_name: string | null;
                    product_type: "foundation" | "lipstick" | "blush" | "concealer" | "other";
                    finish: "matte" | "dewy" | "satin" | "natural" | "glossy" | "velvet" | "other" | null;
                    lab_l: number | null;
                    lab_a: number | null;
                    lab_b: number | null;
                    rgb_r: number | null;
                    rgb_g: number | null;
                    rgb_b: number | null;
                    hex_color: string | null;
                    price: number | null;
                    currency: string;
                    image_url: string | null;
                    product_url: string | null;
                    is_cruelty_free: boolean;
                    is_vegan: boolean;
                    suitable_for_skin_types: string[];
                    created_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & { brand_id: string; name: string; product_type: string };
                Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
                Relationships: [];
            };
            skin_analyses: {
                Row: {
                    id: string;
                    user_id: string | null;
                    lab_l: number;
                    lab_a: number;
                    lab_b: number;
                    ita_angle: number;
                    skin_tone_category: string;
                    rgb_r: number | null;
                    rgb_g: number | null;
                    rgb_b: number | null;
                    hex_color: string | null;
                    image_path: string | null;
                    region_data: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["skin_analyses"]["Row"]> & {
                    lab_l: number; lab_a: number; lab_b: number; ita_angle: number; skin_tone_category: string;
                };
                Update: Partial<Database["public"]["Tables"]["skin_analyses"]["Row"]>;
                Relationships: [];
            };
            recommendations: {
                Row: {
                    id: string;
                    analysis_id: string;
                    product_id: string;
                    match_type: "delta_e" | "ita_harmony";
                    delta_e_value: number | null;
                    match_score: number | null;
                    match_rank: number | null;
                    created_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["recommendations"]["Row"]> & {
                    analysis_id: string; product_id: string; match_type: string;
                };
                Update: Partial<Database["public"]["Tables"]["recommendations"]["Row"]>;
                Relationships: [];
            };
            saved_recommendations: {
                Row: {
                    id: string;
                    user_id: string;
                    recommendation_id: string;
                    notes: string | null;
                    created_at: string;
                };
                Insert: { id?: string; user_id: string; recommendation_id: string; notes?: string | null; created_at?: string };
                Update: Partial<Database["public"]["Tables"]["saved_recommendations"]["Row"]>;
                Relationships: [];
            };
            custom_products: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    brand_name: string | null;
                    shade_name: string | null;
                    product_type: string;
                    finish: string | null;
                    lab_l: number | null;
                    lab_a: number | null;
                    lab_b: number | null;
                    hex_color: string | null;
                    price: number | null;
                    currency: string;
                    image_url: string | null;
                    notes: string | null;
                    is_owned: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["custom_products"]["Row"]> & { user_id: string; name: string; product_type: string };
                Update: Partial<Database["public"]["Tables"]["custom_products"]["Row"]>;
                Relationships: [];
            };
            user_owned_catalog_products: {
                Row: {
                    id: string;
                    user_id: string;
                    product_id: string;
                    notes: string | null;
                    created_at: string;
                };
                Insert: { id?: string; user_id: string; product_id: string; notes?: string | null; created_at?: string };
                Update: Partial<Database["public"]["Tables"]["user_owned_catalog_products"]["Row"]>;
                Relationships: [];
            };
            reverse_match_results: {
                Row: {
                    id: string;
                    user_id: string;
                    source_owned_catalog_id: string | null;
                    source_custom_product_id: string | null;
                    matched_product_id: string;
                    delta_e_value: number | null;
                    match_score: number | null;
                    match_rank: number | null;
                    created_at: string;
                };
                Insert: Partial<Database["public"]["Tables"]["reverse_match_results"]["Row"]> & { user_id: string; matched_product_id: string };
                Update: Partial<Database["public"]["Tables"]["reverse_match_results"]["Row"]>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
};

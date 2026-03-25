"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface UserPreferences {
    budget_min: number;
    budget_max: number;
    preferred_brands: string[];
    product_types: string[];
    skin_type: string;
    is_cruelty_free: boolean;
    is_vegan: boolean;
    prefers_local: boolean;
    finish_preferences: string[];
    /** Social context for biasing lip/blush colour recommendations. */
    occasion: string;
}

export async function savePreferences(data: UserPreferences) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { error } = await supabase.from("user_preferences").upsert(
        {
            user_id: user.id,
            budget_min: data.budget_min,
            budget_max: data.budget_max,
            preferred_brands: data.preferred_brands,
            product_types: data.product_types,
            skin_type: data.skin_type || null,
            is_cruelty_free: data.is_cruelty_free,
            is_vegan: data.is_vegan,
            prefers_local: data.prefers_local,
            finish_preferences: data.finish_preferences,
            occasion: data.occasion || "everyday",
            updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "user_id" }
    );

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error || !data) return null;
    const row = data as any;

    return {
        budget_min: row.budget_min ?? 0,
        budget_max: row.budget_max ?? 5000,
        preferred_brands: row.preferred_brands ?? [],
        product_types: row.product_types ?? [],
        skin_type: row.skin_type ?? "",
        is_cruelty_free: row.is_cruelty_free ?? false,
        is_vegan: row.is_vegan ?? false,
        prefers_local: row.prefers_local ?? false,
        finish_preferences: row.finish_preferences ?? [],
        occasion: row.occasion ?? "everyday",
    };
}

export async function hasCompletedSurvey(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
        .from("user_preferences")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    return !error && !!data;
}

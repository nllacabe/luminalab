"use server";

import { createClient } from "@/lib/supabase/server";

// ── Types ───────────────────────────────────────────────────────────────────

export interface RecommendationSessionProduct {
    brandName: string;
    productName: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    imageUrl: string;
    scoringMethod: string;
    /** Whether this product is owned by the user. */
    isOwned?: boolean;
}

export interface RecommendationSession {
    id: string;
    labL: number;
    labA: number;
    labB: number;
    occasion: string;
    products: RecommendationSessionProduct[];
    createdAt: string;
    updatedAt: string;
}

// ── Save / upsert recommendation session ────────────────────────────────────

export interface SaveSessionInput {
    labL: number;
    labA: number;
    labB: number;
    occasion: string;
    products: RecommendationSessionProduct[];
}

/**
 * Saves (upserts) the user's latest recommendation session.
 * Since user_id is UNIQUE, this replaces any existing session.
 */
export async function saveRecommendationSession(
    input: SaveSessionInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase as any)
        .from("recommendation_sessions")
        .upsert(
            {
                user_id: user.id,
                lab_l: input.labL,
                lab_a: input.labA,
                lab_b: input.labB,
                occasion: input.occasion,
                products: JSON.stringify(input.products),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

    if (error) {
        console.error("Failed to save recommendation session:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ── Get the latest recommendation session ───────────────────────────────────

/**
 * Fetches the user's most recent (and only) recommendation session.
 */
export async function getRecommendationSession(): Promise<RecommendationSession | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await (supabase as any)
        .from("recommendation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !data) return null;

    // Parse JSONB products — could be string or already object
    let products: RecommendationSessionProduct[] = [];
    try {
        products =
            typeof data.products === "string"
                ? JSON.parse(data.products)
                : data.products ?? [];
    } catch {
        products = [];
    }

    return {
        id: data.id,
        labL: Number(data.lab_l),
        labA: Number(data.lab_a),
        labB: Number(data.lab_b),
        occasion: data.occasion ?? "everyday",
        products,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? data.created_at,
    };
}

// ── Delete the recommendation session ───────────────────────────────────────

/**
 * Deletes the user's recommendation session.
 */
export async function deleteRecommendationSession(): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await (supabase as any)
        .from("recommendation_sessions")
        .delete()
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to delete recommendation session:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

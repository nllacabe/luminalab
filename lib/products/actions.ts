"use server";

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@/lib/supabase/server";
import type {
    UserProduct,
    AddCustomProductInput,
    DuplicateCandidate,
} from "./types";

// ── CSV helpers ─────────────────────────────────────────────────────────────

interface CsvRow {
    brand_name: string;
    product_name: string;
    shade_name: string;
    product_type: string;
    finish: string;
    hex_color: string;
    price: string;
    image_url: string;
    product_url: string;
}

function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                fields.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
}

function loadCsvRows(): CsvRow[] {
    const csvPath = resolve(process.cwd(), "data/products.csv");
    const raw = readFileSync(csvPath, "utf-8");
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const record: Record<string, string> = {};
        headers.forEach((h, i) => {
            record[h.trim()] = (values[i] ?? "").trim();
        });
        return record as unknown as CsvRow;
    });
}

// ── Supabase helper ─────────────────────────────────────────────────────────
// The Database type is a generic placeholder (Record<string, never>), so
// Supabase resolves all table types to `never`. We use an untyped wrapper to
// avoid the "not assignable to never" errors until proper types are generated.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any> {
    return createClient();
}

// ── Normalize product type to match DB constraint ───────────────────────────

const VALID_PRODUCT_TYPES = ['foundation', 'lipstick', 'blush', 'concealer', 'other'] as const;
type ValidProductType = (typeof VALID_PRODUCT_TYPES)[number];

function normalizeProductType(raw: string): ValidProductType {
    const lower = (raw ?? '').toLowerCase().trim();
    if ((VALID_PRODUCT_TYPES as readonly string[]).includes(lower)) {
        return lower as ValidProductType;
    }
    // Map common aliases
    const aliases: Record<string, ValidProductType> = {
        lip: 'lipstick',
        lips: 'lipstick',
        'lip tint': 'lipstick',
        'lip gloss': 'lipstick',
        base: 'foundation',
        powder: 'foundation',
        // eyes: 'other',
        eyeshadow: 'other',
        mascara: 'other',
        bronzer: 'other',
        highlighter: 'other',
        primer: 'other',
        contour: 'other',
        setting: 'other',
    };
    return aliases[lower] ?? 'other';
}

// ── Search catalog for duplicates ───────────────────────────────────────────

/**
 * Search the CSV product catalog for entries matching the given query.
 * Used to prevent duplicate entries — if a product already exists in the
 * catalog, the user can "claim" it instead of creating a custom one.
 */
export async function searchCatalogProducts(
    query: string
): Promise<DuplicateCandidate[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const rows = loadCsvRows();
    const matches: DuplicateCandidate[] = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const searchable = `${r.brand_name} ${r.product_name} ${r.shade_name}`.toLowerCase();
        if (searchable.includes(q)) {
            matches.push({
                csvIndex: i,
                brandName: r.brand_name,
                productName: r.product_name,
                shadeName: r.shade_name,
                productType: r.product_type,
                finish: r.finish,
                hexColor: r.hex_color,
                price: parseFloat(r.price) || 0,
                imageUrl: r.image_url || "",
            });
        }
        if (matches.length >= 10) break; // cap results
    }
    return matches;
}

// ── Add a catalog product (user "claims" existing CSV product) ──────────────

/**
 * Mark an existing catalog product as owned by the user.
 */
export async function addCatalogProduct(csvIndex: number): Promise<{ success: boolean; error?: string }> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const rows = loadCsvRows();
    if (csvIndex < 0 || csvIndex >= rows.length) {
        return { success: false, error: "Invalid product index" };
    }

    const row = rows[csvIndex];

    // Check if already owned — match by brand + product + shade
    const { data: existing } = await supabase
        .from("custom_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", row.product_name)
        .eq("brand_name", row.brand_name)
        .eq("shade_name", row.shade_name)
        .maybeSingle();

    if (existing) {
        return { success: false, error: "You already own this product" };
    }

    // Store as a custom_products row with is_owned = true to mark it came from catalog
    const { error } = await supabase.from("custom_products").insert({
        user_id: user.id,
        name: row.product_name,
        brand_name: row.brand_name,
        shade_name: row.shade_name,
        product_type: normalizeProductType(row.product_type),
        finish: row.finish || null,
        hex_color: row.hex_color || null,
        price: parseFloat(row.price) || null,
        image_url: row.image_url || null,
        is_owned: true,
    });

    if (error) {
        console.error("Failed to add catalog product:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ── Add a custom product ────────────────────────────────────────────────────

export async function addCustomProduct(
    input: AddCustomProductInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Dedup check: see if user already has this exact product
    const { data: existing } = await supabase
        .from("custom_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", input.name)
        .eq("brand_name", input.brandName)
        .eq("shade_name", input.shadeName)
        .maybeSingle();

    if (existing) {
        return { success: false, error: "You already have this product" };
    }

    const { error } = await supabase.from("custom_products").insert({
        user_id: user.id,
        name: input.name,
        brand_name: input.brandName,
        shade_name: input.shadeName,
        product_type: normalizeProductType(input.productType),
        finish: input.finish || null,
        hex_color: input.hexColor || null,
        price: input.price ?? null,
        is_owned: false,
    });

    if (error) {
        console.error("Failed to add custom product:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ── Get all user products ───────────────────────────────────────────────────

export async function getUserProducts(): Promise<UserProduct[]> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("custom_products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch user products:", error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id,
        source: row.is_owned ? ("catalog" as const) : ("custom" as const),
        name: row.name,
        brandName: row.brand_name ?? "",
        shadeName: row.shade_name ?? "",
        productType: row.product_type,
        finish: row.finish ?? "",
        hexColor: row.hex_color ?? "",
        price: Number(row.price) || 0,
        imageUrl: row.image_url ?? "",
        productUrl: "",
        createdAt: row.created_at,
    }));
}

// ── Remove a user product ───────────────────────────────────────────────────

export async function removeUserProduct(
    productId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
        .from("custom_products")
        .delete()
        .eq("id", productId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to remove product:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ── Get owned product keys (for recommendation filtering) ───────────────────

/**
 * Returns a set of "brand|shade|hex" keys for all products the user owns.
 * Used to filter recommendations so the user doesn't see products they already have.
 */
export async function getOwnedProductKeys(): Promise<string[]> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("custom_products")
        .select("brand_name, shade_name, hex_color")
        .eq("user_id", user.id);

    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map(
        (r: any) =>
            `${(r.brand_name ?? "").toLowerCase()}|${(r.shade_name ?? "").toLowerCase()}|${(r.hex_color ?? "").toLowerCase()}`
    );
}

// ── Get owned products for the recommendation matcher ───────────────────────

/**
 * Returns the user's owned products (both catalog-claimed and custom)
 * with the fields needed by the recommendation matcher for scoring.
 */
export async function getUserOwnedProductsForMatching(): Promise<{
    brandName: string;
    name: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    imageUrl: string;
}[]> {
    const supabase = await db();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("custom_products")
        .select("name, brand_name, shade_name, product_type, finish, hex_color, price, image_url")
        .eq("user_id", user.id);

    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
        brandName: r.brand_name ?? "",
        name: r.name ?? "",
        shadeName: r.shade_name ?? "",
        productType: r.product_type ?? "other",
        finish: r.finish ?? "",
        hexColor: r.hex_color ?? "",
        price: Number(r.price) || 0,
        imageUrl: r.image_url ?? "",
    }));
}

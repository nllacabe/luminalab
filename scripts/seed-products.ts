/**
 * Seed script — reads products.csv, converts hex → RGB → CIELAB,
 * and inserts brands + products into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-products.ts
 *
 * Requires:
 *   npm install -D tsx
 *   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Supabase admin client ──────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Color conversion: Hex → RGB → CIELAB ──────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace("#", "");
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16),
    };
}

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    // sRGB → linear RGB
    let rr = r / 255;
    let gg = g / 255;
    let bb = b / 255;

    rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
    gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
    bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

    // Linear RGB → XYZ (D65 illuminant)
    let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
    let y = (rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750) / 1.00000;
    let z = (rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883;

    // XYZ → CIELAB
    const epsilon = 0.008856;
    const kappa = 903.3;

    x = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
    y = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
    z = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

    return {
        l: parseFloat((116 * y - 16).toFixed(4)),
        a: parseFloat((500 * (x - y)).toFixed(4)),
        b: parseFloat((200 * (y - z)).toFixed(4)),
    };
}

// ─── CSV parsing ────────────────────────────────────────────

interface CsvRow {
    brand_name: string;
    brand_slug: string;
    brand_country: string;
    is_local: string;
    is_cruelty_free: string;
    is_vegan: string;
    product_name: string;
    shade_name: string;
    product_type: string;
    finish: string;
    hex_color: string;
    price: string;
    product_url: string;
    image_url: string;
}

function parseCsv(filePath: string): CsvRow[] {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
            row[h] = values[i] || "";
        });
        return row as unknown as CsvRow;
    });
}

// ─── Main seed function ─────────────────────────────────────

async function seed() {
    const csvPath = resolve(__dirname, "../data/products.csv");
    const rows = parseCsv(csvPath);

    console.log(`📄 Loaded ${rows.length} products from CSV\n`);

    // Deduplicate brands
    const brandMap = new Map<string, CsvRow>();
    for (const row of rows) {
        if (!brandMap.has(row.brand_slug)) {
            brandMap.set(row.brand_slug, row);
        }
    }

    // Upsert brands
    const brandIdMap = new Map<string, string>();

    for (const [slug, row] of brandMap) {
        // Check if brand exists
        const { data: existing } = await supabase
            .from("brands")
            .select("id")
            .eq("slug", slug)
            .single();

        if (existing) {
            brandIdMap.set(slug, existing.id);
            console.log(`  ✓ Brand "${row.brand_name}" already exists`);
        } else {
            const { data: inserted, error } = await supabase
                .from("brands")
                .insert({
                    name: row.brand_name,
                    slug: slug,
                    origin_country: row.brand_country,
                    is_local: row.is_local === "true",
                    is_cruelty_free: row.is_cruelty_free === "true",
                    is_vegan: row.is_vegan === "true",
                })
                .select("id")
                .single();

            if (error) {
                console.error(`  ✗ Failed to insert brand "${row.brand_name}":`, error.message);
                continue;
            }
            brandIdMap.set(slug, inserted.id);
            console.log(`  + Brand "${row.brand_name}" inserted`);
        }
    }

    console.log("");

    // Insert products
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
        const brandId = brandIdMap.get(row.brand_slug);
        if (!brandId) {
            console.error(`  ✗ Skipping "${row.product_name}" — brand not found`);
            skipped++;
            continue;
        }

        // Convert hex → RGB → CIELAB
        const rgb = hexToRgb(row.hex_color);
        const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

        const { error } = await supabase.from("products").insert({
            brand_id: brandId,
            name: row.product_name,
            shade_name: row.shade_name,
            product_type: row.product_type,
            finish: row.finish || null,
            lab_l: lab.l,
            lab_a: lab.a,
            lab_b: lab.b,
            rgb_r: rgb.r,
            rgb_g: rgb.g,
            rgb_b: rgb.b,
            hex_color: row.hex_color,
            price: row.price ? parseFloat(row.price) : null,
            product_url: row.product_url || null,
            image_url: row.image_url || null,
        });

        if (error) {
            console.error(`  ✗ Failed "${row.shade_name}":`, error.message);
            skipped++;
        } else {
            console.log(`  + ${row.brand_name} — ${row.product_name} — ${row.shade_name}  (L*=${lab.l}, a*=${lab.a}, b*=${lab.b})`);
            inserted++;
        }
    }

    console.log(`\n✅ Done! Inserted ${inserted} products, skipped ${skipped}.`);
}

seed().catch(console.error);

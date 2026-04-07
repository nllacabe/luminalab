/**
 * Product Matcher — recommends products by color science.
 *
 * - Foundation / concealer: ranked by CIEDE2000 (closest skin match).
 * - Lipstick / blush / lip-type products: ranked by a harmony score derived
 *   from the user's ITA° skin-lightness category (Chardon et al.).
 * - Optional occasion filter: re-ranks lip/blush candidates after ITA° scoring
 *   based on social context (date_night, job_interview, etc.).
 *
 * Research basis: cosmetic harmony depends more on relative lightness than
 * exact L*a*b* matches. Lighter skin tones accept a wider lightness range;
 * deeper skin tones benefit from higher-chroma colors.
 */

import {
    hexToRgb,
    rgbToLab,
    deltaE2000,
    computeITA,
    classifySkinTone,
    type LabColor,
    type SkinToneCategory,
} from "@/lib/analysis";

import {
    OCCASION_INTENT_MAP,
    CHROMA_FLOOR_MINIMUM,
    type OccasionKey,
    type OccasionIntent,
} from "@/lib/recommendations/occasion-config";

// ── Types ───────────────────────────────────────────────────────────────────

/** Method used to score this product recommendation. */
export type ScoringMethod = "harmony" | "deltaE";

export interface ProductMatch {
    brandName: string;
    productName: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    deltaE: number;
    imageUrl: string;
    productUrl: string;
    /** Indicates whether the score used color-harmony rules or raw ΔE matching. */
    scoringMethod: ScoringMethod;
    /** Inferred PCCS hue family used by the occasion filter. */
    hue_family: string;
    /** Chroma magnitude (0–100 scale) used by the occasion chroma floor guard. */
    chroma_value: number;
    /** Whether this product is owned by the user (from their collection). */
    isOwned: boolean;
}

/** Input shape for user-owned products passed into the matcher. */
export interface OwnedProductInput {
    brandName: string;
    name: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    imageUrl: string;
}

interface CsvProduct {
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

// ── Lip / cheek product types (harmony-scored) ──────────────────────────────

/**
 * Product types that should use color-harmony scoring rather than ΔE matching.
 * Add new types here as the catalog grows (e.g. "blush", "lip gloss").
 */
const LIP_PRODUCT_TYPES = new Set([
    "lipstick",
    "lip gloss",
    "lip liner",
    "lip stain",
    "liquid lipstick",
    "blush",
]);

// ── Per-category harmony parameters ─────────────────────────────────────────

interface HarmonyParams {
    /** Ideal lightness contrast range [min, max] between skin L* and product L*. */
    contrastRange: [number, number];
    /** Minimum chroma (C* = √(a²+b²)) the product should have. */
    minChroma: number;
}

/**
 * Harmony parameters per ITA° skin-lightness category.
 *
 * Lighter skin → wider contrast range (pastels to medium shades all work).
 * Deeper skin  → narrower contrast range but higher chroma required so the
 *                color remains visible and balanced.
 */
const HARMONY_PARAMS: Record<SkinToneCategory, HarmonyParams> = {
    very_light: { contrastRange: [20, 55], minChroma: 15 },
    light: { contrastRange: [20, 50], minChroma: 18 },
    intermediate: { contrastRange: [15, 45], minChroma: 22 },
    tan: { contrastRange: [12, 40], minChroma: 25 },
    brown: { contrastRange: [10, 35], minChroma: 28 },
    dark: { contrastRange: [8, 30], minChroma: 32 },
};

// ── Color-harmony scoring ────────────────────────────────────────────────────

/**
 * Compute a harmony score (lower = better) for a lip/cheek product.
 *
 * Three weighted sub-penalties:
 *  1. Lightness-contrast penalty (weight 0.5) — product L* must differ from
 *     skin L* by an amount within the category's target contrast range.
 *  2. Chroma-sufficiency penalty (weight 0.3) — product must meet the
 *     category's minimum chroma so the colour reads on the skin.
 *  3. Hue-plausibility penalty (weight 0.2) — product hue should fall in the
 *     red–pink–coral range (h° ≈ 0–60°) that is typical for lip/cheek products.
 *
 * @param productLab  - Product CIELAB color
 * @param skinLab     - User's average skin CIELAB color
 * @param category    - User's ITA°-derived skin-lightness category
 * @returns Harmony penalty in a range similar to ΔE (0 = perfect harmony)
 */
function computeHarmonyScore(
    productLab: LabColor,
    skinLab: LabColor,
    category: SkinToneCategory,
): number {
    const params = HARMONY_PARAMS[category];

    // 1 — Lightness contrast penalty
    const deltaL = Math.abs(productLab.L - skinLab.L);
    const [cMin, cMax] = params.contrastRange;
    let contrastPenalty: number;
    if (deltaL < cMin) {
        // Too similar → washes out; penalise proportionally how far below minimum
        contrastPenalty = (cMin - deltaL) * 1.5;
    } else if (deltaL > cMax) {
        // Too different → harsh contrast; softer penalty
        contrastPenalty = (deltaL - cMax) * 0.8;
    } else {
        // Within ideal range — zero penalty; slight bonus for centring
        const centre = (cMin + cMax) / 2;
        contrastPenalty = Math.abs(deltaL - centre) * 0.1;
    }

    // 2 — Chroma sufficiency penalty
    const chroma = Math.sqrt(productLab.a ** 2 + productLab.b ** 2);
    const chromaPenalty = chroma < params.minChroma
        ? (params.minChroma - chroma) * 1.2
        : 0;

    // 3 — Hue plausibility penalty (lip/cheek products live in the red–pink–coral arc)
    // Hue angle: 0° = red, 90° = yellow; we wrap to [0, 360)
    // const hue = ((Math.atan2(productLab.b, productLab.a) * 180) / Math.PI + 360) % 360;
    // // Ideal lip hue range: 330°–60° (through 0°)
    // const distFromRed = Math.min(
    //     Math.abs(hue - 0),
    //     Math.abs(hue - 360),
    //     Math.abs(hue - 30),
    // );
    // const huePenalty = distFromRed > 60 ? (distFromRed - 60) * 0.3 : 0;

    // UPDATED CODEEEE ICHECK MUNA KUNG MAS ACCURATEEE
    // 3 — Hue plausibility penalty (lip/cheek products span red–pink–berry–plum arc)
    // Valid cosmetic arc: 260°–360° (plum/berry/purple) and 0°–60° (red/coral/orange-red)
    // Anything in the yellow-green-cyan range (60°–260°) is genuinely implausible for lips.
    const hue = ((Math.atan2(productLab.b, productLab.a) * 180) / Math.PI + 360) % 360;

    let huePenalty: number;
    if (hue >= 260 || hue <= 60) {
        // Within the valid arc — zero or minimal penalty
        // Small bonus for being near the red center (0°/360°)
        const distFromRed = Math.min(hue, 360 - hue); // 0 at red, grows toward 130° either way
        huePenalty = distFromRed > 100 ? (distFromRed - 100) * 0.05 : 0;
    } else {
        // Outside valid arc (yellow/green/cyan/teal range) — penalize proportionally
        // Find distance to nearest valid arc boundary (60° or 260°)
        const distToLow = hue - 60;   // distance to 60° boundary
        const distToHigh = 260 - hue; // distance to 260° boundary
        const distToArc = Math.min(distToLow, distToHigh);
        huePenalty = distToArc * 0.3;
    }

    // Weighted sum
    return 0.5 * contrastPenalty + 0.3 * chromaPenalty + 0.2 * huePenalty;
}

// ── Hue family inference ─────────────────────────────────────────────────────

/**
 * Map a product's CIELAB values to one of the PCCS hue family strings used
 * by OCCASION_INTENT_MAP — derived entirely from the hex color already in the
 * CSV, so no manual tagging is required.
 *
 * Chroma scale: raw CIELAB C* (√a²+b²) mapped to 0-100 by dividing by 1.28
 * (max theoretical C* for most cosmetic pigments ≈ 128).
 */
function inferHueFamily(lab: LabColor): { hue_family: string; chroma_value: number } {
    const rawChroma = Math.sqrt(lab.a ** 2 + lab.b ** 2);
    const chroma_value = Math.min(100, (rawChroma / 1.28));

    // Hue angle in [0,360)
    const hue = ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;

    // Very low chroma → achromatic family
    if (rawChroma < 8) return { hue_family: "nude", chroma_value };

    // Map hue angle → PCCS family strings
    // Cosmetic reds/pinks/purples typically occupy 300°-60° (through 0°) in Lab
    let hue_family: string;
    if (hue >= 340 || hue < 15) hue_family = "red";
    else if (hue < 30) hue_family = "orange-red";
    else if (hue < 50) hue_family = "coral";
    else if (hue < 70) hue_family = "orange";
    else if (hue >= 280 && hue < 310) hue_family = "deep-plum";
    else if (hue >= 310 && hue < 325) hue_family = "berry";
    else if (hue >= 325 && hue < 340) hue_family = "wine";
    else hue_family = "neutral-pink";

    // Refine by chroma into more specific families
    if (chroma_value < 25) {
        // Low-chroma reds → mauve / dusty-rose / greige
        if (hue_family === "red" || hue_family === "wine" || hue_family === "berry") {
            hue_family = "mauve";
        } else if (hue_family === "coral" || hue_family === "orange-red") {
            hue_family = "dusty-rose";
        } else if (hue_family === "orange") {
            hue_family = "greige";
        }
    } else if (chroma_value < 45) {
        if (hue_family === "red") {
            // Warm-pink territory: medium chroma, red hue
            if (lab.a > 25) hue_family = "warm-pink";
        } else if (hue >= 310 && hue < 340 && chroma_value < 45) {
            hue_family = "cool-pink";
        }
    } else {
        // High chroma purplish → fuchsia
        if (hue >= 300 && hue < 330) hue_family = "fuchsia";
        // High chroma red variants
        if (hue_family === "red" && lab.a > 40) hue_family = "red"; // keep
    }

    return { hue_family, chroma_value };
}

// ── Occasion filter ──────────────────────────────────────────────────────────

/**
 * Apply the three-pass occasion filter to an already-scored list of products.
 *
 * Pass 1 — Hard exclude: remove products whose hue family is in avoid_hues.
 * Pass 3 — Chroma floor: for Tan/Brown/Dark skin tones, enforce minimum chroma
 *           even if the occasion requests low chroma (skin tone always wins).
 * Pass 2 — Soft boost: move favored-hue products to the front of the list;
 *           unfavored products are deprioritised but not removed.
 *
 * (Passes are intentionally numbered 1-3-2 to match the spec; Pass 3 is a
 *  prerequisite guard that runs before the soft boost.)
 */
function applyOccasionFilter(
    candidates: ProductMatch[],
    intent: OccasionIntent,
    skinCategory: SkinToneCategory,
): ProductMatch[] {
    const deepTones: SkinToneCategory[] = ["tan", "brown", "dark"];
    const requiresChromaFloor = deepTones.includes(skinCategory);

    // Pass 1: hard exclude
    let filtered = candidates.filter(
        (p) => !intent.avoid_hues.includes(p.hue_family),
    );

    // Pass 3: chroma floor override for deeper skin tones
    if (requiresChromaFloor) {
        filtered = filtered.filter((p) => p.chroma_value >= CHROMA_FLOOR_MINIMUM);
    }

    // Pass 2: soft boost — favored hues rise to top
    if (intent.favored_hues.length > 0) {
        const favored = filtered.filter((p) => intent.favored_hues.includes(p.hue_family));
        const rest = filtered.filter((p) => !intent.favored_hues.includes(p.hue_family));
        return [...favored, ...rest];
    }

    return filtered;
}

// ── CSV Parser ───────────────────────────────────────────────────────────────

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

function parseCsv(raw: string): CsvProduct[] {
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const record: Record<string, string> = {};
        headers.forEach((h, i) => {
            record[h.trim()] = (values[i] ?? "").trim();
        });
        return record as unknown as CsvProduct;
    });
}

// ── Matching engine ──────────────────────────────────────────────────────────

let cachedProducts: CsvProduct[] | null = null;
let csvText: string | null = null;

/**
 * Load the products CSV text. Must be called once before getRecommendations.
 * We accept the raw CSV string so the caller can use dynamic import / fetch.
 */
export function loadProductsCsv(raw: string): void {
    csvText = raw;
    cachedProducts = null;
}

function getProducts(): CsvProduct[] {
    if (cachedProducts) return cachedProducts;
    if (!csvText) throw new Error("Products CSV not loaded — call loadProductsCsv first.");
    cachedProducts = parseCsv(csvText);
    return cachedProducts;
}

/**
 * Get product recommendations for a user's skin LAB values.
 *
 * - Lip / cheek products → color-harmony score (ITA°-based).
 * - All other products   → CIEDE2000 (closest skin-color match).
 *
 * Both scores are lower-is-better and returned in the `deltaE` field so the
 * rest of the UI doesn't need to change. Use `scoringMethod` to
 * distinguish them in the UI if needed (e.g. to show "Harmonizes with your
 * skin" vs "Matches your skin").
 *
 * @param userLab - The user's average CIELAB skin color from analysis
 * @param topN    - Max number of results to return (default: 8)
 * @returns Sorted array of product matches (lowest score first = best match)
 */
/**
 * Get product recommendations for a user's skin LAB values.
 *
 * - Lip / cheek products → color-harmony score (ITA°-based), then occasion filter.
 * - All other products   → CIEDE2000 (closest skin-color match).
 *
 * @param userLab  - The user's average CIELAB skin color from analysis
 * @param topN     - Max number of results to return (default: 8)
 * @param occasion - Optional occasion key; defaults to 'everyday' (no filter).
 */
export function getRecommendations(
    userLab: LabColor,
    topN = 8,
    occasion: OccasionKey = "everyday",
    productTypes: string[] = [],
    preferredBrands: string[] = [],
    ownedProducts: OwnedProductInput[] = [],
    finishes: string[] = [],
    budgetRange?: { min: number; max: number },
): ProductMatch[] {
    let allProducts = getProducts();

    // Filter by preferred brands if any are specified
    if (preferredBrands.length > 0) {
        const lowerPreferredBrands = preferredBrands.map(b => b.toLowerCase().trim());
        allProducts = allProducts.filter(p => lowerPreferredBrands.includes(p.brand_name.toLowerCase().trim()));
    }

    // Filter by finish preferences if any are specified
    if (finishes.length > 0) {
        const lowerFinishes = finishes.map(f => f.toLowerCase().trim());
        allProducts = allProducts.filter(p => lowerFinishes.includes(p.finish.toLowerCase().trim()));
    }

    // Filter by budget range if specified
    if (budgetRange && (budgetRange.min > 0 || budgetRange.max < 5000)) {
        allProducts = allProducts.filter(p => {
            const price = parseFloat(p.price) || 0;
            return price >= budgetRange.min && price <= budgetRange.max;
        });
    }

    // Filter by user's preferred product types if any are specified
    const hasTypeFilter = productTypes.length > 0;
    const products = hasTypeFilter
        ? allProducts.filter(p => {
            const t = p.product_type.toLowerCase().trim();
            return productTypes.some(pref => {
                if (pref === "foundation") return t === "foundation" || t === "concealer";
                if (pref === "lipstick") return LIP_PRODUCT_TYPES.has(t);
                if (pref === "blush") return t === "blush";
                // if (pref === "other") return t === "eyes" || t === "other";
                return t === pref;
            });
        })
        : allProducts;

    // Compute ITA° category once — used for all lip/cheek harmony scoring
    const ita = computeITA(userLab);
    const skinCategory = classifySkinTone(ita);

    const seen = new Set<string>();
    const scored: ProductMatch[] = [];

    for (const p of products) {
        const key = `${p.brand_name}|${p.product_name}|${p.shade_name}|${p.hex_color}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!p.hex_color || !p.hex_color.startsWith("#")) continue;

        const rgb = hexToRgb(p.hex_color);
        const productLab = rgbToLab(rgb.r, rgb.g, rgb.b);
        const { hue_family, chroma_value } = inferHueFamily(productLab);

        const isLipProduct = LIP_PRODUCT_TYPES.has(p.product_type.toLowerCase().trim());
        const score = isLipProduct
            ? computeHarmonyScore(productLab, userLab, skinCategory)
            : deltaE2000(userLab, productLab);

        scored.push({
            brandName: p.brand_name,
            productName: p.product_name,
            shadeName: p.shade_name,
            productType: p.product_type,
            finish: p.finish,
            hexColor: p.hex_color,
            price: parseFloat(p.price) || 0,
            deltaE: Math.round(score * 100) / 100,
            imageUrl: p.image_url || "",
            productUrl: p.product_url || "",
            scoringMethod: isLipProduct ? "harmony" : "deltaE",
            hue_family,
            chroma_value,
            isOwned: false,
        });
    }

    // Split into lip vs other for occasion filtering
    const lipScored = scored.filter(p => LIP_PRODUCT_TYPES.has(p.productType.toLowerCase().trim()));
    const otherScored = scored.filter(p => !LIP_PRODUCT_TYPES.has(p.productType.toLowerCase().trim()));

    // Sort lip/cheek products by harmony score, then apply occasion filter
    lipScored.sort((a, b) => a.deltaE - b.deltaE);
    const intent: OccasionIntent = OCCASION_INTENT_MAP[occasion] ?? OCCASION_INTENT_MAP["everyday"];
    const filteredLip = applyOccasionFilter(lipScored, intent, skinCategory);

    // Sort other products by ΔE
    otherScored.sort((a, b) => a.deltaE - b.deltaE);

    // ── Merge strategy ────────────────────────────────────────────────────
    let catalogResults: ProductMatch[];

    if (hasTypeFilter) {
        // User chose specific types — no forced diversity, just concat
        catalogResults = [...filteredLip, ...otherScored];
    } else {
        // No filter — round-robin interleave across product-type groups
        catalogResults = interleaveByProductType([...filteredLip, ...otherScored]);
    }

    // Trim to topN catalog results
    catalogResults = catalogResults.slice(0, topN);

    // ── Owned product injection ───────────────────────────────────────────
    if (ownedProducts.length > 0 && catalogResults.length > 0) {
        // Build a lookup of owned product keys for fast matching
        const ownedKeySet = new Set(
            ownedProducts
                .filter(op => op.hexColor)
                .map(op => `${op.brandName.toLowerCase().trim()}|${op.shadeName.toLowerCase().trim()}|${op.hexColor.toLowerCase().trim()}`)
        );

        // Pass 1: flag catalog results that the user already owns
        for (const cr of catalogResults) {
            const crKey = `${cr.brandName.toLowerCase().trim()}|${cr.shadeName.toLowerCase().trim()}|${cr.hexColor.toLowerCase().trim()}`;
            if (ownedKeySet.has(crKey)) {
                cr.isOwned = true;
            }
        }

        // Determine the score range of catalog results
        const catalogScores = catalogResults.map(p => p.deltaE);
        const minScore = Math.min(...catalogScores);
        const maxScore = Math.max(...catalogScores);

        // Pass 2: score owned products NOT already in catalog results
        const ownedMatches: ProductMatch[] = [];
        for (const op of ownedProducts) {
            if (!op.hexColor || !op.hexColor.startsWith("#")) continue;

            // Skip if already in catalog results (already flagged as owned above)
            const opKey = `${op.brandName.toLowerCase().trim()}|${op.shadeName.toLowerCase().trim()}|${op.hexColor.toLowerCase().trim()}`;
            const alreadyInResults = catalogResults.some(cr => {
                const crKey = `${cr.brandName.toLowerCase().trim()}|${cr.shadeName.toLowerCase().trim()}|${cr.hexColor.toLowerCase().trim()}`;
                return crKey === opKey;
            });
            if (alreadyInResults) continue;

            const rgb = hexToRgb(op.hexColor);
            const productLab = rgbToLab(rgb.r, rgb.g, rgb.b);
            const { hue_family, chroma_value } = inferHueFamily(productLab);

            const isLipProduct = LIP_PRODUCT_TYPES.has(op.productType.toLowerCase().trim());
            const score = isLipProduct
                ? computeHarmonyScore(productLab, userLab, skinCategory)
                : deltaE2000(userLab, productLab);
            const roundedScore = Math.round(score * 100) / 100;

            // Only include if score falls within the catalog range
            if (roundedScore >= minScore && roundedScore <= maxScore) {
                ownedMatches.push({
                    brandName: op.brandName,
                    productName: op.name,
                    shadeName: op.shadeName,
                    productType: op.productType,
                    finish: op.finish || "",
                    hexColor: op.hexColor,
                    price: op.price || 0,
                    deltaE: roundedScore,
                    imageUrl: op.imageUrl || "",
                    productUrl: "",
                    scoringMethod: isLipProduct ? "harmony" : "deltaE",
                    hue_family,
                    chroma_value,
                    isOwned: true,
                });
            }
        }

        // Merge owned products into catalog results, sorted by score
        if (ownedMatches.length > 0) {
            ownedMatches.sort((a, b) => a.deltaE - b.deltaE);
            // Insert owned products at their natural score position
            const merged = [...catalogResults, ...ownedMatches];
            merged.sort((a, b) => a.deltaE - b.deltaE);
            return merged;
        }
    }

    return catalogResults;
}

// ── Round-robin interleaver ──────────────────────────────────────────────────

/**
 * Groups products by normalized product-type category, then picks one from
 * each group in rotation (round-robin). Within each group, products are
 * already sorted by score (lower = better).
 */
function interleaveByProductType(products: ProductMatch[]): ProductMatch[] {
    // Normalize into broad categories for grouping
    const categoryOf = (p: ProductMatch): string => {
        const t = p.productType.toLowerCase().trim();
        if (t === "foundation" || t === "concealer") return "foundation";
        if (t === "blush") return "blush";
        if (LIP_PRODUCT_TYPES.has(t)) return "lipstick";
        return "other";
    };

    // Build per-category queues (each already sorted by score)
    const groups = new Map<string, ProductMatch[]>();
    for (const p of products) {
        const cat = categoryOf(p);
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(p);
    }

    // Sort each group by score internally
    for (const arr of groups.values()) {
        arr.sort((a, b) => a.deltaE - b.deltaE);
    }

    // Round-robin pick
    const result: ProductMatch[] = [];
    const categoryKeys = [...groups.keys()];
    const pointers = new Map<string, number>();
    for (const k of categoryKeys) pointers.set(k, 0);

    let exhausted = 0;
    while (exhausted < categoryKeys.length) {
        for (const cat of categoryKeys) {
            const idx = pointers.get(cat)!;
            const arr = groups.get(cat)!;
            if (idx < arr.length) {
                result.push(arr[idx]);
                pointers.set(cat, idx + 1);
            }
        }
        // Check how many are exhausted
        exhausted = 0;
        for (const cat of categoryKeys) {
            if (pointers.get(cat)! >= groups.get(cat)!.length) exhausted++;
        }
    }

    return result;
}
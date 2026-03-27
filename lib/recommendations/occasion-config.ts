/**
 * Occasion-based color intent configuration for LuminaLAB.
 *
 * Each occasion maps to an intent that biases the post-ITA° harmony filter:
 *  - favored_hues  → boosted to top of ranked results (soft pass)
 *  - avoid_hues    → removed from results               (hard pass)
 *  - chroma_bias   → used alongside the skin-tone chroma floor guard
 *
 * Research basis: Elliot & Maier (2012) approach/avoidance colour signalling;
 * PCCS/NCD hue family taxonomy; Sirisayan (2023) chroma-sufficiency for
 * deeper skin tones.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type OccasionKey =
    | "job_interview"
    | "date_night"
    | "party"
    | "formal_gala"
    | "solemn"
    | "everyday";

export interface OccasionIntent {
    motivationType: "approach" | "avoidance-safe" | "neutral";
    favored_hues: string[];    // PCCS hue family labels
    chroma_bias: "high" | "medium" | "low";
    avoid_hues: string[];
    label: string;
    icon: string;
    descriptor: string;
}

// ── Config map ───────────────────────────────────────────────────────────────

export const OCCASION_INTENT_MAP: Record<OccasionKey, OccasionIntent> = {
    job_interview: {
        motivationType: "avoidance-safe",
        favored_hues: ["mauve", "nude", "dusty-rose", "berry", "cool-pink"],
        chroma_bias: "medium",
        avoid_hues: ["bright-red", "orange", "coral"],
        label: "Job Interview",
        icon: "Briefcase",
        descriptor: "Polished & professional",
    },
    date_night: {
        motivationType: "approach",
        favored_hues: ["red", "rose", "warm-pink", "berry", "coral"],
        chroma_bias: "high",
        avoid_hues: ["nude", "greige", "cool-taupe"],
        label: "Date Night",
        icon: "Heart",
        descriptor: "Bold & romantic",
    },
    party: {
        motivationType: "approach",
        favored_hues: ["coral", "fuchsia", "warm-pink", "red", "orange-red"],
        chroma_bias: "high",
        avoid_hues: [],
        label: "Party / Social",
        icon: "PartyPopper",
        descriptor: "Vibrant & expressive",
    },
    formal_gala: {
        motivationType: "avoidance-safe",
        favored_hues: ["deep-plum", "berry", "wine", "mauve", "neutral-pink"],
        chroma_bias: "medium",
        avoid_hues: ["bright-coral", "orange"],
        label: "Formal / Gala",
        icon: "Crown",
        descriptor: "Elegant & refined",
    },
    solemn: {
        motivationType: "avoidance-safe",
        favored_hues: ["nude", "mauve", "greige", "cool-taupe"],
        chroma_bias: "low",
        avoid_hues: ["red", "coral", "fuchsia", "bright-pink", "orange"],
        label: "Solemn",
        icon: "CircleDot",
        descriptor: "Understated & respectful",
    },
    everyday: {
        motivationType: "neutral",
        favored_hues: [],          // no filter — full ITA° range
        chroma_bias: "medium",
        avoid_hues: [],
        label: "Everyday / Casual",
        icon: "Sun",
        descriptor: "Effortless & versatile",
    },
};

/** Ordered list used by the UI chip grid. */
export const OCCASIONS: OccasionKey[] = [
    "job_interview",
    "date_night",
    "party",
    "formal_gala",
    "solemn",
    "everyday",
];

/**
 * Minimum chroma (0-100 scale) enforced for Tan / Brown / Dark skin tones,
 * even when an occasion's chroma_bias is 'low'.
 * Start at 30 and adjust based on SUS evaluation feedback.
 */
export const CHROMA_FLOOR_MINIMUM = 30;

/**
 * Color science utilities for LuminaLAB skin analysis.
 *
 * Provides:
 *  - sRGB ↔ CIELAB conversion (D65 illuminant)
 *  - ITA° (Individual Typology Angle) computation & skin-tone classification
 *  - CIEDE2000 (ΔE2000) color difference
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface LabColor {
    L: number; // Lightness 0–100
    a: number; // green ↔ red
    b: number; // blue  ↔ yellow
}

export type SkinToneCategory =
    | "very_light"
    | "light"
    | "intermediate"
    | "tan"
    | "brown"
    | "dark";

// ── sRGB → CIELAB ──────────────────────────────────────────────────────────

/** D65 reference white point */
const D65 = { X: 95.047, Y: 100.0, Z: 108.883 };

function srgbToLinear(c: number): number {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
    const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
}

function labF(t: number): number {
    const delta = 6 / 29;
    return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

function labFInverse(t: number): number {
    const delta = 6 / 29;
    return t > delta ? t ** 3 : 3 * delta * delta * (t - 4 / 29);
}

/** Convert sRGB (0-255 each) to CIELAB (D65). */
export function rgbToLab(r: number, g: number, b: number): LabColor {
    // sRGB → linear RGB → XYZ (sRGB D65 matrix)
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);

    const X = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) * 100;
    const Y = (0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl) * 100;
    const Z = (0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl) * 100;

    const fx = labF(X / D65.X);
    const fy = labF(Y / D65.Y);
    const fz = labF(Z / D65.Z);

    return {
        L: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
    };
}

/** Convert CIELAB (D65) back to sRGB (0-255 each). */
export function labToRgb(lab: LabColor): { r: number; g: number; b: number } {
    const fy = (lab.L + 16) / 116;
    const fx = lab.a / 500 + fy;
    const fz = fy - lab.b / 200;

    const X = D65.X * labFInverse(fx);
    const Y = D65.Y * labFInverse(fy);
    const Z = D65.Z * labFInverse(fz);

    // XYZ → linear sRGB
    const rl = (3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z) / 100;
    const gl = (-0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z) / 100;
    const bl = (0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z) / 100;

    return {
        r: linearToSrgb(rl),
        g: linearToSrgb(gl),
        b: linearToSrgb(bl),
    };
}

// ── ITA° ────────────────────────────────────────────────────────────────────

/**
 * Individual Typology Angle.
 * ITA° = arctan((L* − 50) / b*) × (180 / π)
 */
export function computeITA(lab: LabColor): number {
    if (lab.b === 0) return lab.L > 50 ? 90 : -90;
    return Math.atan2(lab.L - 50, lab.b) * (180 / Math.PI);
}

/** Classify skin tone from ITA° using Chardon et al. thresholds. */
export function classifySkinTone(ita: number): SkinToneCategory {
    if (ita > 55) return "very_light";
    if (ita > 41) return "light";
    if (ita > 28) return "intermediate";
    if (ita > 10) return "tan";
    if (ita > -30) return "brown";
    return "dark";
}

/** Human-readable label for a skin tone category. */
export function skinToneLabel(cat: SkinToneCategory): string {
    const labels: Record<SkinToneCategory, string> = {
        very_light: "Very Light",
        light: "Light",
        intermediate: "Intermediate",
        tan: "Tan",
        brown: "Brown",
        dark: "Dark",
    };
    return labels[cat];
}

// ── ΔE2000 (CIEDE2000) ─────────────────────────────────────────────────────

/** Full CIEDE2000 colour-difference formula (ISO/CIE 11664-6). */
export function deltaE2000(lab1: LabColor, lab2: LabColor): number {
    const { L: L1, a: a1, b: b1 } = lab1;
    const { L: L2, a: a2, b: b2 } = lab2;

    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    // Step 1 — C'ab, h'ab
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cab = (C1 + C2) / 2;
    const Cab7 = Math.pow(Cab, 7);
    const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 6103515625))); // 25^7
    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    const h1p =
        a1p === 0 && b1 === 0 ? 0 : (Math.atan2(b1, a1p) * deg + 360) % 360;
    const h2p =
        a2p === 0 && b2 === 0 ? 0 : (Math.atan2(b2, a2p) * deg + 360) % 360;

    // Step 2 — ΔL', ΔC', ΔH'
    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp: number;
    if (C1p * C2p === 0) {
        dhp = 0;
    } else if (Math.abs(h2p - h1p) <= 180) {
        dhp = h2p - h1p;
    } else if (h2p - h1p > 180) {
        dhp = h2p - h1p - 360;
    } else {
        dhp = h2p - h1p + 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

    // Step 3 — CIEDE2000
    const Lp = (L1 + L2) / 2;
    const Cp = (C1p + C2p) / 2;

    let hp: number;
    if (C1p * C2p === 0) {
        hp = h1p + h2p;
    } else if (Math.abs(h1p - h2p) <= 180) {
        hp = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
        hp = (h1p + h2p + 360) / 2;
    } else {
        hp = (h1p + h2p - 360) / 2;
    }

    const T =
        1 -
        0.17 * Math.cos((hp - 30) * rad) +
        0.24 * Math.cos(2 * hp * rad) +
        0.32 * Math.cos((3 * hp + 6) * rad) -
        0.20 * Math.cos((4 * hp - 63) * rad);

    const SL = 1 + (0.015 * (Lp - 50) ** 2) / Math.sqrt(20 + (Lp - 50) ** 2);
    const SC = 1 + 0.045 * Cp;
    const SH = 1 + 0.015 * Cp * T;

    const Cp7 = Math.pow(Cp, 7);
    const RT =
        -2 *
        Math.sqrt(Cp7 / (Cp7 + 6103515625)) *
        Math.sin(60 * rad * Math.exp(-(((hp - 275) / 25) ** 2)));

    return Math.sqrt(
        (dLp / SL) ** 2 +
        (dCp / SC) ** 2 +
        (dHp / SH) ** 2 +
        RT * (dCp / SC) * (dHp / SH)
    );
}

// ── Utilities ───────────────────────────────────────────────────────────────

/** Convert a hex color string (#RRGGBB) to RGB components. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

export function rgbToHex(r: number, g: number, b: number): string {
    const hex = (v: number) =>
        Math.round(Math.min(255, Math.max(0, v)))
            .toString(16)
            .padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

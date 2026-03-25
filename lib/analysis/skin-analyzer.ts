/**
 * Skin Analyzer — orchestrates the full analysis pipeline.
 *
 * Pipeline: detect face → extract skin regions → convert to LAB →
 *           compute ITA° → classify skin tone → return results.
 */

import { detectFace } from "./mediapipe";
import { extractSkinRegions, type SkinRegionName, type BoundingBox } from "./skin-regions";
import {
    rgbToLab,
    computeITA,
    classifySkinTone,
    rgbToHex,
    type LabColor,
    type SkinToneCategory,
} from "./color-science";

// ── Result type ─────────────────────────────────────────────────────────────

export interface RegionResult {
    name: SkinRegionName;
    avgRgb: [number, number, number];
    lab: LabColor;
    hex: string;
    boundingBox: BoundingBox;
}

export interface SkinAnalysisResult {
    /** Per-region breakdown */
    regions: RegionResult[];
    /** Weighted average across all regions */
    averageRgb: { r: number; g: number; b: number };
    averageLab: LabColor;
    itaAngle: number;
    skinToneCategory: SkinToneCategory;
    hexColor: string;
}

// ── Region weights (cheeks contribute more than forehead) ───────────────

const REGION_WEIGHTS: Record<SkinRegionName, number> = {
    leftCheek: 0.35,
    rightCheek: 0.35,
    forehead: 0.30,
};

// ── Analyzer ────────────────────────────────────────────────────────────────

/**
 * Run the full skin analysis pipeline on a loaded image element.
 *
 * The image **must** already be loaded (`img.complete === true`).
 * A hidden `<canvas>` is created internally for pixel sampling.
 *
 * @throws Error if no face is detected in the image.
 */
export async function analyzeSkin(
    imageElement: HTMLImageElement
): Promise<SkinAnalysisResult> {
    // 1. Detect face landmarks
    const detection = await detectFace(imageElement);

    if (!detection || detection.faceLandmarks.length === 0) {
        throw new Error(
            "No face detected in the image. Please upload a clear, front-facing photo with good lighting."
        );
    }

    const landmarks = detection.faceLandmarks[0];

    // 2. Extract skin-region pixel data
    const canvas = document.createElement("canvas");
    const regionData = extractSkinRegions(landmarks, imageElement, canvas);

    // 3. Convert each region to LAB
    const regions: RegionResult[] = regionData.map((region) => {
        const [r, g, b] = region.avgRgb;
        return {
            name: region.name,
            avgRgb: region.avgRgb,
            lab: rgbToLab(r, g, b),
            hex: rgbToHex(r, g, b),
            boundingBox: region.boundingBox,
        };
    });

    // 4. Compute weighted average RGB across regions
    let rAvg = 0,
        gAvg = 0,
        bAvg = 0;

    for (const region of regions) {
        const w = REGION_WEIGHTS[region.name];
        rAvg += region.avgRgb[0] * w;
        gAvg += region.avgRgb[1] * w;
        bAvg += region.avgRgb[2] * w;
    }

    const averageRgb = {
        r: Math.round(rAvg),
        g: Math.round(gAvg),
        b: Math.round(bAvg),
    };

    // 5. Convert average to LAB and compute ITA°
    const averageLab = rgbToLab(averageRgb.r, averageRgb.g, averageRgb.b);
    const itaAngle = computeITA(averageLab);
    const skinToneCategory = classifySkinTone(itaAngle);
    const hexColor = rgbToHex(averageRgb.r, averageRgb.g, averageRgb.b);

    return {
        regions,
        averageRgb,
        averageLab,
        itaAngle,
        skinToneCategory,
        hexColor,
    };
}

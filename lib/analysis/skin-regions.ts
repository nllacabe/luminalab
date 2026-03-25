/**
 * Skin-region extraction from MediaPipe facial landmarks.
 *
 * Defines polygonal regions for:
 *  - Left cheek
 *  - Right cheek
 *  - Forehead
 *
 * Samples pixel data within each polygon, returning average RGB values.
 */

import type { NormalizedLandmark } from "./mediapipe";

// ── Region definitions (landmark indices from the 478-point mesh) ───────

/**
 * Landmark indices that outline each skin region polygon.
 * These are chosen to avoid the eyes, nose, mouth, and hairline,
 * targeting flat, unoccluded skin surfaces.
 */
export const SKIN_REGION_LANDMARKS = {
    leftCheek: [50, 101, 118, 117, 116, 123, 147, 213, 192, 187, 205, 36],
    rightCheek: [280, 330, 347, 346, 345, 352, 376, 433, 416, 411, 425, 266],
    forehead: [10, 338, 297, 332, 284, 251, 389, 356, 127, 162, 21, 54, 103, 67, 109],
} as const;

export type SkinRegionName = keyof typeof SKIN_REGION_LANDMARKS;

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RegionPixelData {
    name: SkinRegionName;
    avgRgb: [number, number, number];
    sampleCount: number;
    boundingBox: BoundingBox;
}

// ── Extraction ──────────────────────────────────────────────────────────────

/**
 * Extract average skin-region RGB values from face landmarks.
 *
 * 1. Draws the image onto a canvas (reuses the provided offscreen canvas).
 * 2. For each region, converts normalised landmark coordinates to pixel
 *    coordinates, builds a polygon path, and averages all interior pixels.
 */
export function extractSkinRegions(
    landmarks: NormalizedLandmark[],
    imageElement: HTMLImageElement,
    canvas: HTMLCanvasElement
): RegionPixelData[] {
    const w = imageElement.naturalWidth;
    const h = imageElement.naturalHeight;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get 2D context");

    ctx.drawImage(imageElement, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const results: RegionPixelData[] = [];

    for (const [regionName, indices] of Object.entries(SKIN_REGION_LANDMARKS)) {
        const polygon = indices.map((i) => ({
            x: Math.round(landmarks[i].x * w),
            y: Math.round(landmarks[i].y * h),
        }));

        const { avgRgb, sampleCount } = averagePixelsInPolygon(
            polygon,
            imageData,
            w
        );

        const bbox = getBBox(polygon);
        results.push({
            name: regionName as SkinRegionName,
            avgRgb,
            sampleCount,
            boundingBox: {
                x: bbox.minX,
                y: bbox.minY,
                width: bbox.maxX - bbox.minX,
                height: bbox.maxY - bbox.minY,
            },
        });
    }

    return results;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Bounding box of a polygon for scan-line limits. */
function getBBox(polygon: { x: number; y: number }[]) {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    for (const p of polygon) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
}

/** Ray-casting point-in-polygon test. */
function pointInPolygon(
    px: number,
    py: number,
    polygon: { x: number; y: number }[]
): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x,
            yi = polygon[i].y;
        const xj = polygon[j].x,
            yj = polygon[j].y;
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/** Average all pixel values within a polygon region. */
function averagePixelsInPolygon(
    polygon: { x: number; y: number }[],
    imageData: ImageData,
    width: number
): { avgRgb: [number, number, number]; sampleCount: number } {
    const { minX, minY, maxX, maxY } = getBBox(polygon);
    let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

    // Sample every 2nd pixel in dense regions for performance
    const step = maxX - minX > 100 ? 2 : 1;

    for (let y = minY; y <= maxY; y += step) {
        for (let x = minX; x <= maxX; x += step) {
            if (pointInPolygon(x, y, polygon)) {
                const idx = (y * width + x) * 4;
                rSum += imageData.data[idx];
                gSum += imageData.data[idx + 1];
                bSum += imageData.data[idx + 2];
                count++;
            }
        }
    }

    if (count === 0) {
        return { avgRgb: [0, 0, 0], sampleCount: 0 };
    }

    return {
        avgRgb: [
            Math.round(rSum / count),
            Math.round(gSum / count),
            Math.round(bSum / count),
        ],
        sampleCount: count,
    };
}

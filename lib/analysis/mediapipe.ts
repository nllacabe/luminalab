/**
 * MediaPipe Face Landmarker — singleton initialiser & face detection.
 *
 * Loads the FaceLandmarker model from the Google CDN on first use and
 * caches the instance for subsequent calls.  Runs entirely client-side
 * via WASM (CPU delegate).
 */

import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

// ── Singleton ───────────────────────────────────────────────────────────────

let faceLandmarker: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const WASM_CDN =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

/**
 * Returns the shared FaceLandmarker instance, creating it on first call.
 * The model is downloaded from the Google CDN (~4 MB).
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker> {
    if (faceLandmarker) return faceLandmarker;

    if (!initPromise) {
        initPromise = (async () => {
            const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

            const instance = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: MODEL_URL,
                    delegate: "CPU",
                },
                runningMode: "IMAGE",
                numFaces: 2,
                outputFacialTransformationMatrixes: false,
                outputFaceBlendshapes: false,
            });

            faceLandmarker = instance;
            return instance;
        })();
    }

    return initPromise;
}

// ── Detection ───────────────────────────────────────────────────────────────

export interface NormalizedLandmark {
    x: number; // 0 – 1 (relative to image width)
    y: number; // 0 – 1 (relative to image height)
    z: number;
}

/**
 * Detect face landmarks in a static image.
 *
 * The image must be fully loaded and have non-zero dimensions.
 * If passing an HTMLImageElement, ensure `img.complete === true`
 * and `img.naturalWidth > 0` before calling.
 *
 * @returns The full `FaceLandmarkerResult`, or `null` if no face was found.
 */
export async function detectFace(
    image: HTMLImageElement | HTMLCanvasElement
): Promise<FaceLandmarkerResult | null> {
    // Ensure image is actually loaded and has pixels
    if (image instanceof HTMLImageElement) {
        if (!image.complete || image.naturalWidth === 0) {
            throw new Error("Image is not fully loaded yet.");
        }
    }

    const landmarker = await getFaceLandmarker();

    const result = landmarker.detect(image);

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        return null;
    }

    return result;
}

export type { FaceLandmarkerResult };

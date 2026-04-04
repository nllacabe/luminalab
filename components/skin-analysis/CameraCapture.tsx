"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCcw, Zap, ZapOff } from "lucide-react";
import { detectFace } from "@/lib/analysis/mediapipe";

type LightingLevel = "too-dark" | "moderate" | "good" | "too-bright";

interface LightingInfo {
    level: LightingLevel;
    brightness: number;
    label: string;
    hint: string;
    color: string;
}

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

function classifyLighting(brightness: number): LightingInfo {
    if (brightness < 80) {
        return {
            level: "too-dark",
            brightness,
            label: "Too Dark",
            hint: "Move to a brighter area or turn on more lights",
            color: "#d94f4f",
        };
    }
    if (brightness < 150) {
        return {
            level: "moderate",
            brightness,
            label: "Moderate Lighting",
            hint: "Try facing a window for more even lighting",
            color: "#d4a24e",
        };
    }
    if (brightness <= 210) {
        return {
            level: "good",
            brightness,
            label: "Good Lighting",
            hint: "Great lighting! Your photo will be accurate",
            color: "#4a9e6e",
        };
    }
    return {
        level: "too-bright",
        brightness,
        label: "Too Bright",
        hint: "Too much light — try dimming or moving away from direct sunlight",
        color: "#d94f4f",
    };
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [lighting, setLighting] = useState<LightingInfo | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [faceCount, setFaceCount] = useState<number | null>(null);

    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [hasFlash, setHasFlash] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);

    // ── Start camera ────────────────────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;

        async function startCamera() {
            // Stop previous stream if restarting due to facingMode change
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                setCameraReady(false);
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = stream;

                // Check for torch capability
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
                if (capabilities && (capabilities as any).torch) {
                    setHasFlash(true);
                } else {
                    setHasFlash(false);
                    setFlashEnabled(false);
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setCameraReady(true);
                }
            } catch {
                if (!cancelled) {
                    setCameraError(
                        "Could not access the camera. Please allow camera permissions and try again."
                    );
                }
            }
        }

        startCamera();

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
            setCameraReady(false);
            setFlashEnabled(false);
        };
    }, [facingMode]);

    const toggleCamera = useCallback(() => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    }, []);

    const toggleFlash = useCallback(async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                advanced: [{ torch: !flashEnabled } as any]
            });
            setFlashEnabled(!flashEnabled);
        } catch (err) {
            console.error("Failed to toggle flash", err);
        }
    }, [flashEnabled]);

    // ── Lighting analysis loop ──────────────────────────────────────────────

    useEffect(() => {
        if (!cameraReady) return;

        let isAnalyzing = false;
        async function analyzeFrame() {
            if (isAnalyzing) return;
            isAnalyzing = true;

            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas || video.videoWidth === 0) return;

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) return;

                // Sample at a smaller resolution for performance
                // Increased to 320x240 to support face detection
                const sampleW = 320;
                const sampleH = 240;
                canvas.width = sampleW;
                canvas.height = sampleH;
                ctx.drawImage(video, 0, 0, sampleW, sampleH);

                const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
                const data = imageData.data;

                let totalBrightness = 0;
                const pixelCount = data.length / 4;

                for (let i = 0; i < data.length; i += 4) {
                    // Perceived brightness (ITU-R BT.601)
                    totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                }

                const avgBrightness = totalBrightness / pixelCount;
                setLighting(classifyLighting(avgBrightness));

                const detection = await detectFace(canvas);
                setFaceCount(detection ? detection.faceLandmarks.length : 0);
            } catch (err) {
                console.error("Frame analysis error:", err);
            } finally {
                isAnalyzing = false;
            }
        }

        // Run immediately, then every 500ms
        analyzeFrame();
        intervalRef.current = setInterval(analyzeFrame, 500);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [cameraReady]);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const stopCamera = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror horizontally so the captured image matches the mirrored preview
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    stopCamera();
                    onCapture(file);
                }
            },
            "image/jpeg",
            0.92
        );
    }, [onCapture, stopCamera, facingMode]);

    const handleCancel = useCallback(() => {
        stopCamera();
        onCancel();
    }, [onCancel, stopCamera]);

    // ── Render ───────────────────────────────────────────────────────────────

    if (cameraError) {
        return (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚫</div>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Camera Unavailable</p>
                <p
                    style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                        marginBottom: "1.5rem",
                        maxWidth: "360px",
                        margin: "0 auto 1.5rem",
                    }}
                >
                    {cameraError}
                </p>
                <button className="btn btn-pink" onClick={handleCancel} style={{ borderRadius: "999px" }}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Viewfinder */}
            <div className="camera-viewfinder" style={{ position: "relative" }}>
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                        width: "100%",
                        borderRadius: "calc(var(--radius) + 0.125rem)",
                        display: cameraReady ? "block" : "none",
                        transform: facingMode === "user" ? "scaleX(-1)" : "none",
                    }}
                />

                {cameraReady && (
                    <div style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", gap: "0.5rem", zIndex: 10 }}>
                        {hasFlash && (
                            <button
                                onClick={toggleFlash}
                                style={{
                                    background: "rgba(0,0,0,0.5)",
                                    color: flashEnabled ? "#fbbf24" : "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "44px",
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                {flashEnabled ? <Zap size={20} /> : <ZapOff size={20} />}
                            </button>
                        )}
                        <button
                            onClick={toggleCamera}
                            style={{
                                background: "rgba(0,0,0,0.5)",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <RefreshCcw size={20} />
                        </button>
                    </div>
                )}

                {!cameraReady && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "300px",
                            gap: "1rem",
                            color: "var(--muted-foreground)",
                        }}
                    >
                        <span className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
                        <p style={{ fontSize: "0.875rem" }}>Starting camera…</p>
                    </div>
                )}
            </div>

            {/* Hidden canvas for brightness sampling */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Context Indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Lighting indicator */}
                {lighting && (
                    <div
                        className="lighting-indicator animate-fade-in"
                        style={{
                            borderColor: `color-mix(in srgb, ${lighting.color} 30%, transparent)`,
                            background: `color-mix(in srgb, ${lighting.color} 8%, var(--card))`,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                                className="lighting-dot"
                                style={{ background: lighting.color }}
                            />
                            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                {lighting.label}
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--muted-foreground)",
                                margin: 0,
                            }}
                        >
                            {lighting.hint}
                        </p>
                    </div>
                )}
                
                {/* Face count indicator */}
                {faceCount !== null && faceCount !== 1 && (
                    <div
                        className="lighting-indicator animate-fade-in"
                        style={{
                            borderColor: `color-mix(in srgb, #d94f4f 30%, transparent)`,
                            background: `color-mix(in srgb, #d94f4f 8%, var(--card))`,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                                className="lighting-dot"
                                style={{ background: "#d94f4f" }}
                            />
                            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                {faceCount === 0 ? "No Face Detected" : "Multiple Faces Detected"}
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--muted-foreground)",
                                margin: 0,
                            }}
                        >
                            {faceCount === 0 ? "Please make sure your face is in the frame." : "Please make sure only one person is in the frame."}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            {cameraReady && (
                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "center",
                    }}
                >
                    <button
                        className="btn btn-primary"
                        onClick={capturePhoto}
                        disabled={
                            lighting?.level === "too-dark" ||
                            lighting?.level === "too-bright" ||
                            faceCount !== 1
                        }
                        style={{ minWidth: "160px", borderRadius: "999px" }}
                    >
                        Take Picture
                    </button>
                    <button className="btn btn-pink" onClick={handleCancel} style={{ borderRadius: "999px" }}>
                        Cancel
                    </button>
                </div>
            )}

            {/* Lighting tips */}
            <div className="lighting-tips">
                <p style={{ fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                    💡 Tips for best results
                </p>
                <ul>
                    <li>Face a window for natural, even lighting</li>
                    <li>Avoid harsh overhead lights that create shadows</li>
                    <li>Remove glasses to prevent reflections</li>
                    <li>Keep your face centered in the frame</li>
                </ul>
            </div>
        </div>
    );
}

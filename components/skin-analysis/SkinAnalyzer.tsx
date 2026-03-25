"use client";

import { useState, useRef, useCallback } from "react";
import { analyzeSkin } from "@/lib/analysis/skin-analyzer";
import type { SkinAnalysisResult } from "@/lib/analysis/skin-analyzer";
import AnalysisResults from "./AnalysisResults";
import CameraCapture from "./CameraCapture";

type Status = "idle" | "loading-model" | "analyzing" | "done" | "error";

interface Props {
    onRecommend: (result: SkinAnalysisResult) => void;
}

export default function SkinAnalyzer({ onRecommend }: Props) {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SkinAnalysisResult | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (JPEG, PNG, etc.).");
            return;
        }
        setError(null);
        setResult(null);
        setStatus("idle");
        setShowCamera(false);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }, []);

    const onFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const onCameraCapture = useCallback(
        (file: File) => { handleFile(file); },
        [handleFile]
    );

    const runAnalysis = useCallback(async () => {
        if (!imgRef.current) return;
        try {
            setError(null);
            setResult(null);
            setStatus("loading-model");
            const analysisResult = await analyzeSkin(imgRef.current);
            setResult(analysisResult);
            setStatus("done");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setStatus("error");
        }
    }, []);

    const reset = useCallback(() => {
        setStatus("idle");
        setError(null);
        setResult(null);
        setShowCamera(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [previewUrl]);

    const isProcessing = status === "loading-model" || status === "analyzing";

    return (
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {/* Camera mode */}
            {!previewUrl && showCamera && (
                <CameraCapture
                    onCapture={onCameraCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {/* Upload area */}
            {!previewUrl && !showCamera && (
                <div style={{
                    border: "2px solid #f472b6",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(8px)",
                }}>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`upload-zone${isDragging ? " dragging" : ""}`}
                        style={{ marginBottom: "1rem" }}
                    >
                        <div className="upload-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#1f2937" }}>
                            <span className="text-pink-bold">Drag</span> or{" "}
                            <span className="text-pink-bold">Drop</span> Image to begin analyzing
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                            or{" "}
                            <span className="text-pink" style={{ cursor: "pointer", textDecoration: "underline" }}>
                                browse files
                            </span>{" "}
                            on your computer
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileChange}
                            style={{ display: "none" }}
                        />
                    </div>
                    <button
                        className="btn btn-pink btn-full"
                        onClick={(e) => { e.stopPropagation(); setShowCamera(true); }}
                        style={{ borderRadius: "999px", fontSize: "0.9375rem" }}
                    >
                        Upload from Camera instead
                    </button>
                </div>
            )}

            {/* Preview + controls */}
            {previewUrl && (
                <div>
                    <div style={{
                        border: "2px solid #f472b6",
                        borderRadius: "16px",
                        padding: "0.75rem",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                    }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={previewUrl}
                            alt="Uploaded face photo"
                            style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "12px", objectFit: "contain" }}
                            crossOrigin="anonymous"
                        />
                        <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "center" }}>
                            {status !== "done" && (
                                <button
                                    className="btn btn-primary"
                                    onClick={runAnalysis}
                                    disabled={isProcessing}
                                    style={{ minWidth: "160px", borderRadius: "999px" }}
                                >
                                    {isProcessing ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                                            <Spinner />
                                            {status === "loading-model" ? "Loading model…" : "Analyzing…"}
                                        </span>
                                    ) : "Analyze Skin Tone"}
                                </button>
                            )}
                            <button
                                className="btn btn-pink"
                                onClick={reset}
                                disabled={isProcessing}
                                style={{ borderRadius: "999px" }}
                            >
                                {status === "done" ? "Upload New Photo" : "Remove"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message" style={{ marginTop: "1rem" }}>{error}</div>
                    )}

                    {result && previewUrl && (
                        <AnalysisResults
                            result={result}
                            imageUrl={previewUrl}
                            onProceed={() => onRecommend(result)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function Spinner() {
    return (
        <span style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
        }} />
    );
}
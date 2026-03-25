"use client";

import { useRef, useEffect } from "react";
import { skinToneLabel } from "@/lib/analysis/color-science";
import type { SkinAnalysisResult } from "@/lib/analysis/skin-analyzer";

const REGION_LABELS: Record<string, string> = {
    leftCheek: "Left Cheek",
    rightCheek: "Right Cheek",
    forehead: "Forehead",
};

export default function AnalysisResults({
    result,
    imageUrl,
    onProceed,
}: {
    result: SkinAnalysisResult;
    imageUrl: string;
    onProceed?: () => void;
}) {
    return (
        <div className="animate-fade-in" style={{ marginTop: "2rem" }}>
            {/* ── Main layout: images left, profile right ───────────────── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                }}
            >
                {/* Left: image grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gridTemplateRows: "1fr 1fr",
                        gap: "0.75rem",
                    }}
                >
                    {/* Original photo — spans left column */}
                    <div
                        style={{
                            gridRow: "1 / 3",
                            border: "2px solid #f472b6",
                            borderRadius: "12px",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="Uploaded face"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                bottom: "0.5rem",
                                left: "0.5rem",
                                background: "rgba(244, 114, 182, 0.85)",
                                color: "#fff",
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "6px",
                            }}
                        >
                            Original
                        </div>
                    </div>

                    {/* Region crop images */}
                    {result.regions.slice(0, 2).map((region) => (
                        <RegionCrop
                            key={region.name}
                            imageUrl={imageUrl}
                            boundingBox={region.boundingBox}
                            label={REGION_LABELS[region.name] ?? region.name}
                            hex={region.hex}
                        />
                    ))}
                </div>

                {/* Right: skin profile panel */}
                <div
                    style={{
                        border: "2px solid #f472b6",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1.25rem",
                    }}
                >
                    <h2
                        style={{
                            fontWeight: 800,
                            fontSize: "1.25rem",
                            color: "#ec4899",
                            fontStyle: "italic",
                            margin: 0,
                        }}
                    >
                        Your skin profile
                    </h2>

                    {/* ITA° category */}
                    <div style={{ textAlign: "center", width: "100%" }}>
                        <h3
                            style={{
                                fontWeight: 700,
                                fontSize: "1.125rem",
                                color: "#1f2937",
                                margin: "0 0 0.25rem 0",
                            }}
                        >
                            ITA° Category
                        </h3>
                        <p
                            style={{
                                fontSize: "0.9375rem",
                                color: "#6b7280",
                                margin: "0 0 0.75rem 0",
                            }}
                        >
                            {skinToneLabel(result.skinToneCategory)}
                        </p>

                        {/* Large color swatch */}
                        <div
                            style={{
                                width: "100%",
                                height: "64px",
                                borderRadius: "10px",
                                backgroundColor: result.hexColor,
                                border: "2px solid #f9a8d4",
                                boxShadow: `0 4px 20px ${result.hexColor}33`,
                            }}
                        />
                    </div>

                    {/* CIELAB values */}
                    <div style={{ textAlign: "center", width: "100%" }}>
                        <h3
                            style={{
                                fontWeight: 700,
                                fontSize: "1.125rem",
                                color: "#1f2937",
                                margin: "0 0 0.75rem 0",
                            }}
                        >
                            CIELAB Values
                        </h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "0.625rem",
                            }}
                        >
                            <LabValueBox label="L" value={result.averageLab.L.toFixed(2)} />
                            <LabValueBox label="a" value={result.averageLab.a.toFixed(2)} />
                            <LabValueBox label="b" value={result.averageLab.b.toFixed(2)} />
                        </div>
                    </div>

                    {/* ITA° angle value */}
                    <div
                        style={{
                            textAlign: "center",
                            padding: "0.5rem 1rem",
                            background: "#fdf2f8",
                            borderRadius: "8px",
                            width: "100%",
                        }}
                    >
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            ITA° Angle
                        </span>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ec4899", fontFamily: "monospace" }}>
                            {result.itaAngle.toFixed(2)}°
                        </div>
                    </div>

                    {/* Proceed button */}
                    <button
                        onClick={onProceed}
                        style={{
                            width: "100%",
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, #fde68a, #fbbf24)",
                            border: "none",
                            borderRadius: "999px",
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            fontStyle: "italic",
                            color: "#1f2937",
                            cursor: "pointer",
                            transition: "transform 0.15s, box-shadow 0.15s",
                            boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(251, 191, 36, 0.3)";
                        }}
                    >
                        Proceed to recommendations
                    </button>
                </div>
            </div>

            {/* ── Per-region breakdown row ───────────────────────────────── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.75rem",
                    marginTop: "1rem",
                }}
            >
                {result.regions.map((region) => (
                    <div
                        key={region.name}
                        style={{
                            border: "2px solid #f472b6",
                            borderRadius: "12px",
                            padding: "1rem",
                            background: "#fff",
                            textAlign: "center",
                        }}
                    >
                        {/* Region swatch */}
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                backgroundColor: region.hex,
                                border: "2px solid #f9a8d4",
                                margin: "0 auto 0.5rem auto",
                            }}
                        />
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1f2937", marginBottom: "0.25rem" }}>
                            {REGION_LABELS[region.name] ?? region.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                            {region.hex}
                        </div>

                        {/* Region LAB values */}
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "center" }}>
                            <MiniLabBox label="L" value={region.lab.L.toFixed(1)} />
                            <MiniLabBox label="a" value={region.lab.a.toFixed(1)} />
                            <MiniLabBox label="b" value={region.lab.b.toFixed(1)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Region crop component ───────────────────────────────────────────────────

function RegionCrop({
    imageUrl,
    boundingBox,
    label,
    hex,
}: {
    imageUrl: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    label: string;
    hex: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Add padding around the bounding box for context
            const pad = Math.max(boundingBox.width, boundingBox.height) * 0.3;
            const sx = Math.max(0, boundingBox.x - pad);
            const sy = Math.max(0, boundingBox.y - pad);
            const sw = Math.min(img.naturalWidth - sx, boundingBox.width + pad * 2);
            const sh = Math.min(img.naturalHeight - sy, boundingBox.height + pad * 2);

            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 300, 300);
        };
        img.src = imageUrl;
    }, [imageUrl, boundingBox]);

    return (
        <div
            style={{
                border: "2px solid #f472b6",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(1)" }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "0.375rem",
                    left: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                }}
            >
                <div
                    style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "3px",
                        backgroundColor: hex,
                        border: "1px solid rgba(255,255,255,0.6)",
                    }}
                />
                <span
                    style={{
                        background: "rgba(244, 114, 182, 0.85)",
                        color: "#fff",
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "5px",
                    }}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}

// ── CIELAB value box ────────────────────────────────────────────────────────

function LabValueBox({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                border: "2px solid #f9a8d4",
                borderRadius: "10px",
                padding: "0.625rem 0.5rem",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontSize: "0.6875rem",
                    color: "#9ca3af",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    marginBottom: "0.25rem",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    color: "#ec4899",
                    fontFamily: "monospace",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function MiniLabBox({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                border: "1.5px solid #f9a8d4",
                borderRadius: "6px",
                padding: "0.25rem 0.5rem",
                textAlign: "center",
                minWidth: "48px",
            }}
        >
            <div style={{ fontSize: "0.5625rem", color: "#9ca3af", fontWeight: 600 }}>
                {label}
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ec4899", fontFamily: "monospace" }}>
                {value}
            </div>
        </div>
    );
}

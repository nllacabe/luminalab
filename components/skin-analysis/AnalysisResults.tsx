"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { skinToneLabel } from "@/lib/analysis/color-science";
import type { SkinAnalysisResult } from "@/lib/analysis/skin-analyzer";
import { Bold } from "lucide-react";

const REGION_LABELS: Record<string, string> = {
    leftCheek: "Left Cheek",
    rightCheek: "Right Cheek",
    forehead: "Forehead",
};

export default function AnalysisResults({
    result,
    imageUrl,
    onProceed,
    onUploadNew,
}: {
    result: SkinAnalysisResult;
    imageUrl: string;
    onProceed?: () => void;
    onUploadNew?: () => void;
}) {
    return (
        <div className="animate-fade-in" style={{ marginTop: "2rem" }}>
            <style>{`
                .analysis-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                .analysis-image-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 1fr 1fr;
                    gap: 0.75rem;
                }
                .analysis-region-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                }
                .analysis-profile-panel {
                    border: 2px solid #f472b6;
                    border-radius: 12px;
                    padding: 1.5rem;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .analysis-profile-mobile {
                    display: none;
                }
                .mini-lab-row {
                    display: flex;
                    gap: 0.375rem;
                    justify-content: center;
                }

                @media (max-width: 640px) {
                    .analysis-main-grid {
                        grid-template-columns: 1fr;
                    }
                    .analysis-profile-panel {
                        display: none !important;
                    }
                    .analysis-profile-mobile {
                        display: flex;
                        flex-direction: column;
                        border: 2px solid #f472b6;
                        border-radius: 12px;
                        padding: 1.5rem;
                        background: #fff;
                        gap: 1rem;
                        align-items: center;
                    }
                    .analysis-region-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .mini-lab-row {
                        flex-direction: column;
                        align-items: center;
                        gap: 0.25rem;
                    }
                }
            `}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                {/* Block 1 — MediaPipe image results + skin profile (desktop: side by side) */}
                <div className="analysis-main-grid">
                    <div className="analysis-image-grid" style={{ gap: "0.2rem" }}>
                        {/* Original photo — spans left column */}
                        <div style={{
                            gridRow: "1 / 3",
                            border: "2px solid #f472b6",
                            borderRadius: "12px",
                            overflow: "hidden",
                            position: "relative",
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Uploaded face"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div style={{
                                position: "absolute",
                                bottom: "0.5rem",
                                left: "0.5rem",
                                background: "rgba(244, 114, 182, 0.85)",
                                color: "#fff",
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "6px",
                            }}>
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

                    {/* Skin profile — desktop: right column */}
                    <div className="analysis-profile-panel">
                        <ProfileContent result={result} />
                    </div>
                </div>

                {/* Block 2 — Skin profile (mobile only) */}
                <div className="analysis-profile-mobile">
                    <ProfileContent result={result} />
                </div>

                {/* Block 3 — Per-region LAB breakdown */}
                <div className="analysis-region-grid" style={{ gap: "0.2rem" }}>
                    {result.regions.map((region) => (
                        <div
                            key={region.name}
                            style={{
                                border: "2px solid #f472b6",
                                borderRadius: "12px",
                                padding: "1rem 0.75rem",
                                background: "#fff",
                                textAlign: "center",
                            }}
                        >
                            <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                backgroundColor: region.hex,
                                border: "2px solid #f9a8d4",
                                margin: "0 auto 0.5rem auto",
                            }} />
                            <div style={{
                                fontWeight: 600,
                                fontSize: "0.8125rem",
                                color: "#1f2937",
                                marginBottom: "0.2rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}>
                                {REGION_LABELS[region.name] ?? region.name}
                            </div>
                            <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                                {region.hex}
                            </div>
                            <div className="mini-lab-row">
                                <MiniLabBox label="L" value={region.lab.L.toFixed(1)} />
                                <MiniLabBox label="a" value={region.lab.a.toFixed(1)} />
                                <MiniLabBox label="b" value={region.lab.b.toFixed(1)} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Block 4 — Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <button
                        onClick={onProceed}
                        className="btn btn-primary"
                        style={{
                            width: "100%",
                            padding: "0.875rem 1.5rem",
                            borderRadius: "10px",
                            fontSize: "0.9375rem",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Proceed to recommendations
                    </button>
                    <button
                        onClick={onUploadNew}
                        className="btn btn-secondary"
                        style={{
                            width: "100%",
                            padding: "0.875rem 1.5rem",
                            borderRadius: "10px",
                            fontSize: "0.9375rem",
                            letterSpacing: "0.02em",
                            backgroundColor: "transparent",
                            background: "rgba(255, 255, 255, 0.1)", // translucent
                            backdropFilter: "blur(10px)", // blur behind
                            WebkitBackdropFilter: "blur(10px)", // for Safari
                            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // soft shadow
                        }}
                    >
                        Upload new photo
                    </button>
                </div>

            </div>
        </div>
    );
}

// ── Shared profile content ──────────────────────────────────────────────────

function ProfileContent({ result }: { result: SkinAnalysisResult }) {
    const [showLabInfo, setShowLabInfo] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Derive undertone from CIELAB hue angle
    const getUndertone = (a: number, b: number) => {
        const hueAngle = (Math.atan2(b, a) * 180) / Math.PI;
        if (hueAngle < 58) return "cool";
        if (hueAngle > 66) return "warm";
        return "neutral";
    };

    const toneLabel = skinToneLabel(result.skinToneCategory).toLowerCase();
    const undertoneLabel = getUndertone(result.averageLab.a, result.averageLab.b);

    return (
        <>
            <h2 style={{
                fontWeight: 800,
                fontSize: "1.25rem",
                color: "#ec4899",
                fontStyle: "italic",
                margin: 0,
            }}>
                Your skin profile
            </h2>

            {/* ITA° category */}
            <div style={{ textAlign: "center", width: "100%", marginBottom: "0.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#1f2937", margin: "0 0 0.25rem 0" }}>
                    ITA° Category
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#6b7280", margin: "0 0 0.5rem 0" }}>
                    {skinToneLabel(result.skinToneCategory)}
                </p>
                <div style={{
                    width: "100%",
                    height: "64px",
                    borderRadius: "10px",
                    backgroundColor: result.hexColor,
                    border: "2px solid #f9a8d4",
                    boxShadow: `0 4px 20px ${result.hexColor}33`,
                }} />
            </div>

            {/* CIELAB values */}
            <div style={{ textAlign: "center", width: "100%", marginBottom: "0.5rem" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#1f2937", margin: "0 0 0.25rem 0" }}>
                        CIELAB Values
                    </h3>
                    <button
                        onClick={() => setShowLabInfo(true)}
                        style={{
                            background: "none", border: "none", color: "#ec4899",
                            textDecoration: "underline", fontWeight: "bold it", fontStyle: "italic", fontSize: "0.8125rem",
                            cursor: "pointer", padding: 0
                        }}
                    >
                        What does this mean?
                    </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <LabValueBox label="L" value={result.averageLab.L.toFixed(2)} />
                    <LabValueBox label="a" value={result.averageLab.a.toFixed(2)} />
                    <LabValueBox label="b" value={result.averageLab.b.toFixed(2)} />
                </div>
            </div>

            {showLabInfo && mounted && createPortal(
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "1rem",
                }} onClick={() => setShowLabInfo(false)}>
                    <div className="animate-fade-in" style={{
                        fontSize: "0.875rem",
                        color: "#4b5563",
                        textAlign: "left",
                        background: "#fff",
                        padding: "1.5rem",
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        maxWidth: "400px",
                        width: "100%",
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h4 style={{ margin: 0, color: "#1f2937", fontSize: "1.25rem", fontWeight: 800 }}>CIELAB Color Space</h4>
                            <button onClick={() => setShowLabInfo(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <p style={{ margin: 0, color: "#374151" }}>
                                <strong>Why we use this:</strong> CIELAB mathematically maps human color perception. By capturing your precise a* and b* coordinates, we can calculate your exact undertone and find makeup shades that harmonize with your skin perfectly.
                            </p>
                        </div>

                        <div style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                            {/* <h5 style={{ margin: "0 0 0.5rem 0", color: "#1f2937", fontSize: "0.9375rem" }}>Value Breakdown</h5> */}
                            <p style={{ margin: "0 0 0.375rem 0" }}><strong>L (Lightness):</strong> 0 (black) to 100 (white)</p>
                            <p style={{ margin: "0 0 0.375rem 0" }}><strong>a (Green-Red):</strong> Negative is cooler/green, positive is warmer/red</p>
                            <p style={{ margin: 0 }}><strong>b (Blue-Yellow):</strong> Negative is cooler/blue, positive is warmer/yellow</p>
                        </div>

                        <div
                            style={{
                                margin: 0,
                                paddingTop: "1rem",
                                borderTop: "1px solid #e5e7eb",
                                fontSize: "0.9375rem"
                            }}
                        >
                            <span style={{ color: "#ec4899", fontWeight: "bold" }}>
                                Interpretation:
                            </span>{" "}
                            <span style={{ color: "#374151" }}>
                                Your values suggest a {toneLabel} tone with {undertoneLabel} undertones.
                            </span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ITA° angle */}
            <div style={{
                textAlign: "center",
                padding: "0.5rem 1rem",
                background: "#fdf2f8",
                borderRadius: "8px",
                width: "100%",
                boxSizing: "border-box",
            }}>
                <span style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                }}>
                    ITA° Angle
                </span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ec4899", fontFamily: "monospace" }}>
                    {result.itaAngle.toFixed(2)}°
                </div>
            </div>
        </>
    );
}

// ── Region crop component ───────────────────────────────────────────────────

function RegionCrop({
    imageUrl, boundingBox, label, hex,
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
        <div style={{ border: "2px solid #f472b6", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(1)" }}
            />
            <div style={{
                position: "absolute", bottom: "0.375rem", left: "0.375rem",
                display: "flex", alignItems: "center", gap: "0.375rem",
            }}>
                <div style={{
                    width: "14px", height: "14px", borderRadius: "3px",
                    backgroundColor: hex, border: "1px solid rgba(255,255,255,0.6)",
                }} />
                <span style={{
                    background: "rgba(244, 114, 182, 0.85)", color: "#fff",
                    fontSize: "0.625rem", fontWeight: 600,
                    padding: "0.15rem 0.4rem", borderRadius: "5px",
                }}>
                    {label}
                </span>
            </div>
        </div>
    );
}

// ── CIELAB value box ────────────────────────────────────────────────────────

function LabValueBox({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ border: "2px solid #f9a8d4", borderRadius: "10px", padding: "0.625rem 0.5rem", textAlign: "center" }}>
            <div style={{
                fontSize: "0.6875rem", color: "#9ca3af", fontWeight: 600,
                textTransform: "uppercase", marginBottom: "0.25rem",
            }}>
                {label}
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "#ec4899", fontFamily: "monospace" }}>
                {value}
            </div>
        </div>
    );
}

function MiniLabBox({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            border: "1.5px solid #f9a8d4",
            borderRadius: "6px",
            padding: "0.25rem 0.4rem",
            textAlign: "center",
            width: "100%",
            boxSizing: "border-box",
        }}>
            <div style={{ fontSize: "0.5625rem", color: "#9ca3af", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ec4899", fontFamily: "monospace" }}>{value}</div>
        </div>
    );
}
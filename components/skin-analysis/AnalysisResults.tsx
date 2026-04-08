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
                    background: rgba(255, 255, 255, 0.50);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
                    background: rgba(255, 255, 255, 0.50);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
                        background: rgba(255, 255, 255, 0.50);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
                        background: rgba(255, 255, 255, 0.50);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
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

    const itaCategories = [
        { label: "Very Light", range: "> 55°" },
        { label: "Light", range: "41° to 55°" },
        { label: "Intermediate", range: "28° to 41°" },
        { label: "Tan", range: "10° to 28°" },
        { label: "Brown", range: "-30° to 10°" },
        { label: "Dark", range: "< -30°" }
    ];

    return (
        <>
            <h2 style={{
                fontWeight: 800,
                fontFamily: "var(--font-instrument-serif), serif",
                fontSize: "1.75rem",
                color: "#ec4899",
                fontStyle: "italic",
                margin: 0,
            }}>
                Your skin profile
            </h2>

            {/* ITA° category & Swatch */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginBottom: "1rem" }}>
                <div style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: result.hexColor,
                    border: "2px solid #f9a8d4",
                    boxShadow: `0 4px 20px ${result.hexColor}33`,
                    marginBottom: "0.625rem",
                }} />
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "#ec4899", lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {skinToneLabel(result.skinToneCategory)}
                </span>
            </div>

            {/* ITA° Angle visual scale */}
            <div style={{ width: "100%", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Tone Spectrum</span>
                    <span style={{ fontSize: "0.875rem", color: "#ec4899", fontWeight: 700, fontFamily: "monospace" }}>ITA° {result.itaAngle.toFixed(2)}°</span>
                </div>

                <div style={{ position: "relative", width: "100%", height: "12px", borderRadius: "6px", display: "flex", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    {itaCategories.map((cat) => {
                        let bg = "#fff";
                        let w = 10;
                        if (cat.label === "Very Light") { bg = "#fef3e7"; w = (15 / 120) * 100; }
                        else if (cat.label === "Light") { bg = "#f8d5b8"; w = (14 / 120) * 100; }
                        else if (cat.label === "Intermediate") { bg = "#dfa373"; w = (13 / 120) * 100; }
                        else if (cat.label === "Tan") { bg = "#bc7747"; w = (18 / 120) * 100; }
                        else if (cat.label === "Brown") { bg = "#8b4f2c"; w = (40 / 120) * 100; }
                        else if (cat.label === "Dark") { bg = "#472413"; w = (20 / 120) * 100; }
                        return <div key={cat.label} style={{ width: `${w}%`, height: "100%", backgroundColor: bg }} title={cat.label} />;
                    })}
                    <div style={{
                        position: "absolute", top: -1, bottom: -1, width: "4px", backgroundColor: "#ec4899",
                        borderRadius: "2px", left: `calc(${Math.min(100, Math.max(0, ((70 - result.itaAngle) / 120) * 100))}% - 2px)`,
                        boxShadow: "0 0 0 2px #fff"
                    }} />
                </div>
            </div>

            {/* CIELAB values */}
            <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "0.65rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Color Values
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem" }}>
                    <LabValueBox label="L" value={result.averageLab.L.toFixed(2)} axisColor="linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)" />
                    <LabValueBox label="a" value={result.averageLab.a.toFixed(2)} axisColor="linear-gradient(135deg, #10b981 0%, #ef4444 100%)" />
                    <LabValueBox label="b" value={result.averageLab.b.toFixed(2)} axisColor="linear-gradient(135deg, #3b82f6 0%, #eab308 100%)" />
                </div>
            </div>

            {/* What does this mean? */}
            <div style={{ textAlign: "center", width: "100%", marginTop: "0.25rem" }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowLabInfo(true)}
                    style={{
                        background: "transparent",
                        border: "1.5px solid #ec4899",
                        color: "#ec4899",
                        borderRadius: "9999px",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        padding: "0.5rem 1.25rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    What does this mean?
                </button>
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
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        maxWidth: "400px",
                        width: "100%",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "1.5rem", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h4 style={{ margin: 0, color: "#1f2937", fontSize: "1.25rem", fontWeight: 700 }}>Profile Explained</h4>
                                <button onClick={() => setShowLabInfo(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>&times;</button>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <p style={{ margin: 0, color: "#4b5563", fontSize: "0.875rem" }}>
                                    <strong>ITA° Category: </strong>The Individual Typology Angle (ITA°) measures the relationship between skin lightness and undertone.
                                </p>
                                <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    {itaCategories.map(cat => {
                                        const isMatch = cat.label.toLowerCase() === toneLabel;
                                        return (
                                            <div key={cat.label} style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "0.375rem 0.5rem",
                                                borderRadius: "6px",
                                                background: isMatch ? "#fdf2f8" : "transparent",
                                                border: isMatch ? "1px solid #f9a8d4" : "1px solid transparent",
                                                fontWeight: isMatch ? 700 : 400,
                                                color: isMatch ? "#ec4899" : "#4b5563",
                                            }}>
                                                <span>{cat.label}</span>
                                                <span>{cat.range}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                                <p style={{ margin: 0, color: "#4b5563", fontSize: "0.875rem" }}>
                                    <strong>ITA° Angle: </strong>Your specific angle is <strong>{result.itaAngle.toFixed(2)}°</strong>, which places you in the <span style={{ color: "#ec4899", fontWeight: 600 }}>{skinToneLabel(result.skinToneCategory)}</span> category.
                                </p>
                            </div>

                            <div style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                                <p style={{ margin: "0 0 0.5rem 0" }}>
                                    <strong>Why we use CIELAB: </strong>CIELAB mathematically maps human color perception. Using your precise L*, a*, and b* values, we can determine your skin tone and match you with harmonizing makeup shades.
                                </p>
                                <p style={{ margin: "0 0 0.25rem 0" }}><strong>L (Lightness):</strong> 0 (black) to 100 (white)</p>
                                <p style={{ margin: "0 0 0.25rem 0" }}><strong>a (Green-Red):</strong> Negative is cooler/green, positive is warmer/red</p>
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
                                    Your ITA° relates to a {toneLabel} tone, and your specific a* and b* values indicate {undertoneLabel} undertones.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
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

function LabValueBox({ label, value, axisColor }: { label: string; value: string; axisColor?: string }) {
    return (
        <div style={{ border: "1.5px solid #f9a8d4", borderRadius: "10px", padding: "0.625rem 0.5rem", textAlign: "center", background: "#fff" }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginBottom: "0.25rem"
            }}>
                {axisColor && <div style={{ width: "10px", height: "10px", borderRadius: "5px", background: axisColor, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />}
                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 700 }}>
                    {label}
                </span>
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ec4899", fontFamily: "monospace" }}>
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
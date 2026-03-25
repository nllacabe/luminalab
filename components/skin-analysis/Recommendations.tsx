"use client";

import { useState, useEffect } from "react";
import type { ProductMatch } from "@/lib/recommendations/product-matcher";
import { getRecommendations, loadProductsCsv } from "@/lib/recommendations/product-matcher";
import { getProductsCsv } from "@/lib/recommendations/actions";
import { getOwnedProductKeys } from "@/lib/products/actions";
import { getUserPreferences } from "@/app/survey/actions";
import { OCCASIONS, OCCASION_INTENT_MAP } from "@/lib/recommendations/occasion-config";
import type { OccasionKey } from "@/lib/recommendations/occasion-config";
import type { LabColor } from "@/lib/analysis/color-science";

interface RecommendationsProps {
    userLab: LabColor;
    onBack: () => void;
}

export default function Recommendations({ userLab, onBack }: RecommendationsProps) {
    const [matches, setMatches] = useState<ProductMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [occasion, setOccasion] = useState<OccasionKey>("everyday");
    const [showOccasionPicker, setShowOccasionPicker] = useState(false);
    const [csvLoaded, setCsvLoaded] = useState(false);
    const [ownedSet, setOwnedSet] = useState<Set<string>>(new Set());
    const [productTypes, setProductTypes] = useState<string[]>([]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const [csvText, ownedKeys, prefs] = await Promise.all([
                    getProductsCsv(),
                    getOwnedProductKeys().catch(() => [] as string[]),
                    getUserPreferences().catch(() => null),
                ]);
                loadProductsCsv(csvText);
                setCsvLoaded(true);

                const owned = new Set(ownedKeys);
                setOwnedSet(owned);

                const savedOccasion = (prefs?.occasion ?? "everyday") as OccasionKey;
                const savedTypes = prefs?.product_types ?? [];
                setOccasion(savedOccasion);
                setProductTypes(savedTypes);

                applyRecommendations(savedOccasion, owned, savedTypes);
            } catch (err) {
                console.error("Failed to load products:", err);
                setLoading(false);
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLab]);

    function applyRecommendations(occ: OccasionKey, owned: Set<string>, types: string[]) {
        setLoading(true);
        try {
            const results = getRecommendations(userLab, 20, occ, types);
            const filtered = results.filter((p) => {
                const key = `${p.brandName.toLowerCase()}|${p.shadeName.toLowerCase()}|${p.hexColor.toLowerCase()}`;
                return !owned.has(key);
            });
            setMatches(filtered.slice(0, 16));
        } finally {
            setLoading(false);
        }
    }

    function handleOccasionChange(key: OccasionKey) {
        setOccasion(key);
        setShowOccasionPicker(false);
        if (csvLoaded) {
            applyRecommendations(key, ownedSet, productTypes);
        }
    }

    const occasionIntent = OCCASION_INTENT_MAP[occasion];

    return (
        <div style={{
            width: "100%",
            minHeight: "100%",
            padding: "2rem 2rem 3rem",
            boxSizing: "border-box",
            position: "relative",
        }}>
            {/* Sparkles */}
            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="45%" left="1%" size={12} delay={0.6} />
            <Sparkle top="50%" right="2%" size={16} delay={0.9} />
            <Sparkle top="85%" left="4%" size={14} delay={1.2} />
            <Sparkle top="90%" right="6%" size={10} delay={0.5} />

            {/* Centered header */}
            <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative", zIndex: 1 }}>
                <h1 style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "0.75rem",
                }}>
                    Your personalized matches!
                </h1>

                {/* Occasion badge */}
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255,255,255,0.85)",
                    border: "1.5px solid #f9a8d4",
                    borderRadius: "999px",
                    padding: "0.4rem 1.1rem",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 8px rgba(244,114,182,0.12)",
                    marginBottom: "0.5rem",
                }}>
                    <span style={{ fontSize: "1rem" }}>{occasionIntent.icon}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#be185d" }}>
                        {occasionIntent.label}
                    </span>
                </div>

                <div>
                    <button
                        onClick={() => setShowOccasionPicker(v => !v)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ec4899",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px",
                            padding: "0.125rem 0",
                        }}
                    >
                        {showOccasionPicker ? "Close ✕" : "Change occasion"}
                    </button>
                </div>

                {/* Occasion chip selector */}
                {showOccasionPicker && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "0.5rem",
                        maxWidth: "600px",
                        margin: "1rem auto 0",
                        padding: "1rem",
                        background: "rgba(255,255,255,0.88)",
                        borderRadius: "16px",
                        border: "1.5px solid #f9a8d4",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 20px rgba(244,114,182,0.12)",
                    }}>
                        {OCCASIONS.map(key => {
                            const intent = OCCASION_INTENT_MAP[key];
                            const isSelected = occasion === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleOccasionChange(key)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "0.2rem",
                                        padding: "0.625rem 0.5rem",
                                        borderRadius: "10px",
                                        border: `2px solid ${isSelected ? "#ec4899" : "#f9a8d4"}`,
                                        background: isSelected ? "#fce7f3" : "#fff",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        transform: isSelected ? "scale(1.04)" : "scale(1)",
                                    }}
                                >
                                    <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{intent.icon}</span>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: isSelected ? "#be185d" : "#374151",
                                        textAlign: "center",
                                    }}>
                                        {intent.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Loading skeleton — 4 per row */}
            {loading && (
                <div style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                    position: "relative",
                    zIndex: 1,
                }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} style={{
                            background: "rgba(255,255,255,0.6)",
                            border: "2px solid #f9a8d4",
                            borderRadius: "16px",
                            height: "260px",
                            opacity: 0.5,
                            animation: `sparkle-pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
                        }} />
                    ))}
                </div>
            )}

            {/* Product grid — 4 per row */}
            {!loading && (
                <div style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                    position: "relative",
                    zIndex: 1,
                }}>
                    {matches.map((product, idx) => (
                        <ProductCard
                            key={`${product.brandName}-${product.shadeName}-${idx}`}
                            product={product}
                            index={idx}
                        />
                    ))}
                </div>
            )}

            {/* Back button */}
            <div style={{ textAlign: "center", marginTop: "2.5rem", position: "relative", zIndex: 1 }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: "0.75rem 2rem",
                        background: "rgba(255,255,255,0.85)",
                        border: "2px solid #f472b6",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        color: "#be185d",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 2px 8px rgba(244,114,182,0.15)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(244,114,182,0.25)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.85)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(244,114,182,0.15)";
                    }}
                >
                    ← Back to results
                </button>
            </div>
        </div>
    );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, index }: { product: ProductMatch; index: number }) {
    const productTypeLabel = formatProductType(product.productType);

    return (
        <div
            className="animate-fade-in"
            style={{
                background: "rgba(255,255,255,0.85)",
                border: "2px solid #f9a8d4",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animationDelay: `${index * 0.05}s`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(244,114,182,0.2)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Image area */}
            <div style={{
                position: "relative",
                background: "#fff",
                margin: "0.625rem",
                borderRadius: "12px",
                border: "1.5px solid #f9a8d4",
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}>
                {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={product.imageUrl}
                        alt={`${product.brandName} ${product.shadeName}`}
                        style={{ width: "85%", height: "85%", objectFit: "contain" }}
                    />
                ) : (
                    <div style={{ fontSize: "2.5rem", opacity: 0.25 }}>💄</div>
                )}
                <div style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    right: "0.5rem",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: product.hexColor,
                    border: "2px solid #f9a8d4",
                    boxShadow: `0 2px 6px ${product.hexColor}66`,
                }} />
            </div>

            {/* Info area */}
            <div style={{ padding: "0 0.75rem 0.75rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "0.6875rem", color: "#9ca3af", fontWeight: 500, marginBottom: "0.125rem" }}>
                    {product.brandName}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#d1d5db", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        SHADE
                    </span>
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#ec4899", textTransform: "capitalize" }}>
                        {productTypeLabel}
                    </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1f2937", marginBottom: "0.25rem", lineHeight: 1.2 }}>
                    {product.shadeName}
                </div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 600, color: product.scoringMethod === "harmony" ? "#be185d" : "#9ca3af", marginBottom: "0.5rem" }}>
                    {product.scoringMethod === "harmony" ? "✦ Harmonizes with your skin" : "✦ Matches your skin color"}
                </div>
                <div style={{ marginTop: "auto" }}>
                    <button
                        style={{
                            width: "100%",
                            padding: "0.375rem 0.5rem",
                            background: "rgba(255,255,255,0.7)",
                            border: "1.5px solid #f9a8d4",
                            borderRadius: "6px",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "#be185d",
                            cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fce7f3"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; }}
                        onClick={() => { if (product.productUrl) window.open(product.productUrl, "_blank"); }}
                    >
                        View product details
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Sparkle ──────────────────────────────────────────────────────────────────

function Sparkle({ top, left, right, size, delay }: {
    top: string; left?: string; right?: string; size: number; delay: number;
}) {
    return (
        <div
            className="sparkle"
            style={{
                top,
                ...(left ? { left } : {}),
                ...(right ? { right } : {}),
                fontSize: `${size}px`,
                animationDelay: `${delay}s`,
            }}
        >
            ✦
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatProductType(type: string): string {
    const map: Record<string, string> = {
        lip: "Lipstick",
        base: "Base",
        blush: "Blush",
        eyes: "Eyes",
        foundation: "Foundation",
        concealer: "Concealer",
        lipstick: "Lipstick",
    };
    return map[type.toLowerCase()] ?? type;
}
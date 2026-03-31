"use client";

import { useState, useEffect } from "react";
import { Briefcase, Heart, PartyPopper, Crown, CircleDot, Sun, X, ChevronDown } from "lucide-react";
import type { ProductMatch } from "@/lib/recommendations/product-matcher";
import { getRecommendations, loadProductsCsv } from "@/lib/recommendations/product-matcher";
import { getProductsCsv } from "@/lib/recommendations/actions";
import { getOwnedProductKeys } from "@/lib/products/actions";
import { getUserPreferences } from "@/app/survey/actions";
import { OCCASIONS, OCCASION_INTENT_MAP } from "@/lib/recommendations/occasion-config";
import type { OccasionKey } from "@/lib/recommendations/occasion-config";
import type { LabColor } from "@/lib/analysis/color-science";

const OCCASION_ICONS: Record<string, React.ReactNode> = {
    Briefcase: <Briefcase size={18} />,
    Heart: <Heart size={18} />,
    PartyPopper: <PartyPopper size={18} />,
    Crown: <Crown size={18} />,
    CircleDot: <CircleDot size={18} />,
    Sun: <Sun size={18} />,
};

const OCCASION_ICONS_LG: Record<string, React.ReactNode> = {
    Briefcase: <Briefcase size={22} />,
    Heart: <Heart size={22} />,
    PartyPopper: <PartyPopper size={22} />,
    Crown: <Crown size={22} />,
    CircleDot: <CircleDot size={22} />,
    Sun: <Sun size={22} />,
};

const PAGE_SIZE = 8;

interface RecommendationsProps {
    userLab: LabColor;
    onBack: () => void;
}

export default function Recommendations({ userLab, onBack }: RecommendationsProps) {
    const [matches, setMatches] = useState<ProductMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [occasion, setOccasion] = useState<OccasionKey>("everyday");
    const [showOccasionModal, setShowOccasionModal] = useState(false);
    const [csvLoaded, setCsvLoaded] = useState(false);
    const [ownedSet, setOwnedSet] = useState<Set<string>>(new Set());
    const [productTypes, setProductTypes] = useState<string[]>([]);
    const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
                const savedBrands = prefs?.preferred_brands ?? [];
                setOccasion(savedOccasion);
                setProductTypes(savedTypes);
                setPreferredBrands(savedBrands);

                applyRecommendations(savedOccasion, owned, savedTypes, savedBrands);
            } catch (err) {
                console.error("Failed to load products:", err);
                setLoading(false);
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLab]);

    function applyRecommendations(occ: OccasionKey, owned: Set<string>, types: string[], brands: string[]) {
        setLoading(true);
        setVisibleCount(PAGE_SIZE);
        try {
            const results = getRecommendations(userLab, 20, occ, types, brands);
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
        setShowOccasionModal(false);
        if (csvLoaded) {
            applyRecommendations(key, ownedSet, productTypes, preferredBrands);
        }
    }

    const occasionIntent = OCCASION_INTENT_MAP[occasion];
    const visibleMatches = matches.slice(0, visibleCount);
    const hasMore = visibleCount < matches.length;

    return (
        <>
            <style>{`
                .rec-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                }
                .rec-skeleton-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                }
                @media (max-width: 640px) {
                    .rec-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }
                    .rec-skeleton-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }
                }
                .occasion-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.35);
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .occasion-modal {
                    background: #fff;
                    border-radius: 20px;
                    border: 2px solid #f9a8d4;
                    padding: 1.75rem;
                    width: 100%;
                    max-width: 480px;
                    box-shadow: 0 8px 40px rgba(244,114,182,0.18);
                    position: relative;
                }
                .occasion-option {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 12px;
                cursor: pointer;
                text-align: left;
                transition: all 0.15s ease;
            }
            @media (max-width: 640px) {
                .occasion-option {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 0.375rem;
                    padding: 0.875rem 0.5rem;
                }
            }
            `}</style>

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

                {/* Title + occasion badge */}
                <div style={{ textAlign: "center", marginBottom: "1.25rem", position: "relative", zIndex: 1 }}>
                    <h1 style={{
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: "0.75rem",
                    }}>
                        Your personalized matches!
                    </h1>

                    <button
                        onClick={() => setShowOccasionModal(true)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: "rgba(255,255,255,0.85)",
                            border: "1.5px solid #f9a8d4",
                            borderRadius: "999px",
                            padding: "0.4rem 1rem",
                            backdropFilter: "blur(8px)",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(244,114,182,0.12)",
                        }}
                    >
                        <span style={{ color: "#be185d", display: "flex", alignItems: "center" }}>
                            {OCCASION_ICONS[occasionIntent.icon]}
                        </span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#be185d" }}>
                            {occasionIntent.label}
                        </span>
                        <ChevronDown size={14} color="#ec4899" />
                    </button>
                </div>

                {/* Back button — above grid, left-aligned */}
                <div style={{ maxWidth: "1100px", margin: "0 auto 0.75rem", position: "relative", zIndex: 1 }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.4rem 0",
                            background: "none",
                            border: "none",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "#9ca3af",
                            cursor: "pointer",
                        }}
                    >
                        ← Back to results
                    </button>
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="rec-skeleton-grid" style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

                {/* Product grid */}
                {!loading && (
                    <>
                        <div className="rec-grid" style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
                            {visibleMatches.map((product, idx) => (
                                <ProductCard
                                    key={`${product.brandName}-${product.shadeName}-${idx}`}
                                    product={product}
                                    index={idx}
                                />
                            ))}
                        </div>

                        {/* Load more */}
                        {hasMore && (
                            <div style={{ textAlign: "center", marginTop: "2rem", position: "relative", zIndex: 1 }}>
                                <button
                                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                                    style={{
                                        padding: "0.75rem 2.5rem",
                                        background: "white",
                                        border: "2px solid #ec4899",
                                        borderRadius: "10px",
                                        fontWeight: 700,
                                        fontSize: "0.9375rem",
                                        color: "#ec4899",
                                        cursor: "pointer",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    View more results
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Occasion modal */}
            {showOccasionModal && (
                <div
                    className="occasion-modal-overlay"
                    onClick={() => setShowOccasionModal(false)}
                >
                    <div
                        className="occasion-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "1.25rem",
                        }}>
                            <div>
                                <h2 style={{ fontWeight: 800, fontSize: "1.125rem", color: "#1f2937", margin: 0 }}>
                                    Choose an occasion
                                </h2>
                                <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: "0.25rem 0 0" }}>
                                    We&apos;ll tailor your shade recommendations.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowOccasionModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9ca3af",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0.25rem",
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Occasion options */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.625rem",
                        }}>
                            {OCCASIONS.map(key => {
                                const intent = OCCASION_INTENT_MAP[key];
                                const isSelected = occasion === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleOccasionChange(key)}
                                        className="occasion-option"
                                        style={{
                                            border: `2px solid ${isSelected ? "#ec4899" : "#f9a8d4"}`,
                                            background: isSelected ? "#fce7f3" : "#fff",
                                        }}
                                    >
                                        <span style={{ color: isSelected ? "#be185d" : "#9ca3af", display: "flex", flexShrink: 0 }}>
                                            {OCCASION_ICONS_LG[intent.icon]}
                                        </span>
                                        <div>
                                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: isSelected ? "#be185d" : "#1f2937" }}>
                                                {intent.label}
                                            </div>
                                            <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.1rem" }}>
                                                {intent.descriptor}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
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
                {/* Shade circle — larger */}
                <div style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    right: "0.5rem",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    backgroundColor: product.hexColor,
                    border: "2.5px solid #fff",
                    boxShadow: `0 2px 8px ${product.hexColor}88`,
                    outline: "1.5px solid #f9a8d4",
                }} />
            </div>

            {/* Info area */}
            <div style={{ padding: "0 0.75rem 0.75rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "0.6875rem", color: "#313232ff", fontWeight: 500, marginBottom: "0.125rem" }}>
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
                <div style={{ fontSize: "0.5625rem", fontWeight: 600, color: product.scoringMethod === "harmony" ? "#be185d" : "#9ca3af" }}>
                    {product.scoringMethod === "harmony" ? "✦ Harmonizes with your skin" : "✦ Matches your skin color"}
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
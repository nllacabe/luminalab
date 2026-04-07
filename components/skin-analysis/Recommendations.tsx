"use client";

import { useState, useEffect, useRef } from "react";
import { Briefcase, Heart, PartyPopper, Crown, CircleDot, Sun, X, SlidersHorizontal } from "lucide-react";
import type { ProductMatch } from "@/lib/recommendations/product-matcher";
import { getRecommendations, loadProductsCsv } from "@/lib/recommendations/product-matcher";
import type { OwnedProductInput } from "@/lib/recommendations/product-matcher";
import { getProductsCsv } from "@/lib/recommendations/actions";
import { getUserOwnedProductsForMatching } from "@/lib/products/actions";
import { getUserPreferences } from "@/app/survey/actions";
import { saveRecommendationSession } from "@/lib/recommendations/recommendation-history";
import { OCCASIONS, OCCASION_INTENT_MAP } from "@/lib/recommendations/occasion-config";
import type { OccasionKey } from "@/lib/recommendations/occasion-config";
import type { LabColor } from "@/lib/analysis/color-science";
import { createClient } from "@/lib/supabase/client";

const OCCASION_ICONS: Record<string, React.ReactNode> = {
    Briefcase: <Briefcase size={18} />,
    Heart: <Heart size={18} />,
    PartyPopper: <PartyPopper size={18} />,
    Crown: <Crown size={18} />,
    CircleDot: <CircleDot size={18} />,
    Sun: <Sun size={18} />,
};

const OCCASION_ICONS_LG: Record<string, React.ReactNode> = {
    Briefcase: <Briefcase size={20} />,
    Heart: <Heart size={20} />,
    PartyPopper: <PartyPopper size={20} />,
    Crown: <Crown size={20} />,
    CircleDot: <CircleDot size={20} />,
    Sun: <Sun size={20} />,
};

const PRODUCT_TYPE_OPTIONS = [
    { id: "foundation", label: "Base / Foundation" },
    { id: "lipstick", label: "Lips / Lipstick" },
    { id: "blush", label: "Cheeks / Blush" },
    // { id: "other", label: "Eyes" },
];

const FINISH_OPTIONS = [
    { id: "matte", label: "Matte" },
    { id: "dewy", label: "Dewy" },
    { id: "satin", label: "Satin" },
    { id: "natural", label: "Natural" },
    { id: "glossy", label: "Glossy" },
];

const PAGE_SIZE = 8;

interface RecommendationsProps {
    userLab: LabColor;
    onBack: () => void;
}

export default function Recommendations({ userLab, onBack }: RecommendationsProps) {
    const [matches, setMatches] = useState<ProductMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [occasion, setOccasion] = useState<OccasionKey>("everyday");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [csvLoaded, setCsvLoaded] = useState(false);
    const [ownedProducts, setOwnedProducts] = useState<OwnedProductInput[]>([]);
    const [productTypes, setProductTypes] = useState<string[]>([]);
    const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
    const [finishes, setFinishes] = useState<string[]>([]);
    const [budgetMin, setBudgetMin] = useState(0);
    const [budgetMax, setBudgetMax] = useState(5000);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const savedRef = useRef(false);

    // Draft state for modal — so changes only apply on "Apply"
    const [draftOccasion, setDraftOccasion] = useState<OccasionKey>("everyday");
    const [draftProductTypes, setDraftProductTypes] = useState<string[]>([]);
    const [draftFinishes, setDraftFinishes] = useState<string[]>([]);
    const [draftBudgetMin, setDraftBudgetMin] = useState(0);
    const [draftBudgetMax, setDraftBudgetMax] = useState(5000);

    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const [csvText, ownedProds, prefs] = await Promise.all([
                    getProductsCsv(),
                    getUserOwnedProductsForMatching().catch(() => [] as OwnedProductInput[]),
                    getUserPreferences().catch(() => null),
                ]);
                loadProductsCsv(csvText);
                setCsvLoaded(true);

                setOwnedProducts(ownedProds);

                const savedOccasion = (prefs?.occasion ?? "everyday") as OccasionKey;
                const savedTypes = prefs?.product_types ?? [];
                const savedBrands = prefs?.preferred_brands ?? [];
                const savedFinishes = prefs?.finish_preferences ?? [];
                const savedBudgetMin = prefs?.budget_min ?? 0;
                const savedBudgetMax = prefs?.budget_max ?? 5000;

                setOccasion(savedOccasion);
                setProductTypes(savedTypes);
                setPreferredBrands(savedBrands);
                setFinishes(savedFinishes);
                setBudgetMin(savedBudgetMin);
                setBudgetMax(savedBudgetMax);

                applyRecommendations(savedOccasion, ownedProds, savedTypes, savedBrands, savedFinishes, savedBudgetMin, savedBudgetMax);
            } catch (err) {
                console.error("Failed to load products:", err);
                setLoading(false);
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLab]);

    function applyRecommendations(
        occ: OccasionKey,
        owned: OwnedProductInput[],
        types: string[],
        brands: string[],
        fins: string[],
        bMin: number,
        bMax: number,
    ) {
        setLoading(true);
        setVisibleCount(PAGE_SIZE);
        try {
            const budgetRange = (bMin > 0 || bMax < 5000) ? { min: bMin, max: bMax } : undefined;
            const results = getRecommendations(userLab, 20, occ, types, brands, owned, fins, budgetRange);
            const final = results.slice(0, 16);
            setMatches(final);

            // Auto-save for logged-in users (only once per mount)
            if (!savedRef.current && final.length > 0) {
                savedRef.current = true;
                const supabase = createClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        saveRecommendationSession({
                            labL: userLab.L,
                            labA: userLab.a,
                            labB: userLab.b,
                            occasion: occ,
                            products: final.map((p) => ({
                                brandName: p.brandName,
                                productName: p.productName,
                                shadeName: p.shadeName,
                                productType: p.productType,
                                finish: p.finish,
                                hexColor: p.hexColor,
                                price: p.price,
                                imageUrl: p.imageUrl,
                                scoringMethod: p.scoringMethod,
                                isOwned: p.isOwned,
                            })),
                        }).catch((err) => console.error("Failed to save recommendations:", err));
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    }

    function openFilterModal() {
        // Sync draft with current state
        setDraftOccasion(occasion);
        setDraftProductTypes([...productTypes]);
        setDraftFinishes([...finishes]);
        setDraftBudgetMin(budgetMin);
        setDraftBudgetMax(budgetMax);
        setShowFilterModal(true);
    }

    function handleApplyFilters() {
        setOccasion(draftOccasion);
        setProductTypes(draftProductTypes);
        setFinishes(draftFinishes);
        setBudgetMin(draftBudgetMin);
        setBudgetMax(draftBudgetMax);
        setShowFilterModal(false);
        if (csvLoaded) {
            applyRecommendations(draftOccasion, ownedProducts, draftProductTypes, preferredBrands, draftFinishes, draftBudgetMin, draftBudgetMax);
        }
    }

    function handleResetFilters() {
        setDraftOccasion("everyday");
        setDraftProductTypes([]);
        setDraftFinishes([]);
        setDraftBudgetMin(0);
        setDraftBudgetMax(5000);

        setOccasion("everyday");
        setProductTypes([]);
        setFinishes([]);
        setBudgetMin(0);
        setBudgetMax(5000);
        setShowFilterModal(false);

        if (csvLoaded) {
            applyRecommendations("everyday", ownedProducts, [], preferredBrands, [], 0, 5000);
        }
    }

    function toggleDraftType(id: string) {
        setDraftProductTypes(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    }

    function toggleDraftFinish(id: string) {
        setDraftFinishes(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    }

    // Count active filters for badge
    const activeFilterCount =
        (occasion !== "everyday" ? 1 : 0) +
        (productTypes.length > 0 ? 1 : 0) +
        (finishes.length > 0 ? 1 : 0) +
        ((budgetMin > 0 || budgetMax < 5000) ? 1 : 0);

    const occasionIntent = OCCASION_INTENT_MAP[occasion];
    const visibleMatches = matches.slice(0, visibleCount);
    const hasMore = visibleCount < matches.length;

    // Budget bar fill
    const minPct = (draftBudgetMin / 5000) * 100;
    const maxPct = (draftBudgetMax / 5000) * 100;

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
                .filter-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    backdrop-filter: blur(4px);
                }
                .filter-modal {
                    background: #fff;
                    border-radius: 24px;
                    border: 2px solid #f9a8d4;
                    width: 100%;
                    max-width: 520px;
                    max-height: 85vh;
                    box-shadow: 0 12px 48px rgba(244,114,182,0.2);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .filter-modal-body {
                    overflow-y: auto;
                    flex: 1;
                    padding: 1.25rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .filter-section-title {
                font-size: 0.875rem;
                font-weight: 500;
                text-transform: none;
                letter-spacing: normal;
                color: #000;
                margin-bottom: 0.625rem;
            }
                .filter-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 0.875rem;
                    border-radius: 999px;
                    cursor: pointer;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    transition: all 0.15s ease;
                    border: 1.5px solid #e5e7eb;
                    background: #fff;
                    color: #374151;
                    user-select: none;
                }
                .filter-chip:hover {
                    border-color: #f9a8d4;
                    background: #fef2f8;
                }
                .filter-chip.active {
                    border-color: #ec4899;
                    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
                    color: #be185d;
                    box-shadow: 0 2px 8px rgba(236,72,153,0.15);
                }
                .occasion-grid-option {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    padding: 0.625rem 0.75rem;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.15s ease;
                    border: 1.5px solid #e5e7eb;
                    background: #fff;
                }
                .occasion-grid-option:hover {
                    border-color: #f9a8d4;
                    background: #fef2f8;
                }
                .occasion-grid-option.active {
                    border-color: #ec4899;
                    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
                    box-shadow: 0 2px 8px rgba(236,72,153,0.12);
                }
                @media (max-width: 640px) {
                    .occasion-grid-option {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 0.25rem;
                        padding: 0.75rem 0.5rem;
                    }
                }

                /* Dual range slider styling */
                .dual-range-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    pointer-events: none;
                    cursor: pointer;
                    margin: 0;
                    padding: 0;
                }
                .dual-range-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ec4899;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
                    pointer-events: auto;
                    cursor: pointer;
                }
                .dual-range-input::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ec4899;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
                    pointer-events: auto;
                    cursor: pointer;
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

                {/* Title + filter badge */}
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
                        onClick={openFilterModal}
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
                            position: "relative",
                        }}
                    >
                        <SlidersHorizontal size={15} color="#be185d" />
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#be185d" }}>
                            Filter recommendations
                        </span>
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: "#ec4899",
                                color: "#fff",
                                fontSize: "0.625rem",
                                fontWeight: 800,
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: "0.125rem",
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Back button */}
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
                                background: "linear-gradient(180deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
                                backgroundSize: "100% 200%",
                                borderRadius: "16px",
                                height: "260px",
                                animation: "shimmer-vertical 1.8s ease-in-out infinite",
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

                        {/* No results message */}
                        {matches.length === 0 && (
                            <div style={{
                                textAlign: "center",
                                padding: "3rem 1rem",
                                position: "relative",
                                zIndex: 1,
                            }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>✦</div>
                                <p style={{ color: "#6b7280", fontSize: "0.9375rem", fontWeight: 500 }}>
                                    No products match your current filters.
                                </p>
                                <button
                                    onClick={openFilterModal}
                                    style={{
                                        marginTop: "0.75rem",
                                        padding: "0.5rem 1.5rem",
                                        background: "none",
                                        border: "1.5px solid #ec4899",
                                        borderRadius: "8px",
                                        color: "#ec4899",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    Adjust filters
                                </button>
                            </div>
                        )}

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

            {/* ── Filter Modal ──────────────────────────────────────────── */}
            {showFilterModal && (
                <div
                    className="filter-modal-overlay"
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        className="filter-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1.25rem 1.5rem",
                            borderBottom: "1px solid #fce7f3",
                            flexShrink: 0,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <SlidersHorizontal size={18} color="#ec4899" />
                                <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", color: "#1f2937", margin: 0 }}>
                                    Filter Recommendations
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#9ca3af",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0.25rem",
                                    borderRadius: "6px",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#fce7f3"; e.currentTarget.style.color = "#ec4899"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="filter-modal-body">

                            {/* ── Section 1: Budget ───────────────────────────── */}
                            <div>
                                <div className="filter-section-title">Budget Range</div>
                                <div style={{
                                    background: "#fef7ff",
                                    borderRadius: "14px",
                                    padding: "1rem 1.25rem",
                                    border: "1px solid #fce7f3",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280" }}>
                                            ₱{draftBudgetMin.toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280" }}>
                                            ₱{draftBudgetMax.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Dual-thumb range */}
                                    <div style={{ position: "relative", height: "24px" }}>
                                        <div style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: 0,
                                            right: 0,
                                            height: "5px",
                                            background: "#fce7f3",
                                            borderRadius: "3px",
                                            transform: "translateY(-50%)",
                                        }} />
                                        <div style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: `${minPct}%`,
                                            width: `${maxPct - minPct}%`,
                                            height: "5px",
                                            background: "linear-gradient(90deg, #ec4899, #f472b6)",
                                            borderRadius: "3px",
                                            transform: "translateY(-50%)",
                                        }} />
                                        <input
                                            type="range"
                                            min={0}
                                            max={5000}
                                            step={50}
                                            value={draftBudgetMin}
                                            onChange={e => setDraftBudgetMin(Math.min(Number(e.target.value), draftBudgetMax - 50))}
                                            className="dual-range-input"
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={5000}
                                            step={50}
                                            value={draftBudgetMax}
                                            onChange={e => setDraftBudgetMax(Math.max(Number(e.target.value), draftBudgetMin + 50))}
                                            className="dual-range-input"
                                        />
                                    </div>
                                    <p style={{
                                        fontSize: "0.75rem",
                                        color: "#ec4899",
                                        fontWeight: 600,
                                        marginTop: "0.375rem",
                                        textAlign: "center",
                                        margin: "0.375rem 0 0",
                                    }}>
                                        ₱{draftBudgetMin.toLocaleString()} — ₱{draftBudgetMax.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <hr style={{ border: "none", borderTop: "1px solid #fce7f3", margin: 0 }} />

                            {/* ── Section 2: Product Type ─────────────────────── */}
                            <div>
                                <div className="filter-section-title">Product Type</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {PRODUCT_TYPE_OPTIONS.map(pt => (
                                        <button
                                            key={pt.id}
                                            onClick={() => toggleDraftType(pt.id)}
                                            className={`filter-chip ${draftProductTypes.includes(pt.id) ? "active" : ""}`}
                                        >
                                            {pt.label}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.375rem", fontStyle: "italic", marginLeft: "0.375rem" }}>
                                    Leave empty to show all types
                                </p>
                            </div>

                            {/* Divider */}
                            <hr style={{ border: "none", borderTop: "1px solid #fce7f3", margin: 0 }} />

                            {/* ── Section 3: Occasion ─────────────────────────── */}
                            <div>
                                <div className="filter-section-title">Occasion</div>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.5rem",
                                }}>
                                    {OCCASIONS.map(key => {
                                        const intent = OCCASION_INTENT_MAP[key];
                                        const isSelected = draftOccasion === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setDraftOccasion(key)}
                                                className={`occasion-grid-option ${isSelected ? "active" : ""}`}
                                            >
                                                <span style={{
                                                    color: isSelected ? "#be185d" : "#9ca3af",
                                                    display: "flex",
                                                    flexShrink: 0,
                                                }}>
                                                    {OCCASION_ICONS_LG[intent.icon]}
                                                </span>
                                                <div>
                                                    <div style={{
                                                        fontSize: "0.8125rem",
                                                        fontWeight: 700,
                                                        color: isSelected ? "#be185d" : "#1f2937",
                                                        lineHeight: 1.25,
                                                    }}>
                                                        {intent.label}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "0.625rem",
                                                        color: isSelected ? "#db2777" : "#9ca3af",
                                                        marginTop: "0.1rem",
                                                        fontStyle: "italic",
                                                    }}>
                                                        {intent.descriptor}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr style={{ border: "none", borderTop: "1px solid #fce7f3", margin: 0 }} />

                            {/* ── Section 4: Finish ───────────────────────────── */}
                            <div>
                                <div className="filter-section-title">Finish Preference</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {FINISH_OPTIONS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => toggleDraftFinish(f.id)}
                                            className={`filter-chip ${draftFinishes.includes(f.id) ? "active" : ""}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.375rem", fontStyle: "italic", marginLeft: "0.375rem" }}>
                                    Leave empty to show all finishes
                                </p>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div style={{
                            borderTop: "1px solid #fce7f3",
                            padding: "1rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            flexShrink: 0,
                            background: "rgba(255,255,255,0.95)",
                        }}>
                            <button
                                onClick={handleResetFilters}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#9ca3af",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "8px",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = "#ec4899"; e.currentTarget.style.background = "#fef2f8"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "none"; }}
                            >
                                Reset all
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                style={{
                                    padding: "0.625rem 2rem",
                                    background: "linear-gradient(135deg, #ec4899, #f472b6)",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    color: "#fff",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
                                    transition: "all 0.2s ease",
                                    letterSpacing: "0.02em",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(236,72,153,0.4)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(236,72,153,0.3)"; }}
                            >
                                Apply Filters
                            </button>
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
                border: product.isOwned ? "2px solid #a78bfa" : "2px solid #f9a8d4",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animationDelay: `${index * 0.05}s`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                backdropFilter: "blur(8px)",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = product.isOwned
                    ? "0 8px 24px rgba(167,139,250,0.25)"
                    : "0 8px 24px rgba(244,114,182,0.2)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Owned badge */}
            {product.isOwned && (
                <div style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "0.5rem",
                    zIndex: 2,
                    background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                    color: "#fff",
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                    letterSpacing: "0.04em",
                    boxShadow: "0 2px 6px rgba(139,92,246,0.3)",
                }}>
                    ★ Owned Product
                </div>
            )}

            {/* Image area */}
            <div style={{
                position: "relative",
                background: "#fff",
                margin: "0.625rem",
                borderRadius: "12px",
                border: product.isOwned ? "1.5px solid #c4b5fd" : "1.5px solid #f9a8d4",
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
                {/* Shade circle */}
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
                    outline: product.isOwned ? "1.5px solid #c4b5fd" : "1.5px solid #f9a8d4",
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
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: product.isOwned ? "#8b5cf6" : "#ec4899", textTransform: "capitalize" }}>
                        {productTypeLabel}
                    </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1f2937", marginBottom: "0.25rem", lineHeight: 1.2 }}>
                    {product.shadeName}
                </div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 600, color: product.isOwned ? "#7c3aed" : product.scoringMethod === "harmony" ? "#be185d" : "#9ca3af" }}>
                    {product.isOwned
                        ? "★ From your collection"
                        : product.scoringMethod === "harmony"
                            ? "✦ Harmonizes with your skin"
                            : "✦ Matches your skin color"}
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
        // eyes: "Eyes",
        foundation: "Foundation",
        concealer: "Concealer",
        lipstick: "Lipstick",
    };
    return map[type.toLowerCase()] ?? type;
}
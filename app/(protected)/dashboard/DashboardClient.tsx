"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import UserPreferenceSurvey from "@/components/survey/UserPreferenceSurvey";
import type { UserPreferences } from "@/app/survey/actions";
import type { UserProduct } from "@/lib/products/types";
import type { RecommendationSession, RecommendationSessionProduct } from "@/lib/recommendations/recommendation-history";
import { deleteRecommendationSession } from "@/lib/recommendations/recommendation-history";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
    userEmail: string | null;
    showSurvey: boolean;
    brands: string[];
    prefs: UserPreferences | null;
    products: UserProduct[];
    recSession: RecommendationSession | null;
}

const SKIN_TYPE_LABELS: Record<string, string> = {
    oily: "Oily",
    dry: "Dry",
    combination: "Combination",
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    foundation: "Foundation",
    lipstick: "Lips",
    blush: "Blush",
    other: "Eyes",
};

const OCCASION_LABELS: Record<string, string> = {
    everyday: "Everyday / Casual",
    work: "Work / Office",
    date_night: "Date Night",
    formal: "Formal Event",
    outdoor: "Outdoor",
    party: "Party",
};

function useBreakpoint() {
    const [width, setWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );
    useEffect(() => {
        function onResize() { setWidth(window.innerWidth); }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return {
        isMobile: width < 640,
        isTablet: width >= 640 && width < 900,
        isDesktop: width >= 900,
    };
}

export default function DashboardClient({ userEmail, showSurvey, brands, prefs, products, recSession }: Props) {
    const router = useRouter();
    const [surveyVisible, setSurveyVisible] = useState(showSurvey);
    const { isMobile, isDesktop } = useBreakpoint();
    const [session, setSession] = useState<RecommendationSession | null>(recSession);
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const username = userEmail?.split("@")[0] ?? "there";
    const recentProducts = products.slice(0, 4);
    const ownedCount = products.filter(p => p.source === "catalog").length;
    const customCount = products.filter(p => p.source === "custom").length;
    const typeCount = new Set(products.map(p => p.productType)).size;

    // On mobile: show 2 products max in a 2-col grid
    // On tablet/desktop: show 4 in a row
    const recentCols = isMobile ? 2 : 4;
    const recentVisible = isMobile ? recentProducts.slice(0, 2) : recentProducts;

    return (
        <div className="page-wrapper">
            {surveyVisible && (
                <UserPreferenceSurvey
                    brands={brands}
                    initialPrefs={null}
                    onComplete={() => {
                        setSurveyVisible(false);
                        router.refresh();
                    }}
                    isOverlay={true}
                />
            )}

            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="45%" left="2%" size={12} delay={0.6} />
            <Sparkle top="50%" right="3%" size={16} delay={0.9} />

            <Header isLoggedIn />

            <main style={{ flex: 1, padding: isMobile ? "1.25rem" : "2rem", position: "relative", zIndex: 1 }}>
                <div style={{ maxWidth: "960px", margin: "0 auto" }}>

                    {/* Greeting */}
                    <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
                        <h1 style={{
                            fontSize: isMobile ? "1.375rem" : "1.75rem",
                            fontWeight: 800,
                            fontStyle: "italic",
                            color: "#ec4899",
                            marginBottom: "0.25rem",
                            fontFamily: "var(--font-instrument-serif), serif",
                        }}>
                            Welcome back, {username}!
                        </h1>
                        <p style={{ color: "#6b7280", fontSize: "0.9375rem" }}>
                            Your personalized skin tone analysis hub.
                        </p>
                    </div>

                    {/* Analyze banner — glassmorphism, slightly more white */}
                    <div className="animate-fade-in" style={{
                        background: "rgba(255, 255, 255, 0.35)",
                        border: "1px solid rgba(236, 72, 153, 0.5)",
                        borderRadius: "16px",
                        padding: "1.25rem 1.5rem",

                        backdropFilter: "blur(24px) saturate(160%)",
                        WebkitBackdropFilter: "blur(24px) saturate(160%)",

                        boxShadow: `
                            0 8px 32px rgba(0, 0, 0, 0.08),
                            0 4px 16px rgba(236, 72, 153, 0.08),
                            inset 0 1px 0 rgba(255, 255, 255, 0.6)
                        `,
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "center",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        marginBottom: "1.25rem",
                        gap: "1rem",
                    }}>
                        <div>
                            <p style={{ fontWeight: 600, color: "#1f2937", fontSize: "1rem", marginBottom: "0.2rem" }}>
                                Ready for a new analysis?
                            </p>
                            <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                                Upload a photo to get personalized shade matches.
                            </p>
                        </div>
                        <Link href="/assessment" style={{ textDecoration: "none", width: isMobile ? "100%" : "auto" }}>
                            <button style={{
                                padding: "0.6rem 1.5rem",
                                background: "#ec4899",
                                border: "none",
                                borderRadius: "999px",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                color: "#fff",
                                cursor: "pointer",
                                transition: "background 0.15s",
                                width: isMobile ? "100%" : "auto",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#db2777"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#ec4899"; }}
                            >
                                Analyze skin tone →
                            </button>
                        </Link>
                    </div>

                    {/* Two-col on desktop, stacked on mobile/tablet */}
                    <div className="animate-fade-in-delay" style={{
                        display: "grid",
                        gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                        gap: "1rem",
                        marginBottom: "1.25rem",
                    }}>
                        {/* Preferences card */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontWeight: 700, color: "#505050ff" }}>
                                <p>My Preferences</p>
                                <Link href="/survey" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline", fontWeight: 700 }}>
                                    Edit
                                </Link>
                            </div>
                            {prefs ? (
                                <div>
                                    <PrefRow
                                        label="Budget"
                                        value={`PHP ${prefs.budget_min.toLocaleString()} – ${prefs.budget_max.toLocaleString()}`}
                                    />
                                    {/* <PrefRow
                                        label="Skin type"
                                        value={SKIN_TYPE_LABELS[prefs.skin_type] ?? prefs.skin_type || "—"}
                                    /> */}
                                    <PrefRow
                                        label="Occasion"
                                        value={OCCASION_LABELS[prefs.occasion] ?? prefs.occasion}
                                    />
                                    <PrefRow
                                        label="Products"
                                        value={
                                            prefs.product_types.length > 0
                                                ? prefs.product_types.map(t => PRODUCT_TYPE_LABELS[t] ?? t).join(", ")
                                                : "All types"
                                        }
                                    />
                                    <PrefRow
                                        label="Finish"
                                        value={prefs.finish_preferences.length > 0
                                            ? prefs.finish_preferences.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(", ")
                                            : "Any"
                                        }
                                    />
                                    <PrefRow
                                        label="Values"
                                        value={[
                                            prefs.is_cruelty_free && "Cruelty-free",
                                            prefs.is_vegan && "Vegan",
                                            prefs.prefers_local && "Local brands",
                                        ].filter(Boolean).join(", ") || "None selected"}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "1.25rem 0",
                                    height: "80%",
                                }}>
                                    <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                                        No preferences set yet.
                                    </p>
                                    <Link href="/survey" style={{ textDecoration: "none" }}>
                                        <button style={pinkOutlineBtnStyle}>Set preferences</button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Collection stats card */}
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontWeight: 700, color: "#505050ff" }}>
                                <p>My Collection</p>
                                <Link href="/my-products" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline", fontWeight: 700 }}>
                                    Manage
                                </Link>
                            </div>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.75rem",
                                marginBottom: "1rem",
                            }}>
                                <StatBox label="Total products" value={products.length} />
                                <StatBox label="From catalog" value={ownedCount} />
                                <StatBox label="Custom added" value={customCount} />
                                <StatBox label="Product types" value={typeCount} />
                            </div>
                            <Link href="/my-products" style={{ textDecoration: "none" }}>
                                <button className="btn btn-secondary" style={{ width: "100%", borderRadius: "999px", fontSize: "0.8125rem", padding: "0.5rem 0" }}>
                                    View all products
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Recently added */}
                    <div className="animate-fade-in-delay">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontWeight: 700, color: "#505050ff" }}>
                            <p>Recently Added</p>
                            <Link href="/my-products" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline", fontWeight: 700 }}>
                                See all
                            </Link>
                        </div>

                        {recentVisible.length > 0 ? (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${recentCols}, 1fr)`,
                                gap: isMobile ? "0.625rem" : "0.875rem",
                            }}>
                                {recentVisible.map(p => (
                                    <ProductMiniCard key={p.id} product={p} />
                                ))}
                                {/* Add product slot — only show if we have room */}
                                {recentVisible.length < recentCols && (
                                    <Link href="/my-products" style={{ textDecoration: "none" }}>
                                        <div style={{
                                            background: "rgba(255,255,255,0.6)",
                                            border: "2px dashed #f9a8d4",
                                            borderRadius: "16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.4rem",
                                            cursor: "pointer",
                                            minHeight: "140px",
                                            transition: "background 0.15s",
                                        }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#fdf2f8"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.6)"; }}
                                        >
                                            <span style={{ fontSize: "1.5rem", color: "#f9a8d4" }}>+</span>
                                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Add product</span>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div style={{ ...cardStyle, textAlign: "center", padding: "2.5rem" }}>
                                <p style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "center" }}>
                                    <img src="/icon.png" alt="icon" style={{ width: "2.75rem", height: "2.75rem" }} />
                                </p>
                                <p style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                                    No products yet
                                </p>
                                <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1rem" }}>
                                    Add products you own so we can filter them out of your recommendations.
                                </p>
                                <Link href="/my-products" style={{ textDecoration: "none" }}>
                                    <button style={pinkOutlineBtnStyle}>Add your first product</button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Previous Recommendations ────────────────────── */}
                    <div className="animate-fade-in-delay" style={{ marginTop: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontWeight: 700, color: "#505050ff" }}>
                            <p>Previous Recommendations</p>
                        </div>

                        {session ? (
                            <PreviousRecommendationCard
                                session={session}
                                expanded={expanded}
                                onToggle={() => setExpanded(e => !e)}
                                deleting={deleting}
                                isMobile={isMobile}
                                onDelete={async () => {
                                    setDeleting(true);
                                    const res = await deleteRecommendationSession();
                                    if (res.success) setSession(null);
                                    setDeleting(false);
                                }}
                            />
                        ) : (
                            <div style={{ ...cardStyle, textAlign: "center", padding: "2rem" }}>
                                <p style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "center" }}>
                                    <img src="/icon.png" alt="icon" style={{ width: "2.75rem", height: "2.75rem" }} />
                                </p>
                                <p style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                                    No recommendation history yet
                                </p>
                                <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1rem" }}>
                                    Run a skin analysis to get personalized product matches.
                                </p>
                                <Link href="/assessment" style={{ textDecoration: "none" }}>
                                    <button className="btn btn-primary" style={{ borderRadius: "999px", fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>Start analysis →</button>
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <footer style={{
                padding: "1.5rem 2rem",
                textAlign: "center",
                fontSize: "0.8125rem",
                color: "#9ca3af",
                position: "relative",
                zIndex: 1,
            }}>
                © {new Date().getFullYear()} LuminaLAB. All rights reserved.
            </footer>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PrefRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.4rem 0",
            borderBottom: "1px solid #fce7f3",
            gap: "0.5rem",
        }}>
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1f2937", textAlign: "right" }}>{value}</span>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div style={{
            background: "#fdf2f8",
            border: "1px solid rgba(236, 72, 153, 0.5)",
            borderRadius: "12px",
            padding: "0.875rem 0.75rem",
            textAlign: "center",
        }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ec4899", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "0.7rem", color: "#505050ff", marginTop: "0.3rem" }}>{label}</p>
        </div>
    );
}

function ProductMiniCard({ product }: { product: UserProduct }) {
    return (
        <div style={{
            background: "rgba(255, 255, 255, 0.50)",
            border: "1px solid rgba(236, 72, 153, 0.5)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            boxShadow: `
  0 8px 32px rgba(0,0,0,0.08),
  inset 0 1px 0 rgba(255,255,255,0.5)
`,
            borderRadius: "16px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(244,114,182,0.18)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {product.hexColor ? (
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: product.hexColor,
                    border: "2px solid #f9a8d4",
                    flexShrink: 0,
                }} />
            ) : (
                <div style={{ fontSize: "1.5rem" }}>💄</div>
            )}
            <p style={{ fontSize: "0.6875rem", color: "#9ca3af", textAlign: "center" }}>
                {product.brandName}
            </p>
            <p style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1f2937",
                textAlign: "center",
                lineHeight: 1.2,
            }}>
                {product.shadeName || product.name}
            </p>
            <span style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                color: "#ec4899",
                background: "#fdf2f8",
                padding: "0.125rem 0.5rem",
                borderRadius: "999px",
                border: "1px solid #f9a8d4",
            }}>
                {product.source === "catalog" ? "Owned" : "Custom"}
            </span>
        </div>
    );
}

function Sparkle({ top, left, right, size, delay }: {
    top: string; left?: string; right?: string; size: number; delay: number;
}) {
    return (
        <div className="sparkle" style={{
            top,
            ...(left ? { left } : {}),
            ...(right ? { right } : {}),
            fontSize: `${size}px`,
            animationDelay: `${delay}s`,
        }}>
            ✦
        </div>
    );
}

// ── Previous Recommendations Card ────────────────────────────────────────────

const OCCASION_LABEL_MAP: Record<string, string> = {
    everyday: "Everyday / Casual",
    work: "Work / Office",
    date_night: "Date Night",
    formal: "Formal Event",
    outdoor: "Outdoor",
    party: "Party",
    job_interview: "Work / Office",
    formal_gala: "Formal Event",
    solemn: "Formal Event",
};

function PreviousRecommendationCard({
    session,
    expanded,
    onToggle,
    deleting,
    isMobile,
    onDelete,
}: {
    session: RecommendationSession;
    expanded: boolean;
    onToggle: () => void;
    deleting: boolean;
    isMobile: boolean;
    onDelete: () => void;
}) {
    const date = new Date(session.updatedAt);
    const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
    const occasionLabel = OCCASION_LABEL_MAP[session.occasion] ?? session.occasion;
    const previewCount = isMobile ? 6 : 8;
    const previewProducts = session.products.slice(0, previewCount);
    const allProducts = session.products;

    return (
        <div style={{
            ...cardStyle,
            overflow: "hidden",
            transition: "box-shadow 0.2s ease",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(244,114,182,0.14)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Header row */}
            <div style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "0.5rem" : "0",
                marginBottom: "0.875rem",
            }}>
                <div>
                    <p style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "#1f2937",
                        margin: 0,
                        marginBottom: "0.2rem",
                    }}>
                        Latest Shade Matches
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                        {dateStr} at {timeStr} · <span style={{ color: "#ec4899", fontWeight: 600 }}>{occasionLabel}</span>
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.35rem 0.75rem",
                            background: "transparent",
                            border: "1.5px solid #fca5a5",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#ef4444",
                            cursor: deleting ? "wait" : "pointer",
                            opacity: deleting ? 0.5 : 1,
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <Trash2 size={13} />
                        {deleting ? "Deleting…" : "Clear"}
                    </button>
                </div>
            </div>

            {/* Swatch preview (collapsed) */}
            {!expanded && (
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}>
                        {previewProducts.map((p, i) => (
                            <div
                                key={i}
                                title={`${p.brandName} – ${p.shadeName}`}
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: p.hexColor || "#ddd",
                                    border: "2.5px solid #fff",
                                    outline: "1.5px solid #f9a8d4",
                                    boxShadow: `0 2px 6px ${p.hexColor || "#ddd"}44`,
                                    cursor: "pointer",
                                    transition: "transform 0.15s ease",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                            />
                        ))}
                        {session.products.length > previewCount && (
                            <span style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#9ca3af",
                                marginLeft: "0.25rem",
                            }}>
                                +{session.products.length - previewCount} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Expanded grid */}
            {expanded && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                    gap: isMobile ? "0.625rem" : "0.75rem",
                    marginBottom: "0.75rem",
                }}>
                    {allProducts.map((p, i) => (
                        <RecProductMini key={i} product={p} />
                    ))}
                </div>
            )}

            {/* Expand / collapse toggle */}
            <button
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.375rem",
                    width: "100%",
                    padding: "0.5rem 0",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid #fce7f3",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "#ec4899",
                    cursor: "pointer",
                    transition: "color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#be185d"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#ec4899"; }}
            >
                {expanded ? (
                    <>Show less <ChevronUp size={15} /></>
                ) : (
                    <>View all {session.products.length} products <ChevronDown size={15} /></>
                )}
            </button>
        </div>
    );
}

function RecProductMini({ product }: { product: RecommendationSessionProduct }) {
    return (
        <div style={{
            background: product.isOwned ? "#f5f3ff" : "#fdf2f8",
            borderRadius: "12px",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.35rem",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            position: "relative",
            border: product.isOwned ? "1.5px solid #c4b5fd" : "none",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = product.isOwned
                    ? "0 4px 14px rgba(139,92,246,0.18)"
                    : "0 4px 14px rgba(244,114,182,0.15)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {product.isOwned && (
                <div style={{
                    position: "absolute",
                    top: "0.35rem",
                    right: "0.35rem",
                    background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                    color: "#fff",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    padding: "0.125rem 0.35rem",
                    borderRadius: "999px",
                    letterSpacing: "0.04em",
                }}>
                    Owned
                </div>
            )}
            {product.hexColor ? (
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: product.hexColor,
                    border: product.isOwned ? "2px solid #c4b5fd" : "2px solid #f9a8d4",
                    boxShadow: `0 2px 6px ${product.hexColor}44`,
                    flexShrink: 0,
                }} />
            ) : (
                <div style={{ fontSize: "1.25rem" }}>💄</div>
            )}
            <p style={{ fontSize: "0.625rem", color: "#9ca3af", textAlign: "center", margin: 0, lineHeight: 1.2 }}>
                {product.brandName}
            </p>
            <p style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#1f2937",
                textAlign: "center",
                lineHeight: 1.2,
                margin: 0,
            }}>
                {product.shadeName || product.productName}
            </p>
            <span style={{
                fontSize: "0.5625rem",
                fontWeight: 700,
                color: product.isOwned ? "#7c3aed" : product.scoringMethod === "harmony" ? "#be185d" : "#9ca3af",
            }}>
                {product.isOwned ? "★ Owned" : product.scoringMethod === "harmony" ? "✦ Harmony" : "✦ Match"}
            </span>
        </div>
    );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.50)",
    border: "1px solid rgba(236, 72, 153, 0.5)",
    borderRadius: "16px",
    padding: "1.25rem 1.5rem",

    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)",

    boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 4px 16px rgba(236, 72, 153, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,

    overflow: "hidden",
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: 0,
};

const pinkOutlineBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1.25rem",
    background: "transparent",
    border: "1.5px solid #ec4899",
    borderRadius: "999px",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#ec4899",
    cursor: "pointer",
    transition: "background 0.15s",
};
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import UserPreferenceSurvey from "@/components/survey/UserPreferenceSurvey";
import type { UserPreferences } from "@/app/survey/actions";
import type { UserProduct } from "@/lib/products/types";

interface Props {
    userEmail: string | null;
    showSurvey: boolean;
    brands: string[];
    prefs: UserPreferences | null;
    products: UserProduct[];
}

const SKIN_TYPE_LABELS: Record<string, string> = {
    oily: "Oily",
    dry: "Dry",
    combination: "Combination",
    sensitive: "Sensitive",
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

export default function DashboardClient({ userEmail, showSurvey, brands, prefs, products }: Props) {
    const [surveyVisible, setSurveyVisible] = useState(showSurvey);
    const { isMobile, isDesktop } = useBreakpoint();

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
                    onComplete={() => setSurveyVisible(false)}
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
                            fontWeight: 700,
                            color: "#1f2937",
                            marginBottom: "0.25rem",
                        }}>
                            Welcome back, {username} 👋
                        </h1>
                        <p style={{ color: "#6b7280", fontSize: "0.9375rem" }}>
                            Your personalized skin analysis hub.
                        </p>
                    </div>

                    {/* Analyze banner */}
                    <div className="animate-fade-in" style={{
                        background: "rgba(255,255,255,0.85)",
                        border: "2px solid #f9a8d4",
                        borderRadius: "16px",
                        padding: isMobile ? "1rem" : "1.25rem 1.5rem",
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "center",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        marginBottom: "1.25rem",
                        backdropFilter: "blur(8px)",
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <p style={sectionLabelStyle}>My Preferences</p>
                                <Link href="/survey" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline" }}>
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
                                <div style={{ textAlign: "center", padding: "1.25rem 0" }}>
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <p style={sectionLabelStyle}>My Collection</p>
                                <Link href="/my-products" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline" }}>
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
                                <button style={{ ...pinkOutlineBtnStyle, width: "100%" }}>
                                    View all products
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Recently added */}
                    <div className="animate-fade-in-delay">
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                        }}>
                            <p style={sectionLabelStyle}>Recently Added</p>
                            <Link href="/my-products" style={{ fontSize: "0.75rem", color: "#ec4899", textDecoration: "underline" }}>
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
                                <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💄</p>
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
                © {new Date().getFullYear()} LUMINALAB. All rights reserved.
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
            borderRadius: "12px",
            padding: "0.875rem 0.75rem",
            textAlign: "center",
        }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ec4899", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.3rem" }}>{label}</p>
        </div>
    );
}

function ProductMiniCard({ product }: { product: UserProduct }) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.85)",
            border: "2px solid #f9a8d4",
            borderRadius: "16px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            backdropFilter: "blur(8px)",
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

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    border: "2px solid #f9a8d4",
    borderRadius: "16px",
    padding: "1.25rem 1.5rem",
    backdropFilter: "blur(8px)",
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

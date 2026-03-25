"use client";

import { useState, useTransition } from "react";
import { savePreferences, UserPreferences } from "@/app/survey/actions";
import { OCCASIONS, OCCASION_INTENT_MAP } from "@/lib/recommendations/occasion-config";
import type { OccasionKey } from "@/lib/recommendations/occasion-config";

interface Props {
    brands: string[];
    initialPrefs?: UserPreferences | null;
    /** Called after successful save or skip */
    onComplete?: () => void;
    /** Is this shown as a modal overlay? */
    isOverlay?: boolean;
}

const PRODUCT_TYPES = [
    { id: "foundation", label: "Base / Foundation" },
    { id: "lipstick", label: "Lips / Lipstick" },
    { id: "blush", label: "Cheeks / Blush" },
    { id: "other", label: "Eyes" },
];

const SKIN_TYPES = [
    { id: "oily", label: "Oily" },
    { id: "dry", label: "Dry" },
    { id: "combination", label: "Combination" },
    { id: "sensitive", label: "Sensitive" },
];

const FINISHES = [
    { id: "matte", label: "Matte" },
    { id: "dewy", label: "Dewy" },
    { id: "satin", label: "Satin" },
    { id: "natural", label: "Natural" },
    { id: "glossy", label: "Glossy" },
];

export default function UserPreferenceSurvey({ brands, initialPrefs, onComplete, isOverlay }: Props) {
    const [budgetMin, setBudgetMin] = useState(initialPrefs?.budget_min ?? 0);
    const [budgetMax, setBudgetMax] = useState(initialPrefs?.budget_max ?? 2500);
    const [selectedBrands, setSelectedBrands] = useState<string[]>(initialPrefs?.preferred_brands ?? []);
    const [productTypes, setProductTypes] = useState<string[]>(initialPrefs?.product_types ?? []);
    const [occasion, setOccasion] = useState<OccasionKey>((initialPrefs?.occasion as OccasionKey) ?? "everyday");
    const [skinType, setSkinType] = useState<string>(initialPrefs?.skin_type ?? "");
    const [isCrueltyFree, setIsCrueltyFree] = useState(initialPrefs?.is_cruelty_free ?? false);
    const [isVegan, setIsVegan] = useState(initialPrefs?.is_vegan ?? false);
    const [prefersLocal, setPrefersLocal] = useState(initialPrefs?.prefers_local ?? false);
    const [finishes, setFinishes] = useState<string[]>(initialPrefs?.finish_preferences ?? []);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function toggle<T>(arr: T[], val: T): T[] {
        return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    }

    function handleFinish() {
        startTransition(async () => {
            const result = await savePreferences({
                budget_min: budgetMin,
                budget_max: budgetMax,
                preferred_brands: selectedBrands,
                product_types: productTypes,
                skin_type: skinType,
                is_cruelty_free: isCrueltyFree,
                is_vegan: isVegan,
                prefers_local: prefersLocal,
                finish_preferences: finishes,
                occasion,
            });
            if (result?.error) {
                setError(result.error);
            } else {
                onComplete?.();
            }
        });
    }

    function handleSkip() {
        onComplete?.();
    }

    const inner = (
        <div style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: "24px",
            border: "2px solid #f9a8d4",
            boxShadow: "0 8px 40px rgba(236,72,153,0.12)",
            width: "100%",
            maxWidth: "680px",
            maxHeight: isOverlay ? "85vh" : undefined,
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(12px)",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{
                padding: "2rem 2rem 1rem",
                borderBottom: "1px solid #fce7f3",
                flexShrink: 0,
                textAlign: "center",
            }}>
                <h2 style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: "#ec4899",
                    margin: 0,
                }}>
                    User Preference Survey
                </h2>
            </div>

            {/* Scrollable body */}
            <div style={{
                overflowY: "auto",
                flex: 1,
                padding: "1.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem",
            }}>

                {/* Q1 — Budget */}
                <section>
                    <QuestionLabel num={1} text="What is your typical budget for makeup products?" />
                    <div style={{ marginTop: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                            <span style={labelSm}>PHP {budgetMin.toLocaleString()}</span>
                            <span style={labelSm}>PHP {budgetMax.toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ ...labelSm, minWidth: 30 }}>Min</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={5000}
                                    step={50}
                                    value={budgetMin}
                                    onChange={e => {
                                        const v = Number(e.target.value);
                                        setBudgetMin(Math.min(v, budgetMax - 50));
                                    }}
                                    style={rangeStyle}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ ...labelSm, minWidth: 30 }}>Max</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={5000}
                                    step={50}
                                    value={budgetMax}
                                    onChange={e => {
                                        const v = Number(e.target.value);
                                        setBudgetMax(Math.max(v, budgetMin + 50));
                                    }}
                                    style={rangeStyle}
                                />
                            </div>
                        </div>
                        <p style={{ ...labelSm, marginTop: "0.5rem", color: "#ec4899", fontWeight: 600 }}>
                            Range: PHP {budgetMin.toLocaleString()} – PHP {budgetMax.toLocaleString()}
                        </p>
                    </div>
                </section>

                <Divider />

                {/* Q2 — Brands */}
                <section>
                    <QuestionLabel num={2} text="Which brands do you prefer or are interested in?" italic="(Multiple selection)" />
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                    }}>
                        {brands.map(brand => (
                            <CheckboxItem
                                key={brand}
                                label={brand}
                                checked={selectedBrands.includes(brand)}
                                onChange={() => setSelectedBrands(prev => toggle(prev, brand))}
                            />
                        ))}
                    </div>
                </section>

                <Divider />

                {/* Q3 — Product types */}
                <section>
                    <QuestionLabel num={3} text="What types of makeup products are you most interested in?" italic="(Multiple selection)" />
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                    }}>
                        {PRODUCT_TYPES.map(pt => (
                            <CheckboxItem
                                key={pt.id}
                                label={pt.label}
                                checked={productTypes.includes(pt.id)}
                                onChange={() => setProductTypes(prev => toggle(prev, pt.id))}
                            />
                        ))}
                    </div>
                </section>

                <Divider />

                {/* Q4 — Occasion */}
                <section>
                    <QuestionLabel num={4} text="What's the occasion you're dressing for?" italic="(Select one)" />
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.625rem",
                        marginTop: "0.875rem",
                    }}>
                        {OCCASIONS.map(key => {
                            const intent = OCCASION_INTENT_MAP[key];
                            const isSelected = occasion === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setOccasion(key)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: "0.2rem",
                                        padding: "0.75rem 0.875rem",
                                        borderRadius: "12px",
                                        border: `2px solid ${isSelected ? "#ec4899" : "#f9a8d4"}`,
                                        background: isSelected
                                            ? "linear-gradient(135deg, #fce7f3, #fbcfe8)"
                                            : "rgba(255,255,255,0.7)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.15s ease",
                                        boxShadow: isSelected
                                            ? "0 2px 12px rgba(236,72,153,0.18)"
                                            : "none",
                                        transform: isSelected ? "scale(1.02)" : "scale(1)",
                                    }}
                                >
                                    <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{intent.icon}</span>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: "0.8rem",
                                        color: isSelected ? "#be185d" : "#374151",
                                        lineHeight: 1.25,
                                    }}>
                                        {intent.label}
                                    </span>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        color: isSelected ? "#db2777" : "#9ca3af",
                                        fontStyle: "italic",
                                        lineHeight: 1.2,
                                    }}>
                                        {intent.descriptor}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <Divider />

                {/* Q5 — Skin type */}
                <section>
                    <QuestionLabel num={5} text="What is your skin type?" />
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                    }}>
                        {SKIN_TYPES.map(st => (
                            <RadioItem
                                key={st.id}
                                label={st.label}
                                name="skin_type"
                                checked={skinType === st.id}
                                onChange={() => setSkinType(st.id)}
                            />
                        ))}
                    </div>
                </section>

                <Divider />

                {/* Q6 — Values */}
                <section>
                    <QuestionLabel num={6} text="What values matter most to you?" italic="(Multiple selection)" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <CheckboxItem
                            label="🐰 Cruelty-free"
                            checked={isCrueltyFree}
                            onChange={() => setIsCrueltyFree(v => !v)}
                        />
                        <CheckboxItem
                            label="🌱 Vegan"
                            checked={isVegan}
                            onChange={() => setIsVegan(v => !v)}
                        />
                        <CheckboxItem
                            label="🇵🇭 Support local brands"
                            checked={prefersLocal}
                            onChange={() => setPrefersLocal(v => !v)}
                        />
                    </div>
                </section>

                <Divider />

                {/* Q7 — Finish preferences */}
                <section>
                    <QuestionLabel num={7} text="What finish do you prefer?" italic="(Multiple selection)" />
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                    }}>
                        {FINISHES.map(f => (
                            <CheckboxItem
                                key={f.id}
                                label={f.label}
                                checked={finishes.includes(f.id)}
                                onChange={() => setFinishes(prev => toggle(prev, f.id))}
                            />
                        ))}
                    </div>
                </section>

                {error && (
                    <p style={{ color: "#ef4444", fontSize: "0.875rem", textAlign: "center" }}>
                        ⚠️ {error}
                    </p>
                )}
            </div>

            {/* Sticky footer buttons */}
            <div style={{
                borderTop: "1px solid #fce7f3",
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                flexShrink: 0,
                background: "rgba(255,255,255,0.95)",
            }}>
                <button
                    onClick={handleSkip}
                    disabled={isPending}
                    style={skipBtnStyle}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fce7f3";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                >
                    Skip for Now
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isPending}
                    style={finishBtnStyle}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#db2777";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "#ec4899";
                    }}
                >
                    {isPending ? "Saving…" : "Finish"}
                </button>
            </div>
        </div>
    );

    if (!isOverlay) return (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            {inner}
        </div>
    );

    // Overlay / modal variant
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(253,232,244,0.72)",
            backdropFilter: "blur(6px)",
        }}>
            {inner}
        </div>
    );
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function QuestionLabel({ num, text, italic }: { num: number; text: string; italic?: string }) {
    return (
        <p style={{ margin: 0, fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}>
            {num}.&nbsp;&nbsp;{text}
            {italic && (
                <span style={{ fontWeight: 400, fontStyle: "italic", color: "#6b7280", marginLeft: "0.35rem", fontSize: "0.875rem" }}>
                    {italic}
                </span>
            )}
        </p>
    );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            padding: "0.4rem 0.6rem",
            borderRadius: "8px",
            transition: "background 0.15s",
            background: checked ? "#fce7f3" : "transparent",
            userSelect: "none",
        }}>
            <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "5px",
                border: `2px solid ${checked ? "#ec4899" : "#d1d5db"}`,
                background: checked ? "#ec4899" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
            }}>
                {checked && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
            <span style={{ fontSize: "0.875rem", color: "#374151" }}>{label}</span>
        </label>
    );
}

function RadioItem({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: () => void }) {
    return (
        <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            padding: "0.4rem 0.6rem",
            borderRadius: "8px",
            background: checked ? "#fce7f3" : "transparent",
            userSelect: "none",
        }}>
            <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: `2px solid ${checked ? "#ec4899" : "#d1d5db"}`,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
            }}>
                {checked && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ec4899" }} />}
            </div>
            <input type="radio" name={name} checked={checked} onChange={onChange} style={{ display: "none" }} />
            <span style={{ fontSize: "0.875rem", color: "#374151" }}>{label}</span>
        </label>
    );
}

function Divider() {
    return <hr style={{ border: "none", borderTop: "1px solid #fce7f3", margin: 0 }} />;
}

// ──────────────────────────────────────────────
// Shared inline styles
// ──────────────────────────────────────────────

const labelSm: React.CSSProperties = {
    fontSize: "0.8rem",
    color: "#6b7280",
    fontWeight: 500,
};

const rangeStyle: React.CSSProperties = {
    flex: 1,
    accentColor: "#ec4899",
    cursor: "pointer",
    height: "4px",
};

const skipBtnStyle: React.CSSProperties = {
    padding: "0.6rem 1.75rem",
    borderRadius: "999px",
    border: "1.5px solid #ec4899",
    background: "transparent",
    color: "#ec4899",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background 0.15s",
};

const finishBtnStyle: React.CSSProperties = {
    padding: "0.6rem 1.75rem",
    borderRadius: "999px",
    border: "none",
    background: "#ec4899",
    color: "white",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background 0.15s",
};

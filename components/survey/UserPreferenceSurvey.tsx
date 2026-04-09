"use client";

import { useState, useTransition } from "react";
import { savePreferences, UserPreferences } from "@/app/survey/actions";
import { OCCASIONS, OCCASION_INTENT_MAP } from "@/lib/recommendations/occasion-config";
import type { OccasionKey } from "@/lib/recommendations/occasion-config";
import {
    X,
    Briefcase,
    Heart,
    PartyPopper,
    Crown,
    CircleDot,
    Sun,
    Rabbit,
    Leaf,
    MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
    brands: string[];
    initialPrefs?: UserPreferences | null;
    /** Called after successful save, skip, or close */
    onComplete?: () => void;
    /** Is this shown as a modal overlay? */
    isOverlay?: boolean;
}

const PRODUCT_TYPES = [
    { id: "foundation", label: "Base / Foundation" },
    { id: "lipstick", label: "Lips / Lipstick" },
    { id: "blush", label: "Cheeks / Blush" },
    // { id: "other", label: "Eyes" },
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

// Lucide icon name → component mapping for occasions
const OCCASION_ICONS: Record<string, LucideIcon> = {
    Briefcase,
    Heart,
    PartyPopper,
    Crown,
    CircleDot,
    Sun,
};

export default function UserPreferenceSurvey({ brands, initialPrefs, onComplete, isOverlay }: Props) {
    const isEditing = !!initialPrefs;

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

    // Clamp min/max when either thumb moves
    function handleRangeMin(val: number) {
        setBudgetMin(Math.min(val, budgetMax - 50));
    }
    function handleRangeMax(val: number) {
        setBudgetMax(Math.max(val, budgetMin + 50));
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

    function handleSkipOrCancel() {
        onComplete?.();
    }

    // Budget bar fill percentage
    const minPct = (budgetMin / 5000) * 100;
    const maxPct = (budgetMax / 5000) * 100;

    const inner = (
        <div style={{
            background: "rgba(255, 255, 255, 0.50)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            boxShadow: `
  0 8px 32px rgba(0,0,0,0.08),
  inset 0 1px 0 rgba(255,255,255,0.5)
`,
            borderRadius: "24px",
            border: "2px solid #f9a8d4",
            width: "100%",
            maxWidth: "780px",
            maxHeight: isOverlay ? "85vh" : undefined,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
        }}>
            <style>{`
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
            .dual-range-input-survey::-webkit-slider-thumb {
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
            .dual-range-input-survey::-moz-range-thumb {
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
            {/* Header with X close button */}
            <div style={{
                padding: "2rem 2rem 1rem",
                borderBottom: "1px solid #fce7f3",
                flexShrink: 0,
                textAlign: "center",
                position: "relative",
            }}>
                <button
                    onClick={handleSkipOrCancel}
                    style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        padding: "0.25rem",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = "#ec4899";
                        e.currentTarget.style.background = "#fce7f3";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = "#9ca3af";
                        e.currentTarget.style.background = "none";
                    }}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
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

                <section>
                    <QuestionLabel num={1} text="What is your typical budget for makeup products?" />
                    <div style={{
                        background: "#fef7ff",
                        borderRadius: "14px",
                        padding: "1rem 1.25rem",
                        border: "1px solid #fce7f3",
                        marginTop: "0.5rem"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280" }}>
                                PHP {budgetMin.toLocaleString()}
                            </span>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b7280" }}>
                                PHP {budgetMax.toLocaleString()}
                            </span>
                        </div>
                        {/* Dual-thumb range slider */}
                        <div style={{ position: "relative", height: "24px" }}>
                            {/* Track background */}
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
                            {/* Active range fill */}
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
                            {/* Min thumb */}
                            <input
                                type="range"
                                min={0}
                                max={5000}
                                step={50}
                                value={budgetMin}
                                onChange={e => handleRangeMin(Number(e.target.value))}
                                style={dualRangeInput}
                                className="dual-range-input-survey"
                            />
                            {/* Max thumb */}
                            <input
                                type="range"
                                min={0}
                                max={5000}
                                step={50}
                                value={budgetMax}
                                onChange={e => handleRangeMax(Number(e.target.value))}
                                style={dualRangeInput}
                                className="dual-range-input-survey"
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
                            PHP {budgetMin.toLocaleString()} — PHP {budgetMax.toLocaleString()}
                        </p>
                    </div>
                </section>

                <Divider />

                {/* Q2 — Brands */}
                <section>
                    <QuestionLabel num={2} text="Which brands do you prefer or are interested in?" italic="(Multiple selection)" />
                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem",
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
                        display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem",
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
                    <p style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.375rem", fontStyle: "italic", marginLeft: "0.375rem" }}>
                        Leave empty to show all types
                    </p>
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
                            const IconComp = OCCASION_ICONS[intent.icon];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setOccasion(key)}
                                    className={`occasion-grid-option ${isSelected ? "active" : ""}`}
                                >
                                    <span style={{
                                        color: isSelected ? "#be185d" : "#9ca3af",
                                        display: "flex",
                                        flexShrink: 0,
                                    }}>
                                        {IconComp && <IconComp size={20} />}
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
                </section>

                <Divider />

                {/* Q5 — Skin type */}
                <section>
                    <QuestionLabel num={5} text="What is your skin type?" />
                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem",
                    }}>
                        {SKIN_TYPES.map(st => (
                            <RadioItem
                                key={st.id}
                                label={st.label}
                                name="skin_type"
                                checked={skinType === st.id}
                                onChange={() => setSkinType(prev => prev === st.id ? "" : st.id)}
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.375rem", fontStyle: "italic", marginLeft: "0.375rem" }}>
                        Leave empty to show products for all skin types
                    </p>
                </section>

                <Divider />

                {/* Q6 — Values (Lucide icons instead of emojis) */}
                <section>
                    <QuestionLabel num={6} text="What values matter most to you?" italic="(Multiple selection)" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <CheckboxItem
                            label="Cruelty-free"
                            icon={<Rabbit size={16} />}
                            checked={isCrueltyFree}
                            onChange={() => setIsCrueltyFree(v => !v)}
                        />
                        <CheckboxItem
                            label="Vegan"
                            icon={<Leaf size={16} />}
                            checked={isVegan}
                            onChange={() => setIsVegan(v => !v)}
                        />
                        <CheckboxItem
                            label="Support local brands"
                            icon={<MapPin size={16} />}
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
                        display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem",
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
                    <p style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.375rem", fontStyle: "italic", marginLeft: "0.375rem" }}>
                        Leave empty to show all finishes
                    </p>
                </section>

                {error && (
                    <p style={{ color: "#ef4444", fontSize: "0.875rem", textAlign: "center" }}>
                        {error}
                    </p>
                )}
            </div>

            {/* Sticky footer buttons — dynamic based on editing vs first-time */}
            <div style={{
                borderTop: "1px solid #fce7f3",
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                flexShrink: 0,
            }}>
                <button
                    onClick={handleSkipOrCancel}
                    disabled={isPending}
                    className="btn btn-secondary"
                >
                    {isEditing ? "Cancel" : "Skip for Now"}
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isPending}
                    className="btn btn-primary"
                    style={{ padding: "0.6rem 1.75rem" }}
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
        <div className="filter-section-title" style={{ marginBottom: "0.625rem", margin: 0 }}>
            {num}. {text}
            {italic && (
                <span style={{ fontWeight: 400, fontStyle: "italic", color: "#9ca3af", marginLeft: "0.5rem", letterSpacing: "normal", textTransform: "none" }}>
                    {italic}
                </span>
            )}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange, icon }: {
    label: string; checked: boolean; onChange: () => void; icon?: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`filter-chip ${checked ? 'active' : ''}`}
        >
            {icon && <span style={{ color: checked ? "#be185d" : "#9ca3af", display: "flex", alignItems: "center" }}>{icon}</span>}
            {label}
        </button>
    );
}

function RadioItem({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`filter-chip ${checked ? 'active' : ''}`}
        >
            {label}
        </button>
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

// Dual-range input — overlaid transparent sliders
const dualRangeInput: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    appearance: "none",
    WebkitAppearance: "none",
    background: "transparent",
    pointerEvents: "none",
    cursor: "pointer",
    margin: 0,
    padding: 0,
};

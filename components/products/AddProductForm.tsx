"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Plus, X } from "lucide-react";
import type { DuplicateCandidate, UserProduct } from "@/lib/products/types";
import { searchCatalogProducts, addCatalogProduct, addCustomProduct } from "@/lib/products/actions";

interface AddProductFormProps {
    onProductAdded: () => void;
    ownedProducts?: UserProduct[];
}

export default function AddProductForm({ onProductAdded, ownedProducts = [] }: AddProductFormProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
    const [searching, setSearching] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [name, setName] = useState("");
    const [brandName, setBrandName] = useState("");
    const [shadeName, setShadeName] = useState("");
    const [productType, setProductType] = useState("foundation");
    const [finish, setFinish] = useState("matte");
    const [hexColor, setHexColor] = useState("#D4A574");
    const [price, setPrice] = useState("");

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setCandidates([]); return; }
        setSearching(true);
        try {
            const results = await searchCatalogProducts(q);
            const ownedKeys = new Set(
                ownedProducts.map((p) =>
                    `${p.brandName.toLowerCase()}|${p.shadeName?.toLowerCase() ?? ""}|${p.hexColor?.toLowerCase() ?? ""}`
                )
            );
            const filtered = results.filter((c) => {
                const key = `${c.brandName.toLowerCase()}|${c.shadeName?.toLowerCase() ?? ""}|${c.hexColor?.toLowerCase() ?? ""}`;
                return !ownedKeys.has(key);
            });
            setCandidates(filtered);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearching(false);
        }
    }, [ownedProducts]);

    useEffect(() => {
        const timer = setTimeout(() => search(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, search]);

    const handleClaimCatalog = async (candidate: DuplicateCandidate) => {
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await addCatalogProduct(candidate.csvIndex);
            if (result.success) {
                setMessage({ type: "success", text: `Added "${candidate.brandName} — ${candidate.shadeName}" to your collection!` });
                setSearchQuery("");
                setCandidates([]);
                onProductAdded();
            } else {
                setMessage({ type: "error", text: result.error ?? "Failed to add product" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !brandName.trim()) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await addCustomProduct({
                name: name.trim(),
                brandName: brandName.trim(),
                shadeName: shadeName.trim(),
                productType,
                finish,
                hexColor,
                price: price ? parseFloat(price) : undefined,
            });
            if (result.success) {
                setMessage({ type: "success", text: `Added "${brandName} — ${name}" as a custom product!` });
                setName(""); setBrandName(""); setShadeName("");
                setProductType("foundation"); setFinish("matte");
                setHexColor("#D4A574"); setPrice("");
                setShowCustomModal(false);
                setSearchQuery("");
                onProductAdded();
            } else {
                setMessage({ type: "error", text: result.error ?? "Failed to add product" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                .custom-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.35);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .custom-modal {
                    background: #fff;
                    border-radius: 20px;
                    border: 2px solid #f9a8d4;
                    padding: 1.75rem;
                    width: 100%;
                    max-width: 520px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 8px 40px rgba(244,114,182,0.18);
                }
            `}</style>

            {/* ── Main section ── */}
            <div className="add-product-section">
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={18} color="#ec4899" />
                    Add a Product
                </h2>

                {message && (
                    <div className="animate-fade-in" style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        background: message.type === "success" ? "#dcfce7" : "#fce7e7",
                        color: message.type === "success" ? "#166534" : "#991b1b",
                        border: `1.5px solid ${message.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ position: "relative", marginBottom: "1rem" }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search for a product (e.g. Happy Skin, Maybelline…)"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); }}
                        style={{ paddingRight: "2.5rem" }}
                    />
                    {searching && (
                        <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" }}>
                            <div className="spinner" />
                        </div>
                    )}
                </div>

                {candidates.length > 0 && (
                    <div className="animate-fade-in" style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: 500 }}>
                            🔍 Found in our catalog — tap to add:
                        </p>
                        <div style={{
                            maxHeight: "260px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            paddingRight: "0.25rem",
                        }}>
                            {candidates.map((c) => (
                                <button
                                    key={`${c.csvIndex}`}
                                    className="search-result-card"
                                    disabled={submitting}
                                    onClick={() => handleClaimCatalog(c)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        {c.hexColor && (
                                            <div style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                backgroundColor: c.hexColor,
                                                border: "2px solid #f9a8d4",
                                                flexShrink: 0,
                                            }} />
                                        )}
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>
                                                {c.brandName}
                                            </div>
                                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>
                                                {c.productName}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                {c.shadeName} · {formatType(c.productType)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="product-badge badge-catalog">From Catalog</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    className="btn btn-secondary btn-full"
                    onClick={() => setShowCustomModal(true)}
                    style={{ marginBottom: "0.5rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
                >
                    <Plus size={15} />
                    Add a custom product
                </button>
            </div>

            {/* ── Modal via portal — escapes backdrop-filter stacking context ── */}
            {showCustomModal && typeof document !== "undefined" && createPortal(
                <div className="custom-modal-overlay" onClick={() => setShowCustomModal(false)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                            <div>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                                    New Custom Product
                                </h3>
                                <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: "0.25rem 0 0" }}>
                                    Add a product that isn&apos;t in our catalog.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCustomModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: "0.25rem" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddCustom} className="custom-product-form">
                            <div className="form-grid">
                                <div>
                                    <label className="label">Brand Name *</label>
                                    <input className="input" required value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Happy Skin" />
                                </div>
                                <div>
                                    <label className="label">Product Name *</label>
                                    <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lip Mallow Tint" />
                                </div>
                                <div>
                                    <label className="label">Shade Name</label>
                                    <input className="input" value={shadeName} onChange={(e) => setShadeName(e.target.value)} placeholder="e.g. Vibin'" />
                                </div>
                                <div>
                                    <label className="label">Product Type</label>
                                    <select className="input" value={productType} onChange={(e) => setProductType(e.target.value)}>
                                        <option value="foundation">Foundation</option>
                                        <option value="lipstick">Lipstick</option>
                                        <option value="lip">Lip</option>
                                        <option value="blush">Blush</option>
                                        <option value="concealer">Concealer</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Finish</label>
                                    <select className="input" value={finish} onChange={(e) => setFinish(e.target.value)}>
                                        <option value="matte">Matte</option>
                                        <option value="dewy">Dewy</option>
                                        <option value="satin">Satin</option>
                                        <option value="natural">Natural</option>
                                        <option value="glossy">Glossy</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Price (PHP)</label>
                                    <input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 599" />
                                </div>
                            </div>

                            <div style={{ marginTop: "0.75rem" }}>
                                <label className="label">Color</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <input
                                        type="color"
                                        value={hexColor}
                                        onChange={(e) => setHexColor(e.target.value)}
                                        style={{ width: "48px", height: "48px", border: "2px solid #f9a8d4", borderRadius: "12px", cursor: "pointer", padding: "2px" }}
                                    />
                                    <input className="input" value={hexColor} onChange={(e) => setHexColor(e.target.value)} placeholder="#RRGGBB" style={{ maxWidth: "140px" }} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                                    {submitting ? <><span className="spinner" /> Adding…</> : "Add Product"}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function formatType(type: string): string {
    const map: Record<string, string> = {
        lip: "Lip", base: "Base", blush: "Blush", eyes: "Eyes",
        foundation: "Foundation", concealer: "Concealer", lipstick: "Lipstick",
    };
    return map[type?.toLowerCase()] ?? type;
}
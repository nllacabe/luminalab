"use client";

import { useState, useEffect, useCallback } from "react";
import type { DuplicateCandidate } from "@/lib/products/types";
import { searchCatalogProducts, addCatalogProduct, addCustomProduct } from "@/lib/products/actions";

interface AddProductFormProps {
    onProductAdded: () => void;
}

export default function AddProductForm({ onProductAdded }: AddProductFormProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
    const [searching, setSearching] = useState(false);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Custom form fields
    const [name, setName] = useState("");
    const [brandName, setBrandName] = useState("");
    const [shadeName, setShadeName] = useState("");
    const [productType, setProductType] = useState("foundation");
    const [finish, setFinish] = useState("matte");
    const [hexColor, setHexColor] = useState("#D4A574");
    const [price, setPrice] = useState("");

    // Debounced search
    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setCandidates([]);
            return;
        }
        setSearching(true);
        try {
            const results = await searchCatalogProducts(q);
            setCandidates(results);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearching(false);
        }
    }, []);

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
                // Reset form
                setName("");
                setBrandName("");
                setShadeName("");
                setProductType("foundation");
                setFinish("matte");
                setHexColor("#D4A574");
                setPrice("");
                setShowCustomForm(false);
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
        <div className="add-product-section">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", marginBottom: "1rem" }}>
                ✨ Add a Product
            </h2>

            {/* Status message */}
            {message && (
                <div
                    className="animate-fade-in"
                    style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        background: message.type === "success" ? "#dcfce7" : "#fce7e7",
                        color: message.type === "success" ? "#166534" : "#991b1b",
                        border: `1.5px solid ${message.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Search bar */}
            <div style={{ position: "relative", marginBottom: "1rem" }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Search for a product (e.g. Happy Skin, Maybelline…)"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowCustomForm(false);
                    }}
                    style={{ paddingRight: "2.5rem" }}
                />
                {searching && (
                    <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" }}>
                        <div className="spinner" />
                    </div>
                )}
            </div>

            {/* Catalog search results */}
            {candidates.length > 0 && (
                <div className="animate-fade-in" style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: 500 }}>
                        🔍 Found in our catalog — tap to add:
                    </p>
                    <div className="search-results-grid">
                        {candidates.map((c) => (
                            <button
                                key={`${c.csvIndex}`}
                                className="search-result-card"
                                disabled={submitting}
                                onClick={() => handleClaimCatalog(c)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    {c.hexColor && (
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                backgroundColor: c.hexColor,
                                                border: "2px solid #f9a8d4",
                                                flexShrink: 0,
                                            }}
                                        />
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

            {/* "Add as custom" toggle */}
            {!showCustomForm && (
                <button
                    className="btn btn-outline btn-full"
                    onClick={() => setShowCustomForm(true)}
                    style={{ marginBottom: "0.5rem" }}
                >
                    ➕ Add a custom product manually
                </button>
            )}

            {/* Custom product form */}
            {showCustomForm && (
                <form onSubmit={handleAddCustom} className="animate-fade-in custom-product-form">
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.75rem" }}>
                        New Custom Product
                    </h3>

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
                                style={{
                                    width: "48px", height: "48px", border: "2px solid #f9a8d4",
                                    borderRadius: "12px", cursor: "pointer", padding: "2px",
                                }}
                            />
                            <input className="input" value={hexColor} onChange={(e) => setHexColor(e.target.value)} placeholder="#RRGGBB" style={{ maxWidth: "140px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                            {submitting ? <><span className="spinner" /> Adding…</> : "Add Product"}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowCustomForm(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function formatType(type: string): string {
    const map: Record<string, string> = {
        lip: "Lip", base: "Base", blush: "Blush", eyes: "Eyes",
        foundation: "Foundation", concealer: "Concealer", lipstick: "Lipstick",
    };
    return map[type?.toLowerCase()] ?? type;
}

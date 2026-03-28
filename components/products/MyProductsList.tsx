"use client";

import { useState } from "react";
import { Package, Pencil, X } from "lucide-react";
import type { UserProduct } from "@/lib/products/types";
import { removeUserProduct } from "@/lib/products/actions";

interface MyProductsListProps {
    products: UserProduct[];
    onRefresh: () => void;
}

export default function MyProductsList({ products, onRefresh }: MyProductsListProps) {
    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemove = async (product: UserProduct) => {
        if (!confirm(`Remove "${product.brandName} — ${product.shadeName}" from your collection?`)) return;
        setRemovingId(product.id);
        try {
            const result = await removeUserProduct(product.id);
            if (result.success) {
                onRefresh();
            } else {
                alert(result.error ?? "Failed to remove product");
            }
        } finally {
            setRemovingId(null);
        }
    };

    if (products.length === 0) {
        return (
            <div className="animate-fade-in" style={{
                textAlign: "center",
                padding: "3rem 2rem",
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: "16px",
                border: "2px dashed #f9a8d4",
            }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem", color: "#f9a8d4" }}>
                    <Package size={40} />
                </div>
                <h3 style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>No products yet</h3>
                <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                    Search for a product above or add a custom one to start building your collection.
                </p>
            </div>
        );
    }

    return (
        <div>
            <style>{`
                .my-products-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (max-width: 480px) {
                    .my-products-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.5rem;
                    }
                }
            `}</style>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={18} color="#ec4899" />
                My Collection ({products.length})
            </h2>

            <div className="my-products-grid">
                {products.map((product, idx) => (
                    <div
                        key={product.id}
                        className="my-product-card animate-fade-in"
                        style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                        {/* Color swatch top bar */}
                        <div style={{
                            height: "6px",
                            borderRadius: "4px 4px 0 0",
                            background: product.hexColor || "linear-gradient(90deg, #f9a8d4, #ec4899)",
                        }} />

                        <div style={{ padding: "0.625rem" }}>
                            {/* Badge + remove */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                                <span className={`product-badge ${product.source === "catalog" ? "badge-catalog" : "badge-custom"}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                    {product.source === "catalog" ? <Package size={10} /> : <Pencil size={10} />}
                                    {product.source === "catalog" ? "Catalog" : "Custom"}
                                </span>
                                <button
                                    className="remove-btn"
                                    disabled={removingId === product.id}
                                    onClick={() => handleRemove(product)}
                                    title="Remove product"
                                    style={{ display: "flex", alignItems: "center" }}
                                >
                                    {removingId === product.id ? "…" : <X size={13} />}
                                </button>
                            </div>

                            {/* Product info */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {product.hexColor && (
                                    <div style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "50%",
                                        backgroundColor: product.hexColor,
                                        border: "2px solid #f9a8d4",
                                        boxShadow: `0 2px 8px ${product.hexColor}44`,
                                        flexShrink: 0,
                                    }} />
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "0.625rem", color: "#9ca3af", fontWeight: 500, marginBottom: "0.1rem" }}>
                                        {product.brandName}
                                    </div>
                                    <div style={{
                                        fontWeight: 800,
                                        fontSize: "0.8125rem",
                                        color: "#1f2937",
                                        lineHeight: 1.2,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}>
                                        {product.name}
                                    </div>
                                    {product.shadeName && (
                                        <div style={{ fontSize: "0.6875rem", color: "#6b7280" }}>
                                            {product.shadeName}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Type + finish + price */}
                            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                                <span className="product-tag">{formatType(product.productType)}</span>
                                {product.finish && <span className="product-tag">{product.finish}</span>}
                                {product.price > 0 && <span className="product-tag">₱{product.price}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
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
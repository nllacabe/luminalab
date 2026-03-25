"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserProduct } from "@/lib/products/types";
import { getUserProducts } from "@/lib/products/actions";
import AddProductForm from "@/components/products/AddProductForm";
import MyProductsList from "@/components/products/MyProductsList";

export default function MyProductsClient() {
    const [products, setProducts] = useState<UserProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUserProducts();
            setProducts(data);
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div className="my-products-layout">
            {/* Left column — product collection */}
            <div className="my-products-col-left">
                {loading && products.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <div className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
                        <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginTop: "0.75rem" }}>
                            Loading your products…
                        </p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <MyProductsList products={products} onRefresh={refresh} />
                    </div>
                )}
            </div>

            {/* Right column — search & add (scrollable) */}
            <div className="my-products-col-right">
                <div className="animate-fade-in">
                    <AddProductForm onProductAdded={refresh} />
                </div>
            </div>
        </div>
    );
}

import type { Metadata } from "next";
import MyProductsClient from "@/components/products/MyProductsClient";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
    title: "My Products — LUMINALAB",
    description:
        "Manage your personal product collection. Add owned products for more personalized shade recommendations.",
};

export default function MyProductsPage() {
    return (
        <div className="page-wrapper">
            {/* Sparkles */}
            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="45%" left="1%" size={12} delay={0.6} />
            <Sparkle top="50%" right="2%" size={16} delay={0.9} />
            <Sparkle top="85%" left="4%" size={14} delay={1.2} />
            <Sparkle top="90%" right="6%" size={10} delay={0.5} />

            <Header isLoggedIn />

            {/* Page content */}
            <main style={{ flex: 1, padding: "1rem 1.5rem 2rem", position: "relative", zIndex: 1 }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h1 style={{
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            marginBottom: "0.5rem",
                            color: "#1f2937",
                        }}>
                            My Products
                        </h1>
                        <p style={{
                            color: "#6b7280",
                            fontSize: "1rem",
                            maxWidth: "480px",
                            margin: "0 auto",
                        }}>
                            Add products you own so we can personalize your recommendations
                            and avoid suggesting items you already have.
                        </p>
                    </div>

                    <MyProductsClient />
                </div>
            </main>

            {/* Footer */}
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

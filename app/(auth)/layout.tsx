import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="page-wrapper" style={{ flexDirection: "row" }}>
            {/* Sparkles */}
            <Sparkle top="10%" left="55%" size={14} delay={0} />
            <Sparkle top="30%" right="5%" size={12} delay={0.4} />
            <Sparkle top="70%" right="8%" size={16} delay={0.8} />
            <Sparkle top="85%" left="60%" size={10} delay={1.2} />

            {/* Left panel — branding */}
            <div
                style={{
                    display: "none",
                    flex: 1,
                    background: "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)",
                    padding: "3rem",
                    position: "relative",
                    overflow: "hidden",
                }}
                className="md:!flex md:flex-col md:justify-between"
            >
                <div style={{ position: "relative", zIndex: 1 }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="LUMINALAB" style={{ height: "40px" }} />
                    </Link>
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <blockquote style={{
                        fontSize: "1.25rem",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.9)",
                        fontWeight: 400,
                        borderLeft: "none",
                        padding: 0,
                        margin: 0,
                    }}>
                        &ldquo;Your skin tone is unique — your makeup should be too.&rdquo;
                    </blockquote>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "1rem" }}>
                        Skin color analysis &amp; personalized product recommendations.
                    </p>
                </div>
                {/* Decorative circles */}
                <div style={{
                    position: "absolute",
                    top: "-20%",
                    right: "-10%",
                    width: "400px",
                    height: "400px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "-15%",
                    left: "-5%",
                    width: "300px",
                    height: "300px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                }} />
            </div>

            {/* Right panel — form */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1.5rem",
                position: "relative",
                zIndex: 1,
            }}>
                {/* Mobile logo */}
                <div className="md:!hidden" style={{ marginBottom: "2rem" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="LUMINALAB" style={{ height: "40px" }} />
                    </Link>
                </div>
                {children}
            </div>
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

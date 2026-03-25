import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUMINALAB",
  description:
    "Discover your perfect makeup match with skin color analysis. Get personalized product recommendations tailored to your unique skin tone.",
};

export default function HomePage() {
  return (
    <div className="page-wrapper">
      {/* Sparkles */}
      <Sparkle top="8%" left="8%" size={18} delay={0} />
      <Sparkle top="12%" right="12%" size={14} delay={0.3} />
      <Sparkle top="55%" left="5%" size={12} delay={0.6} />
      <Sparkle top="60%" right="6%" size={16} delay={0.9} />

      {/* Logo header — centered */}
      <div className="logo-header" style={{ justifyContent: "center" }}>
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="LUMINALAB" style={{ height: "44px" }} />
        </Link>
      </div>

      {/* Nav */}
      <div className="pink-nav" style={{ justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/login" className="btn btn-ghost" style={{ fontSize: "0.9375rem" }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: "0.9375rem" }}>
            Get Started
          </Link>
        </div>
      </div>

      {/* Hero — two column layout */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        zIndex: 1,
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          width: "min(1000px, 100%)",
          alignItems: "stretch",
        }}>
          {/* Left card — text + CTAs */}
          <div style={{
            background: "rgba(255,255,255,0.75)",
            border: "2px solid #f9a8d4",
            borderRadius: "24px",
            padding: "3rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 32px rgba(236,72,153,0.08)",
          }}>
            <h1 style={{
              fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#ec4899",
              marginBottom: "0.25rem",
              letterSpacing: "-0.02em",
            }}>
              Your Skin Tone,
            </h1>
            <h1 style={{
              fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#ec4899",
              fontStyle: "italic",
              marginBottom: "1.75rem",
              letterSpacing: "-0.02em",
            }}>
              Your Match
            </h1>

            <p style={{
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "#4b5563",
              marginBottom: "2.5rem",
              maxWidth: "380px",
            }}>
              Analyze your skin color and discover makeup
              products that complement you. Empowering
              your beauty through color intelligence.
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
              maxWidth: "100%",
            }}>
              <Link href="/assessment" style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%",
                  padding: "0.875rem 1.5rem",
                  background: "#ec4899",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  letterSpacing: "0.02em",
                }}
                >
                  Quick Assessment
                </button>
              </Link>
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%",
                  padding: "0.875rem 1.5rem",
                  background: "transparent",
                  border: "2px solid #ec4899",
                  borderRadius: "10px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#ec4899",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  letterSpacing: "0.02em",
                }}
                >
                  Create Account &amp; Save Results
                </button>
              </Link>
            </div>
          </div>

          {/* Right card — hero image placeholder */}
          <div style={{
            background: "rgba(255,255,255,0.75)",
            border: "2px solid #f9a8d4",
            borderRadius: "24px",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 32px rgba(236,72,153,0.08)",
            minHeight: "460px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            {
              <img
                src="/hero.png"
                alt="Makeup products with pink ribbons"
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              />
            }
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              color: "#f9a8d4",
            }}>
            </div>
          </div>
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
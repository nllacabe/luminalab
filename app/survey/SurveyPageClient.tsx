"use client";

import { useRouter } from "next/navigation";
import UserPreferenceSurvey from "@/components/survey/UserPreferenceSurvey";
import type { UserPreferences } from "@/app/survey/actions";

interface Props {
    brands: string[];
    initialPrefs: UserPreferences | null;
}

export default function SurveyPageClient({ brands, initialPrefs }: Props) {
    const router = useRouter();

    function handleComplete() {
        router.push("/dashboard");
    }

    return (
        <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Sparkles */}
            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="80%" left="2%" size={12} delay={0.6} />
            <Sparkle top="90%" right="3%" size={16} delay={0.9} />

            {/* Logo */}
            <div className="logo-header" style={{ flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LUMINALAB" style={{ height: "44px" }} />
            </div>

            {/* Survey centered in remaining space */}
            <main style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1rem",
                position: "relative",
                zIndex: 1,
            }}>
                <UserPreferenceSurvey
                    brands={brands}
                    initialPrefs={initialPrefs}
                    onComplete={handleComplete}
                    isOverlay={false}
                />
            </main>
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

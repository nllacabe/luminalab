"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import SkinAnalyzer from "@/components/skin-analysis/SkinAnalyzer";
import Recommendations from "@/components/skin-analysis/Recommendations";
import AnalysisResults from "@/components/skin-analysis/AnalysisResults";
import type { SkinAnalysisResult } from "@/lib/analysis/skin-analyzer";
import Header from "@/components/layout/Header";

type Step = "upload" | "results" | "recommendations";

export default function AssessmentPage() {
    const [step, setStep] = useState<Step>("upload");
    const [result, setResult] = useState<SkinAnalysisResult | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session?.user);
        });
    }, []);

    if (step === "recommendations" && result) {
        return (
            <div className="page-wrapper">
                <Header isLoggedIn={isLoggedIn} />
                <div style={{ flex: 1 }}>
                    <Recommendations
                        userLab={result.averageLab}
                        onBack={() => setStep("results")}
                    />
                </div>
            </div>
        );
    }

    if (step === "results" && result && imageUrl) {
        return (
            <div className="page-wrapper">
                <Sparkle top="5%" left="3%" size={18} delay={0} />
                <Sparkle top="8%" right="5%" size={14} delay={0.3} />
                <Sparkle top="45%" left="1%" size={12} delay={0.6} />
                <Sparkle top="50%" right="2%" size={16} delay={0.9} />

                <Header isLoggedIn={isLoggedIn} />

                <main style={{ flex: 1, padding: "1rem 1.5rem 2rem", position: "relative", zIndex: 1 }}>
                    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1f2937" }}>
                                Analysis Results
                            </h1>
                            <p style={{ color: "#6b7280", fontSize: "1rem" }}>
                                Here are the skin tone regions detected by MediaPipe face landmarks.
                            </p>
                        </div>
                        <div className="animate-fade-in-delay">
                            <AnalysisResults
                                result={result}
                                imageUrl={imageUrl}
                                onProceed={() => setStep("recommendations")}
                            />
                        </div>
                        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                            <button
                                className="btn btn-pink underline"
                                onClick={() => {
                                    setStep("upload");
                                    setResult(null);
                                    setImageUrl(null);
                                }}
                            >
                                ← Upload New Photo
                            </button>
                        </div>
                    </div>
                </main>

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

    return (
        <div className="page-wrapper">
            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="45%" left="1%" size={12} delay={0.6} />
            <Sparkle top="50%" right="2%" size={16} delay={0.9} />
            <Sparkle top="85%" left="4%" size={14} delay={1.2} />
            <Sparkle top="90%" right="6%" size={10} delay={0.5} />

            <Header isLoggedIn={isLoggedIn} />

            <main style={{ flex: 1, padding: "1rem 1.5rem 2rem", position: "relative", zIndex: 1 }}>
                <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                    <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1f2937" }}>
                            Skin Tone Assessment
                        </h1>
                        <p style={{ color: "#6b7280", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
                            Upload a clear, front-facing photo and we will analyze your skin tone
                            using MediaPipe facial landmarks and CIELAB color science.
                        </p>
                    </div>
                    <div className="animate-fade-in-delay">
                        <SkinAnalyzer
                            onAnalysisComplete={(analysisResult, previewUrl) => {
                                setResult(analysisResult);
                                setImageUrl(previewUrl);
                                setStep("results");
                            }}
                        />
                    </div>
                </div>
            </main>

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
        <div className="sparkle" style={{
            top,
            ...(left ? { left } : {}),
            ...(right ? { right } : {}),
            fontSize: `${size}px`,
            animationDelay: `${delay}s`,
        }}>
            ✦
        </div>
    );
}
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import UserPreferenceSurvey from "@/components/survey/UserPreferenceSurvey";
import Header from "@/components/layout/Header";
import { requestPasswordReset, deleteAccount } from "@/app/survey/actions";
import type { UserPreferences } from "@/app/survey/actions";
import { Mail, KeyRound, Trash2 } from "lucide-react";

interface Props {
    brands: string[];
    initialPrefs: UserPreferences | null;
    userEmail: string;
}

export default function SurveyPageClient({ brands, initialPrefs, userEmail }: Props) {
    const router = useRouter();
    const [resetMsg, setResetMsg] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isDeleting, startDeleteTransition] = useTransition();

    function handleComplete() {
        router.push("/dashboard");
    }

    async function handleResetPassword() {
        setResetMsg(null);
        const result = await requestPasswordReset();
        if (result?.error) {
            setResetMsg(result.error);
        } else {
            setResetMsg("Password reset email sent! Check your inbox.");
        }
    }

    function handleDeleteAccount() {
        startDeleteTransition(async () => {
            await deleteAccount();
        });
    }

    return (
        <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Sparkles */}
            <Sparkle top="5%" left="3%" size={18} delay={0} />
            <Sparkle top="8%" right="5%" size={14} delay={0.3} />
            <Sparkle top="80%" left="2%" size={12} delay={0.6} />
            <Sparkle top="90%" right="3%" size={16} delay={0.9} />

            <Header isLoggedIn />

            {/* Survey centered in remaining space */}
            <main style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "2rem 1rem",
                position: "relative",
                zIndex: 1,
                gap: "2rem",
            }}>
                <UserPreferenceSurvey
                    brands={brands}
                    initialPrefs={initialPrefs}
                    onComplete={handleComplete}
                    isOverlay={false}
                />

                {/* Account section — visually subdued */}
                <div style={{
                    width: "100%",
                    maxWidth: "780px",
                    background: "rgba(255,255,255,0.60)",
                    borderRadius: "20px",
                    border: "1.5px solid #f3d1e5",
                    boxShadow: "none",
                    backdropFilter: "blur(6px)",
                    padding: "1.75rem 2rem",
                }}>
                    <h2 style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "1rem",
                    }}>
                        Account
                    </h2>

                    {/* Email */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        background: "#fdf2f8",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                    }}>
                        <Mail size={18} color="#ec4899" />
                        <div>
                            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>Email</p>
                            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1f2937", margin: 0 }}>{userEmail}</p>
                        </div>
                    </div>

                    {/* Change password */}
                    <button
                        onClick={handleResetPassword}
                        className="btn btn-signin"
                        style={{
                            width: "100%",
                            borderRadius: "12px",
                            marginBottom: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <KeyRound size={16} />
                        Change Password
                    </button>

                    {resetMsg && (
                        <p style={{
                            fontSize: "0.8125rem",
                            color: resetMsg.includes("sent") ? "#4a9e6e" : "#d94f4f",
                            textAlign: "center",
                            marginBottom: "0.75rem",
                        }}>
                            {resetMsg}
                        </p>
                    )}

                    {/* Delete account */}
                    {!deleteConfirm ? (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            style={{
                                width: "100%",
                                padding: "0.625rem 1.25rem",
                                background: "transparent",
                                border: "2px solid #ef4444",
                                borderRadius: "12px",
                                color: "#ef4444",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "#fef2f2";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <Trash2 size={16} />
                            Delete Account
                        </button>
                    ) : (
                        <div style={{
                            padding: "1rem",
                            border: "2px solid #ef4444",
                            borderRadius: "12px",
                            background: "#fef2f2",
                        }}>
                            <p style={{ fontSize: "0.875rem", color: "#ef4444", fontWeight: 600, marginBottom: "0.75rem" }}>
                                Are you sure? This will delete your preferences and products.
                            </p>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button
                                    onClick={() => setDeleteConfirm(false)}
                                    className="btn btn-ghost"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    style={{
                                        flex: 1,
                                        padding: "0.5rem 1rem",
                                        background: "#ef4444",
                                        border: "none",
                                        borderRadius: "var(--radius)",
                                        color: "white",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    {isDeleting ? "Deleting…" : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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

"use client";

import { useState } from "react";
import { signup } from "@/app/(auth)/actions";
import Link from "next/link";
import { Bold } from "lucide-react";

export default function SignupForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await signup(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{
                    fontSize: "2rem", fontWeight: "700",
                    fontFamily: "var(--font-instrument-serif), serif", marginBottom: "0.375rem", color: "#ec4899"
                }}>
                    Create your account!
                </h1>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9375rem" }}>
                    Save your skin analysis, track products, and get personalized recommendations.
                </p>
            </div>



            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {error && <div className="error-message">{error}</div>}

                <div>
                    <label htmlFor="email" className="label" style={{ fontWeight: "600" }}>Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="input"
                        autoComplete="email"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="label" style={{ fontWeight: "600" }}>Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="input"
                        autoComplete="new-password"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="label" style={{ fontWeight: "600" }}>Confirm Password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="input"
                        autoComplete="new-password"
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: "0.25rem" }}>
                    {loading ? <span className="spinner" /> : "Create Account"}
                </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>
                    Sign in
                </Link>
            </p>
        </div>
    );
}

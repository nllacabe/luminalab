"use client";

import { useState } from "react";
import { login } from "@/app/(auth)/actions";
import GoogleButton from "./google-button";
import Link from "next/link";

export default function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.375rem" }}>
                    Welcome back
                </h1>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9375rem" }}>
                    Sign in to access your saved results and recommendations.
                </p>
            </div>

            <GoogleButton label="Sign in with Google" />

            <div className="divider">OR</div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {error && <div className="error-message">{error}</div>}

                <div>
                    <label htmlFor="email" className="label">Email</label>
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
                    <label htmlFor="password" className="label">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="input"
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: "0.25rem" }}>
                    {loading ? <span className="spinner" /> : "Sign In"}
                </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
                    Sign up
                </Link>
            </p>
        </div>
    );
}

import LoginForm from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In — Lumina",
    description: "Sign in to your Lumina account to access saved skin analysis results and personalized recommendations.",
};

export default function LoginPage() {
    return <LoginForm />;
}

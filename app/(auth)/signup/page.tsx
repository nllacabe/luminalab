import SignupForm from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Account — Lumina",
    description: "Create a Lumina account to save your skin analysis, track product matches, and get personalized recommendations.",
};

export default function SignupPage() {
    return <SignupForm />;
}

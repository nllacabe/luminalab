import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBrandsFromCSV } from "@/lib/products/brands";
import { getUserPreferences } from "@/app/survey/actions";
import SurveyPageClient from "./SurveyPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Preferences — LUMINALAB",
    description: "Set your makeup preferences to get personalized product recommendations.",
};

export default async function SurveyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const brands = getBrandsFromCSV();
    const prefs = await getUserPreferences();

    return <SurveyPageClient brands={brands} initialPrefs={prefs} userEmail={user.email ?? ""} />;
}

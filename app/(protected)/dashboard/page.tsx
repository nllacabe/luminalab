import { createClient } from "@/lib/supabase/server";
import { hasCompletedSurvey, getUserPreferences } from "@/app/survey/actions";
import { getBrandsFromCSV } from "@/lib/products/brands";
import { getUserProducts } from "@/lib/products/actions";
import { getRecommendationSession } from "@/lib/recommendations/recommendation-history";
import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
    title: "Dashboard — LUMINALAB",
    description: "Your personalized LUMINALAB dashboard.",
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [surveyDone, prefs, products, recSession] = await Promise.all([
        hasCompletedSurvey(),
        getUserPreferences(),
        getUserProducts(),
        getRecommendationSession(),
    ]);

    const brands = surveyDone ? [] : getBrandsFromCSV();

    return (
        <DashboardClient
            userEmail={user?.email ?? null}
            showSurvey={!surveyDone}
            brands={brands}
            prefs={prefs}
            products={products}
            recSession={recSession}
        />
    );
}
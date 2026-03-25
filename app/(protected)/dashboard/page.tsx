import { createClient } from "@/lib/supabase/server";
import { hasCompletedSurvey, getUserPreferences } from "@/app/survey/actions";
import { getBrandsFromCSV } from "@/lib/products/brands";
import { getUserProducts } from "@/lib/products/actions";
import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
    title: "Dashboard — LUMINALAB",
    description: "Your personalized LUMINALAB dashboard.",
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [surveyDone, prefs, products] = await Promise.all([
        hasCompletedSurvey(),
        getUserPreferences(),
        getUserProducts(),
    ]);

    const brands = surveyDone ? [] : getBrandsFromCSV();

    return (
        <DashboardClient
            userEmail={user?.email ?? null}
            showSurvey={!surveyDone}
            brands={brands}
            prefs={prefs}
            products={products}
        />
    );
}
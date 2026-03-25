import fs from "fs";
import path from "path";

/**
 * Reads products.csv at build/server time and extracts unique brand names.
 * Used to populate the brand checkboxes in the user preference survey.
 */
export function getBrandsFromCSV(): string[] {
    const csvPath = path.join(process.cwd(), "data", "products.csv");
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split("\n").slice(1); // skip header

    const brands = new Set<string>();
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // brand_name is the first column
        const firstComma = trimmed.indexOf(",");
        if (firstComma === -1) continue;
        const brandName = trimmed.slice(0, firstComma).replace(/^"|"$/g, "").trim();
        if (brandName) brands.add(brandName);
    }

    return Array.from(brands).sort();
}

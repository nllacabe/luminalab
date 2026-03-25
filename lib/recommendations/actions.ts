"use server";

import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Server action that reads the products CSV from `data/products.csv`.
 * This runs on the server so it can access the filesystem directly.
 */
export async function getProductsCsv(): Promise<string> {
    const csvPath = resolve(process.cwd(), "data/products.csv");
    return readFileSync(csvPath, "utf-8");
}

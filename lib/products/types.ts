/**
 * Shared types for the user products feature.
 */

/** A product the user owns — displayed in the My Products list. */
export interface UserProduct {
    id: string;
    /** 'catalog' = existing CSV/DB product, 'custom' = user-created */
    source: "catalog" | "custom";
    name: string;
    brandName: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    imageUrl: string;
    productUrl: string;
    createdAt: string;
}

/** Input for adding a new custom product. */
export interface AddCustomProductInput {
    name: string;
    brandName: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price?: number;
}

/** A candidate found during dedup search against the CSV catalog. */
export interface DuplicateCandidate {
    /** Row index in the CSV (used as a stable key) */
    csvIndex: number;
    brandName: string;
    productName: string;
    shadeName: string;
    productType: string;
    finish: string;
    hexColor: string;
    price: number;
    imageUrl: string;
}

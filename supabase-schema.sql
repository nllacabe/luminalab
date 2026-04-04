-- ============================================================
-- LuminaLAB Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES (already created if you ran the previous SQL)
-- ─────────────────────────────────────────────────────────────
-- If you already created profiles, skip this block.
-- Otherwise uncomment and run it.

-- CREATE TABLE public.profiles (
--     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
--     email TEXT,
--     full_name TEXT,
--     avatar_url TEXT,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON public.profiles
--     FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON public.profiles
--     FOR UPDATE USING (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- 2. USER PREFERENCES (survey data)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Budget
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),

    -- Skin type: oily, dry, combination, sensitive
    skin_type TEXT CHECK (skin_type IN ('oily', 'dry', 'combination', 'sensitive')),

    -- Product types of interest
    product_types TEXT[] DEFAULT '{}',          -- e.g. {'foundation', 'lipstick', 'blush'}

    -- Brand preferences stored as text names (from products.csv / catalog)
    preferred_brands TEXT[] DEFAULT '{}',       -- e.g. {'Happy Skin', 'Maybelline'}

    -- Values / ethics
    is_cruelty_free BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    prefers_local BOOLEAN DEFAULT FALSE,

    -- Finish preferences: matte, dewy, satin, natural
    finish_preferences TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚠️  If you ran an older version of this schema that has `preferred_brand_ids UUID[]`,
--     run the following migration in Supabase SQL Editor:
--
--     ALTER TABLE public.user_preferences
--         ADD COLUMN IF NOT EXISTS preferred_brands TEXT[] DEFAULT '{}',
--         DROP COLUMN IF EXISTS preferred_brand_ids;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 3. BRANDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,                  -- URL-friendly name
    origin_country TEXT,
    is_local BOOLEAN DEFAULT FALSE,            -- local (PH) vs international
    is_cruelty_free BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Everyone can read brands (public catalog)
CREATE POLICY "Brands are publicly readable" ON public.brands
    FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCTS (curated product catalog with LAB color data)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,

    name TEXT NOT NULL,                         -- e.g. "Fit Me Matte + Poreless"
    shade_name TEXT,                            -- e.g. "228 Soft Tan"
    product_type TEXT NOT NULL CHECK (product_type IN ('foundation', 'lipstick', 'blush', 'concealer', 'other')),
    finish TEXT CHECK (finish IN ('matte', 'dewy', 'satin', 'natural', 'glossy', 'velvet', 'other')),

    -- CIELAB color values for matching
    lab_l NUMERIC(8, 4),                       -- L* (lightness 0-100)
    lab_a NUMERIC(8, 4),                       -- a* (red-green axis)
    lab_b NUMERIC(8, 4),                       -- b* (yellow-blue axis)

    -- Original RGB (for display)
    rgb_r INTEGER CHECK (rgb_r BETWEEN 0 AND 255),
    rgb_g INTEGER CHECK (rgb_g BETWEEN 0 AND 255),
    rgb_b INTEGER CHECK (rgb_b BETWEEN 0 AND 255),
    hex_color TEXT,                             -- e.g. "#D4A574"

    -- Price & metadata
    price NUMERIC(10, 2),
    currency TEXT DEFAULT 'PHP',
    image_url TEXT,
    product_url TEXT,                           -- link to buy
    is_cruelty_free BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,

    -- Skin-type compatibility filter
    suitable_for_skin_types TEXT[] DEFAULT '{}',  -- e.g. {'oily', 'dry', 'combination', 'sensitive'}

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products (public catalog)
CREATE POLICY "Products are publicly readable" ON public.products
    FOR SELECT USING (true);

-- Index for fast product type lookups
CREATE INDEX idx_products_type ON public.products(product_type);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_skin_types ON public.products USING GIN (suitable_for_skin_types);


-- ─────────────────────────────────────────────────────────────
-- 5. SKIN ANALYSES (per-analysis results)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.skin_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for guest analyses

    -- CIELAB values (averaged from cheeks + forehead)
    lab_l NUMERIC(8, 4) NOT NULL,
    lab_a NUMERIC(8, 4) NOT NULL,
    lab_b NUMERIC(8, 4) NOT NULL,

    -- ITA° and classification
    ita_angle NUMERIC(8, 4) NOT NULL,
    skin_tone_category TEXT NOT NULL CHECK (skin_tone_category IN (
        'very_light', 'light', 'intermediate', 'tan', 'brown', 'dark'
    )),

    -- Original RGB (for display)
    rgb_r INTEGER,
    rgb_g INTEGER,
    rgb_b INTEGER,
    hex_color TEXT,

    -- Source image (stored in Supabase Storage)
    image_path TEXT,                            -- path in storage bucket

    -- Region data (JSON for flexibility)
    region_data JSONB,                          -- e.g. {"cheek_left": {...}, "cheek_right": {...}, "forehead": {...}}

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.skin_analyses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.skin_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX idx_analyses_user ON public.skin_analyses(user_id);


-- ─────────────────────────────────────────────────────────────
-- 6. RECOMMENDATIONS (generated per analysis)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID REFERENCES public.skin_analyses(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

    -- Match metrics
    match_type TEXT NOT NULL CHECK (match_type IN ('delta_e', 'ita_harmony')),
    delta_e_value NUMERIC(8, 4),               -- ΔE2000 score (for foundations)
    match_score NUMERIC(5, 2),                 -- normalized 0-100 score for ranking
    match_rank INTEGER,                        -- rank within this analysis

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON public.recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.skin_analyses sa
            WHERE sa.id = analysis_id AND sa.user_id = auth.uid()
        )
    );
CREATE POLICY "System can insert recommendations" ON public.recommendations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.skin_analyses sa
            WHERE sa.id = analysis_id AND (sa.user_id = auth.uid() OR sa.user_id IS NULL)
        )
    );

CREATE INDEX idx_recommendations_analysis ON public.recommendations(analysis_id);


-- ─────────────────────────────────────────────────────────────
-- 7. SAVED RECOMMENDATIONS (user bookmarks)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.saved_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,                                 -- optional user note
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, recommendation_id)         -- prevent duplicate saves
);

ALTER TABLE public.saved_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved" ON public.saved_recommendations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved" ON public.saved_recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved" ON public.saved_recommendations
    FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 8. CUSTOM PRODUCTS (user-added products for matching)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.custom_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    name TEXT NOT NULL,
    brand_name TEXT,                            -- free-text since it may not be in brands table
    shade_name TEXT,
    product_type TEXT NOT NULL CHECK (product_type IN ('foundation', 'lipstick', 'blush', 'concealer', 'other')),
    finish TEXT CHECK (finish IN ('matte', 'dewy', 'satin', 'natural', 'glossy', 'velvet', 'other')),

    -- Color data (user can input or scan)
    lab_l NUMERIC(8, 4),
    lab_a NUMERIC(8, 4),
    lab_b NUMERIC(8, 4),
    hex_color TEXT,

    price NUMERIC(10, 2),
    currency TEXT DEFAULT 'PHP',
    image_url TEXT,                             -- photo stored in Supabase Storage
    notes TEXT,

    -- Does the user already own this product?
    is_owned BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom products" ON public.custom_products
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom products" ON public.custom_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom products" ON public.custom_products
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom products" ON public.custom_products
    FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 9. USER-OWNED CATALOG PRODUCTS (user owns a product already in DB)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_owned_catalog_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, product_id)                 -- one entry per user-product pair
);

ALTER TABLE public.user_owned_catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own owned products" ON public.user_owned_catalog_products
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own owned products" ON public.user_owned_catalog_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own owned products" ON public.user_owned_catalog_products
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own owned products" ON public.user_owned_catalog_products
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_owned_catalog_user ON public.user_owned_catalog_products(user_id);
CREATE INDEX idx_owned_catalog_product ON public.user_owned_catalog_products(product_id);


-- ─────────────────────────────────────────────────────────────
-- 10. REVERSE-MATCH RESULTS (given an owned product, find compatible products)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.reverse_match_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Source: exactly one of these is set
    source_owned_catalog_id UUID REFERENCES public.user_owned_catalog_products(id) ON DELETE CASCADE,
    source_custom_product_id UUID REFERENCES public.custom_products(id) ON DELETE CASCADE,

    -- The matched catalog product
    matched_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

    -- Match metrics (same pattern as recommendations table)
    delta_e_value NUMERIC(8, 4),               -- ΔE2000 distance
    match_score NUMERIC(5, 2),                 -- normalized 0-100 score
    match_rank INTEGER,                        -- rank within this source product

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure exactly one source type is set
    CONSTRAINT source_check CHECK (
        (source_owned_catalog_id IS NOT NULL AND source_custom_product_id IS NULL) OR
        (source_owned_catalog_id IS NULL AND source_custom_product_id IS NOT NULL)
    )
);

ALTER TABLE public.reverse_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reverse matches" ON public.reverse_match_results
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reverse matches" ON public.reverse_match_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reverse matches" ON public.reverse_match_results
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reverse_match_user ON public.reverse_match_results(user_id);
CREATE INDEX idx_reverse_match_source_catalog ON public.reverse_match_results(source_owned_catalog_id);
CREATE INDEX idx_reverse_match_source_custom ON public.reverse_match_results(source_custom_product_id);


-- ─────────────────────────────────────────────────────────────
-- 11. OCCASION FEATURE MIGRATION
-- Run this in Supabase SQL Editor if user_preferences already exists.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS occasion VARCHAR(32) DEFAULT 'everyday'
    CHECK (occasion IN ('job_interview','date_night','party','formal_gala','solemn','everyday'));

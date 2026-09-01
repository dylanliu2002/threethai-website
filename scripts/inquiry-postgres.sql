-- Inquiry table for Postgres (Vercel deployment).
-- Prisma/Postgres maps the Inquiry model to a mixed-case quoted table.
-- Either run `npm run db:push:pg` (recommended) or paste this into the
-- provider's SQL editor (Vercel Postgres / Neon / Supabase console).

CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id"            TEXT NOT NULL,
    "reference"     TEXT NOT NULL,
    "kind"          TEXT NOT NULL,
    "locale"        TEXT NOT NULL DEFAULT 'en',
    "name"          TEXT NOT NULL,
    "company"       TEXT,
    "country"       TEXT,
    "email"         TEXT NOT NULL,
    "phone"         TEXT,
    "product"       TEXT,
    "application"   TEXT,
    "specification" TEXT,
    "temperature"   TEXT,
    "quantity"      TEXT,
    "destination"   TEXT,
    "message"       TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Inquiry_reference_key" ON "Inquiry"("reference");

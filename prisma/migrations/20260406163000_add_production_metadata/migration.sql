CREATE TYPE "StudioAttributionSource" AS ENUM ('PRODUCTION_COMPANY', 'NETWORK', 'EXCLUSIVE_STREAMING_PROVIDER');

ALTER TABLE "Title"
ADD COLUMN "productionCompanies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "productionNetworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "studioAttributionLabel" TEXT,
ADD COLUMN "studioAttributionSource" "StudioAttributionSource";

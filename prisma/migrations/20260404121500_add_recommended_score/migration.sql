ALTER TABLE "Title"
ADD COLUMN "recommendedScore" DOUBLE PRECISION;

UPDATE "Title"
SET "recommendedScore" = (
  ((100 - "wokeScore") * 0.6) +
  (COALESCE("imdbRating" * 10, 50) * 0.3) +
  (COALESCE("rottenTomatoesAudienceScore", 50) * 0.1)
);

ALTER TABLE "Title"
ALTER COLUMN "recommendedScore" SET NOT NULL;

CREATE INDEX "Title_recommendedScore_idx" ON "Title"("recommendedScore");

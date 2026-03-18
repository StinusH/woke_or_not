-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'TV_SHOW');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('PUBLISHED', 'DRAFT');

-- CreateEnum
CREATE TYPE "CrewJobType" AS ENUM ('DIRECTOR', 'WRITER', 'PRODUCER');

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TitleType" NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "runtimeMinutes" INTEGER,
    "synopsis" TEXT NOT NULL,
    "posterUrl" TEXT,
    "trailerYoutubeUrl" TEXT,
    "imdbUrl" TEXT,
    "rottenTomatoesUrl" TEXT,
    "amazonUrl" TEXT,
    "wokeScore" INTEGER NOT NULL,
    "wokeSummary" TEXT NOT NULL,
    "status" "TitleStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleGenre" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "TitleGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleCast" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "billingOrder" INTEGER NOT NULL,

    CONSTRAINT "TitleCast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleCrew" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "jobType" "CrewJobType" NOT NULL,

    CONSTRAINT "TitleCrew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WokeFactor" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "WokeFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Title_slug_key" ON "Title"("slug");

-- CreateIndex
CREATE INDEX "Title_type_idx" ON "Title"("type");

-- CreateIndex
CREATE INDEX "Title_wokeScore_idx" ON "Title"("wokeScore");

-- CreateIndex
CREATE INDEX "Title_releaseDate_idx" ON "Title"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "TitleGenre_genreId_idx" ON "TitleGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "TitleGenre_titleId_genreId_key" ON "TitleGenre"("titleId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "TitleCast_titleId_billingOrder_idx" ON "TitleCast"("titleId", "billingOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TitleCast_titleId_personId_roleName_key" ON "TitleCast"("titleId", "personId", "roleName");

-- CreateIndex
CREATE INDEX "TitleCrew_titleId_jobType_idx" ON "TitleCrew"("titleId", "jobType");

-- CreateIndex
CREATE UNIQUE INDEX "TitleCrew_titleId_personId_jobType_key" ON "TitleCrew"("titleId", "personId", "jobType");

-- CreateIndex
CREATE INDEX "WokeFactor_titleId_displayOrder_idx" ON "WokeFactor"("titleId", "displayOrder");

-- AddForeignKey
ALTER TABLE "TitleGenre" ADD CONSTRAINT "TitleGenre_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleGenre" ADD CONSTRAINT "TitleGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleCast" ADD CONSTRAINT "TitleCast_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleCast" ADD CONSTRAINT "TitleCast_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleCrew" ADD CONSTRAINT "TitleCrew_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleCrew" ADD CONSTRAINT "TitleCrew_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WokeFactor" ADD CONSTRAINT "WokeFactor_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

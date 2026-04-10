CREATE TYPE "TitleContentTag" AS ENUM ('RAINBOW', 'CROSS', 'HAMMER_SIGIL');

ALTER TABLE "Title"
ADD COLUMN "contentTags" "TitleContentTag"[] NOT NULL DEFAULT ARRAY[]::"TitleContentTag"[];

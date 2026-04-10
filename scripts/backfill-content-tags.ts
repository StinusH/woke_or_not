import { PrismaClient } from "@prisma/client";
import { deriveContentTagsFromText, normalizeContentTags } from "@/lib/title-tags";

type BackfillResult = {
  slug: string;
  name: string;
  previousContentTags: string[];
  nextContentTags: string[];
  status: "updated" | "unchanged";
};

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const titles = await prisma.title.findMany({
    orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      contentTags: true,
      wokeSummary: true,
      socialPostDraft: true,
      wokeFactors: {
        select: {
          notes: true
        }
      }
    }
  });

  const results: BackfillResult[] = [];

  for (const title of titles) {
    const previousContentTags = normalizeContentTags(title.contentTags);
    const nextContentTags = deriveContentTagsFromText({
      wokeSummary: title.wokeSummary,
      socialPostDraft: title.socialPostDraft,
      wokeFactors: title.wokeFactors
    });
    const changed = !arraysEqual(previousContentTags, nextContentTags);

    if (apply && changed) {
      await prisma.title.update({
        where: { id: title.id },
        data: {
          contentTags: nextContentTags
        }
      });
    }

    results.push({
      slug: title.slug,
      name: title.name,
      previousContentTags,
      nextContentTags,
      status: changed ? "updated" : "unchanged"
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        totals: {
          titles: results.length,
          updated: results.filter((result) => result.status === "updated").length,
          unchanged: results.filter((result) => result.status === "unchanged").length
        },
        results
      },
      null,
      2
    )
  );
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

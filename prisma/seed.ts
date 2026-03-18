import { CrewJobType, PrismaClient, TitleType } from "@prisma/client";

const prisma = new PrismaClient();

const genreSeed = [
  { name: "Children", slug: "children" },
  { name: "Action", slug: "action" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Sci-Fi", slug: "sci-fi" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Documentary", slug: "documentary" },
  { name: "Thriller", slug: "thriller" },
  { name: "Romance", slug: "romance" },
  { name: "Family", slug: "family" },
  { name: "Animation", slug: "animation" },
  { name: "Mystery", slug: "mystery" }
];

const movieNames = [
  "Solar Harbor",
  "City of Dust",
  "The Quiet Orbit",
  "Crimson Frequency",
  "Rainline",
  "North of Midnight",
  "Evergreen Protocol",
  "Ashes in April",
  "Glass Horizon",
  "Velvet Province",
  "The Last Signal",
  "Concrete River",
  "Thunder at Dusk",
  "Marble Season",
  "Open Circuit",
  "Orbit Street",
  "Birdsong District",
  "Long Summer Exit",
  "Delta Black",
  "Holiday Engine",
  "Second Frame",
  "Blue Lantern",
  "Parade of Echoes",
  "Night Cartographers",
  "Arc Light",
  "Oxygen Hotel",
  "Picture Window",
  "Clockwork Harbor",
  "Wildframe",
  "Sunset Relay"
];

const showNames = [
  "Eastline Academy",
  "Paper Crown",
  "Signal House",
  "Metro Chasers",
  "Juniper Street Kids",
  "Zero Hour Files",
  "Good Morning, Harbor",
  "Tiny Planet Club",
  "Starlight Diner",
  "Bittersweet County",
  "The Summer District",
  "Iron Borough",
  "The Last Semester",
  "Beacon Unit",
  "Comedy Terminal",
  "Riverline Detectives",
  "Sunroom Stories",
  "Streetlight League",
  "Canvas & Smoke",
  "Old Town Protocol",
  "Frontier Classroom",
  "Velvet Alley",
  "Morning Shift",
  "Maple & Main",
  "Echoes of Evergreen",
  "Updraft Crew",
  "Bluebird Workshop",
  "Skyline Apartment",
  "The Corner Frame",
  "Harbor Nights"
];

const peoplePool = [
  "Avery Morgan",
  "Jordan Lee",
  "Cameron Brooks",
  "Taylor Scott",
  "Riley Quinn",
  "Drew Harper",
  "Casey Flynn",
  "Alex Sutton",
  "Logan Pierce",
  "Jamie Cole",
  "Morgan Diaz",
  "Parker Grant",
  "Skyler Hayes",
  "Reese Monroe",
  "Hayden Ellis",
  "Kendall Blair",
  "Robin Vaughn",
  "Shawn Everett",
  "Dylan Ramsey",
  "Emerson Frost",
  "Remy Walker",
  "Finley Cross",
  "Micah Dean",
  "Jules Carter",
  "Noah Bennett",
  "Ellis Shaw",
  "Harper Lane",
  "Quinn Rowan",
  "Rowan Blake",
  "Sage Griffin",
  "Peyton Reed",
  "Charlie Knox",
  "Dakota Miles",
  "Samira Holt",
  "Nico Young",
  "Aria West",
  "Bianca Ford",
  "Vivian Cole",
  "Lena Hart",
  "Mila Santos",
  "Elena Cho",
  "Theo Ramsey",
  "Mateo Cruz",
  "Iris Chen",
  "Leah Patel",
  "Nadia Ibrahim",
  "Ethan Ross",
  "Nora Bell",
  "Caleb Kim",
  "Zoe Alvarez",
  "Mason Grant",
  "Clara Hughes",
  "Isaac Moore",
  "Naomi Ruiz",
  "Lucas King",
  "Lily Ahmed",
  "Owen Price",
  "Maya Flores",
  "Henry Stone",
  "Ruby Park",
  "Wyatt Long",
  "Cora Day",
  "Miles Clark",
  "Tessa Wynn",
  "Silas Ward",
  "Ivy Turner",
  "Aiden Holt",
  "Sienna Cole",
  "Julian Vega",
  "Hazel Kent",
  "Gabriel Shaw",
  "Nina Pope"
];

const trailerIds = [
  "dQw4w9WgXcQ",
  "aqz-KE-bpKQ",
  "ysz5S6PUM-U",
  "L_jWHffIx5E",
  "fJ9rUzIMcZQ",
  "e-ORhEE9VVg",
  "ktvTqknDobU",
  "kXYiU_JCYtU"
];

const factorLabels = [
  "Representation breadth",
  "Political dialogue density",
  "Identity-driven storyline weight",
  "Institutional critique intensity",
  "Social justice thematic focus",
  "Traditional values challenge level"
];

const RESET_CONFIRMATION_VALUE = "RESET";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function templateTitleName(value: string): string {
  return `[Template] ${value}`;
}

function scoreFor(index: number): number {
  return 20 + ((index * 11 + 17) % 71);
}

function releaseDateFor(index: number): Date {
  const year = 2005 + (index % 20);
  const month = index % 12;
  const day = 1 + ((index * 3) % 27);
  return new Date(Date.UTC(year, month, day));
}

function genresFor(type: TitleType, index: number): string[] {
  if (index % 10 === 0) {
    return ["children", "family", "animation"];
  }

  const movieCycle = ["action", "comedy", "drama", "thriller", "sci-fi", "fantasy", "mystery"];
  const showCycle = ["comedy", "drama", "documentary", "mystery", "fantasy", "thriller", "action"];

  const base = type === TitleType.MOVIE ? movieCycle : showCycle;

  return [base[index % base.length], base[(index + 2) % base.length]];
}

function buildFactors(score: number) {
  const weights = [
    Math.max(5, Math.round(score * 0.26)),
    Math.max(5, Math.round(score * 0.21)),
    Math.max(5, Math.round(score * 0.18)),
    Math.max(5, Math.round(score * 0.16))
  ];

  return weights.map((weight, idx) => ({
    label: factorLabels[idx],
    weight,
    displayOrder: idx + 1,
    notes: `${factorLabels[idx]} contributed ${weight} points in editorial review.`
  }));
}

function shouldResetDatabase(argv = process.argv): boolean {
  return argv.includes("--reset");
}

function hasResetApproval(env = process.env): boolean {
  return env.ALLOW_DB_RESET === "true" && env.DB_RESET_CONFIRMATION === RESET_CONFIRMATION_VALUE;
}

function resetCommandHint(): string {
  return "ALLOW_DB_RESET=true DB_RESET_CONFIRMATION=RESET tsx prisma/seed.ts --reset";
}

async function ensureSeedModeIsSafe(reset: boolean) {
  const [titleCount, genreCount, personCount] = await Promise.all([
    prisma.title.count(),
    prisma.genre.count(),
    prisma.person.count()
  ]);

  const hasExistingData = titleCount > 0 || genreCount > 0 || personCount > 0;

  if (!hasExistingData) {
    return;
  }

  if (!reset) {
    throw new Error(
      [
        "Seed aborted because the database already contains data.",
        "Default seeding is now non-destructive and will not overwrite existing records.",
        `If you truly want to wipe and reseed the database, rerun with: ${resetCommandHint()}`
      ].join(" ")
    );
  }

  if (!hasResetApproval()) {
    throw new Error(
      [
        "Destructive seed aborted because explicit reset approval was not provided.",
        `To confirm a full wipe, rerun with: ${resetCommandHint()}`
      ].join(" ")
    );
  }
}

async function resetExistingRecords() {
  console.log("Resetting existing records...");

  await prisma.$transaction([
    prisma.wokeFactor.deleteMany(),
    prisma.titleCrew.deleteMany(),
    prisma.titleCast.deleteMany(),
    prisma.titleGenre.deleteMany(),
    prisma.title.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.person.deleteMany()
  ]);
}

async function run() {
  const reset = shouldResetDatabase();

  await ensureSeedModeIsSafe(reset);

  if (reset) {
    await resetExistingRecords();
  } else {
    console.log("Database is empty. Running initial seed without reset.");
  }

  console.log("Seeding genres and people...");

  const genres = await Promise.all(
    genreSeed.map((genre) => prisma.genre.create({ data: genre }))
  );
  const genreBySlug = new Map(genres.map((genre) => [genre.slug, genre]));

  const people = await Promise.all(
    peoplePool.map((name) =>
      prisma.person.create({
        data: { name }
      })
    )
  );

  const personByName = new Map(people.map((person) => [person.name, person]));

  console.log("Seeding titles...");

  const allTitles = [
    ...movieNames.map((baseName, idx) => ({ baseName, type: TitleType.MOVIE, idx })),
    ...showNames.map((baseName, idx) => ({ baseName, type: TitleType.TV_SHOW, idx: idx + movieNames.length }))
  ];

  for (const item of allTitles) {
    const score = scoreFor(item.idx);
    const titleGenres = genresFor(item.type, item.idx);
    const releaseDate = releaseDateFor(item.idx);
    const trailerId = trailerIds[item.idx % trailerIds.length];
    const slug = slugify(item.baseName);
    const name = templateTitleName(item.baseName);

    const record = await prisma.title.create({
      data: {
        slug,
        name,
        type: item.type,
        releaseDate,
        runtimeMinutes: item.type === TitleType.MOVIE ? 88 + (item.idx % 50) : 24 + (item.idx % 25),
        synopsis: `${name} explores relationships, institutions, and social change through character-driven storytelling.`,
        posterUrl: `https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=640&q=80&seed=${slug}`,
        trailerYoutubeUrl: `https://www.youtube.com/watch?v=${trailerId}`,
        imdbUrl: `https://www.imdb.com/title/tt${(1000000 + item.idx).toString()}/`,
        rottenTomatoesUrl: `https://www.rottentomatoes.com/m/${slug.replace(/-/g, "_")}`,
        amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(name)}`,
        wokeScore: score,
        wokeSummary: `Editorial score derived from theme balance, dialogue tone, and representation emphasis.`,
        status: "PUBLISHED"
      }
    });

    await prisma.titleGenre.createMany({
      data: titleGenres
        .map((genreSlug) => genreBySlug.get(genreSlug))
        .filter((genre): genre is NonNullable<typeof genre> => Boolean(genre))
        .map((genre) => ({
          titleId: record.id,
          genreId: genre.id
        }))
    });

    const castNames = [
      peoplePool[item.idx % peoplePool.length],
      peoplePool[(item.idx + 5) % peoplePool.length],
      peoplePool[(item.idx + 13) % peoplePool.length]
    ];

    for (let i = 0; i < castNames.length; i += 1) {
      const castName = castNames[i];
      const person = personByName.get(castName);
      if (!person) continue;

      await prisma.titleCast.create({
        data: {
          titleId: record.id,
          personId: person.id,
          roleName: item.type === TitleType.MOVIE ? `Lead Role ${i + 1}` : `Series Character ${i + 1}`,
          billingOrder: i + 1
        }
      });
    }

    const crewAssignments = [
      { name: peoplePool[(item.idx + 2) % peoplePool.length], jobType: CrewJobType.DIRECTOR },
      { name: peoplePool[(item.idx + 9) % peoplePool.length], jobType: CrewJobType.WRITER },
      { name: peoplePool[(item.idx + 17) % peoplePool.length], jobType: CrewJobType.PRODUCER }
    ];

    for (const crew of crewAssignments) {
      const person = personByName.get(crew.name);
      if (!person) continue;

      await prisma.titleCrew.create({
        data: {
          titleId: record.id,
          personId: person.id,
          jobType: crew.jobType
        }
      });
    }

    await prisma.wokeFactor.createMany({
      data: buildFactors(score).map((factor) => ({
        ...factor,
        titleId: record.id
      }))
    });
  }

  console.log(`Seed complete: ${allTitles.length} titles inserted.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

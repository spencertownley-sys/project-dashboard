import { createDb, migratePostgres } from "@/lib/db";

const url = process.env.DATABASE_URL;
if (url) {
  await migratePostgres(url);
  console.log("Postgres migrated.");
} else if (process.env.VERCEL) {
  console.error("DATABASE_URL is not set. Add a Postgres database (for example Neon from the Vercel Marketplace) before deploying.");
  process.exit(1);
} else {
  await createDb(); // PGlite migrates itself on open.
  console.log(`Local PGlite database migrated at ${process.env.PGLITE_DIR ?? ".data/pglite"}.`);
}
process.exit(0);

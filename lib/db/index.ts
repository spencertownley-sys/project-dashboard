import path from "node:path";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const MIGRATIONS = path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

type Holder = { db?: Promise<Db> };
const g = globalThis as unknown as { __pcrDb?: Holder };
const holder: Holder = (g.__pcrDb ??= {});

/** Postgres when DATABASE_URL is set, otherwise a PGlite database (file in dev, memory when dir is "memory"). */
export async function createDb(opts: { url?: string; pgliteDir?: string } = {}): Promise<Db> {
  const url = opts.url ?? process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const client = postgres(url, { max: 5, prepare: false });
    return drizzlePg(client, { schema });
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is not set. Add a Postgres database in Vercel before using the app.");
  const dir = opts.pgliteDir ?? process.env.PGLITE_DIR ?? ".data/pglite";
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (dir !== "memory") (await import("node:fs")).mkdirSync(path.resolve(/*turbopackIgnore: true*/ dir), { recursive: true });
  const client = dir === "memory" ? new PGlite() : new PGlite(path.resolve(/*turbopackIgnore: true*/ dir));
  const db = drizzle(client, { schema });
  // PGlite is local-only, so keep it migrated automatically.
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

export async function migratePostgres(url: string) {
  const { default: postgres } = await import("postgres");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { max: 1, prepare: false });
  try {
    await migrate(drizzlePg(client), { migrationsFolder: MIGRATIONS });
  } finally {
    await client.end();
  }
}

/** Shared app database. The first call in a fresh local PGlite database also loads the seed inventory. */
export function getDb(): Promise<Db> {
  if (!holder.db) {
    holder.db = (async () => {
      const db = await createDb();
      if (!process.env.DATABASE_URL) {
        const { seedIfEmpty } = await import("./seed");
        await seedIfEmpty(db);
      }
      return db;
    })();
    holder.db.catch(() => {
      holder.db = undefined;
    });
  }
  return holder.db;
}

export { schema };

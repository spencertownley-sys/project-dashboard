import { createDb } from "@/lib/db";
import { seedIfEmpty } from "@/lib/db/seed";

const db = await createDb();
const seeded = await seedIfEmpty(db);
console.log(seeded ? "Seeded the project inventory." : "Projects already exist, so the seed was skipped.");
process.exit(0);

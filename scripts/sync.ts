import { createDb } from "@/lib/db";
import { seedIfEmpty } from "@/lib/db/seed";
import { runSync } from "@/lib/sync";

const db = await createDb();
await seedIfEmpty(db);
const res = await runSync(db);
console.log(JSON.stringify(res, null, 2));
process.exit(res.ok ? 0 : 1);

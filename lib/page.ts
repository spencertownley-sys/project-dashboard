import "server-only";
import { requireOwner } from "./auth";
import { getDb } from "./db";

/** Every page starts here: owner check first, then the database. */
export async function load() {
  const viewer = await requireOwner();
  const db = await getDb();
  return { viewer, db, today: new Date() };
}

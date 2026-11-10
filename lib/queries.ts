import { asc, desc, eq, isNull } from "drizzle-orm";
import { buildAlerts } from "./alerts";
import type { Db } from "./db";
import * as s from "./db/schema";

export async function listProjects(db: Db) {
  return db.select().from(s.projects).orderBy(asc(s.projects.name));
}

export async function listSignals(db: Db) {
  return db.select().from(s.signals);
}

export async function getProject(db: Db, id: string) {
  const [project] = await db.select().from(s.projects).where(eq(s.projects.id, id));
  if (!project) return null;
  const [steps, sessions, ideas, signals, components] = await Promise.all([
    db.select().from(s.steps).where(eq(s.steps.projectId, id)).orderBy(asc(s.steps.position), asc(s.steps.id)),
    db.select().from(s.claudeSessions).where(eq(s.claudeSessions.projectId, id)).orderBy(asc(s.claudeSessions.id)),
    db.select().from(s.ideas).where(eq(s.ideas.projectId, id)).orderBy(desc(s.ideas.starred), asc(s.ideas.id)),
    db.select().from(s.signals).where(eq(s.signals.projectId, id)),
    db.select().from(s.components).where(eq(s.components.projectId, id)).orderBy(asc(s.components.position)),
  ]);
  return { project, steps, sessions, ideas, signals, components };
}

export async function firstOpenSteps(db: Db) {
  const rows = await db
    .select({ projectId: s.steps.projectId, title: s.steps.title })
    .from(s.steps)
    .where(eq(s.steps.done, false))
    .orderBy(asc(s.steps.position), asc(s.steps.id));
  const map = new Map<string, string>();
  for (const r of rows) if (!map.has(r.projectId)) map.set(r.projectId, r.title);
  return map;
}

export async function listAlerts(db: Db) {
  const [projects, signals] = await Promise.all([listProjects(db), listSignals(db)]);
  return buildAlerts(projects, signals);
}

export async function listComponents(db: Db) {
  return db.select().from(s.components).orderBy(asc(s.components.position), asc(s.components.id));
}

export async function listIdeas(db: Db) {
  return db.select().from(s.ideas).orderBy(desc(s.ideas.starred), asc(s.ideas.id));
}

export async function listNewProjectIdeas(db: Db) {
  return db.select().from(s.ideas).where(isNull(s.ideas.projectId)).orderBy(desc(s.ideas.starred), asc(s.ideas.id));
}

export async function listHousekeeping(db: Db) {
  return db.select().from(s.housekeepingItems).orderBy(asc(s.housekeepingItems.id));
}

export async function getSetting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, key));
  return (row?.value as T | undefined) ?? fallback;
}

export async function setSetting(db: Db, key: string, value: unknown) {
  await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
}

export async function lastSyncRun(db: Db) {
  const [row] = await db.select().from(s.syncRuns).orderBy(desc(s.syncRuns.id)).limit(1);
  return row ?? null;
}

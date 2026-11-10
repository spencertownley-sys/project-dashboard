"use server";

import { and, eq, inArray, max, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { hoursAfterToggle } from "@/lib/metrics";
import { setSetting } from "@/lib/queries";
import { runSync } from "@/lib/sync";

export type FormState = { ok: boolean; message: string } | null;

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optText = z.preprocess(blankToNull, z.string().trim().max(2000).nullable());
const optNum = (min: number, maxV: number, int = false) =>
  z.preprocess(blankToNull, z.coerce.number().min(min).max(maxV).refine((n) => !int || Number.isInteger(n), "Use a whole number").nullable());
const lines = (v: FormDataEntryValue | null, sep: RegExp) =>
  String(v ?? "")
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.string().trim().max(60),
  status: z.enum(s.STATUSES),
  pct: optNum(0, 100, true),
  hoursLeft: optNum(0, 10000),
  value: optNum(1, 5, true),
  summary: z.string().trim().max(2000),
  needs: optText,
  claudeProjectUrl: z.preprocess(blankToNull, z.url("Claude project link must be a full URL").nullable()),
  githubRepo: z.preprocess(blankToNull, z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, "GitHub repo must look like owner/name").nullable()),
  vercelProject: optText,
  supabaseRef: optText,
});

async function done(path?: string) {
  revalidatePath(path ?? "/", "layout");
}

export async function updateProject(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = projectSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const db = await getDb();
  const { id, ...rest } = parsed.data;
  await db
    .update(s.projects)
    .set({
      ...rest,
      urls: lines(form.get("urls"), /\n/),
      risks: lines(form.get("risks"), /\n/),
      hostTags: lines(form.get("hostTags"), /,/),
      updatedAt: new Date(),
    })
    .where(eq(s.projects.id, id));
  await done();
  return { ok: true, message: "Saved" };
}

export async function toggleStep(stepId: number, nowDone: boolean) {
  await requireOwner();
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [step] = await tx.select().from(s.steps).where(eq(s.steps.id, stepId));
    if (!step || step.done === nowDone) return;
    await tx.update(s.steps).set({ done: nowDone, doneAt: nowDone ? new Date() : null }).where(eq(s.steps.id, stepId));
    const [p] = await tx.select({ hoursLeft: s.projects.hoursLeft }).from(s.projects).where(eq(s.projects.id, step.projectId));
    await tx
      .update(s.projects)
      .set({ hoursLeft: hoursAfterToggle(p?.hoursLeft ?? null, step.hours, nowDone), updatedAt: new Date() })
      .where(eq(s.projects.id, step.projectId));
  });
  await done();
}

const stepSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, "Describe the step").max(300),
  hours: z.coerce.number().min(0).max(1000).default(1),
});

export async function addStep(form: FormData) {
  await requireOwner();
  const parsed = stepSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(s.steps.position) }).from(s.steps).where(eq(s.steps.projectId, parsed.data.projectId));
  await db.insert(s.steps).values({ ...parsed.data, position: (m ?? -1) + 1 });
  await done();
}

export async function deleteStep(stepId: number) {
  await requireOwner();
  const db = await getDb();
  await db.delete(s.steps).where(eq(s.steps.id, stepId));
  await done();
}

const ideaSchema = z.object({
  projectId: z.preprocess((v) => blankToNull(v) ?? null, z.string().nullable()),
  title: z.string().trim().min(1, "Give the idea a name").max(200),
  detail: z.string().trim().max(1000).default(""),
});

export async function addIdea(form: FormData) {
  await requireOwner();
  const parsed = ideaSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const db = await getDb();
  await db.insert(s.ideas).values(parsed.data);
  await done();
}

export async function toggleIdeaStar(id: number, starred: boolean) {
  await requireOwner();
  const db = await getDb();
  await db.update(s.ideas).set({ starred }).where(eq(s.ideas.id, id));
  await done();
}

export async function deleteIdea(id: number) {
  await requireOwner();
  const db = await getDb();
  await db.delete(s.ideas).where(eq(s.ideas.id, id));
  await done();
}

const sessionSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  url: z.preprocess(blankToNull, z.url().nullable()),
});

export async function addSession(form: FormData) {
  await requireOwner();
  const parsed = sessionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const db = await getDb();
  await db.insert(s.claudeSessions).values(parsed.data);
  await done();
}

export async function deleteSession(id: number) {
  await requireOwner();
  const db = await getDb();
  await db.delete(s.claudeSessions).where(eq(s.claudeSessions.id, id));
  await done();
}

export async function setHousekeepingDecision(id: number, decision: s.HkDecision) {
  await requireOwner();
  if (!s.HK_DECISIONS.includes(decision)) return;
  const db = await getDb();
  await db
    .update(s.housekeepingItems)
    .set({ decision, decidedAt: decision === "pending" ? null : new Date() })
    .where(eq(s.housekeepingItems.id, id));
  await done("/housekeeping");
}

export async function saveQueue(ids: string[]) {
  await requireOwner();
  const list = z.array(z.string().min(1)).max(500).parse(ids);
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const [i, id] of list.entries()) await tx.update(s.projects).set({ queuePosition: i }).where(eq(s.projects.id, id));
    if (list.length) await tx.update(s.projects).set({ queuePosition: null }).where(notInArray(s.projects.id, list));
  });
  await done("/planner");
}

export async function setHoursPerWeek(hours: number) {
  await requireOwner();
  const n = z.number().int().min(1).max(80).parse(hours);
  const db = await getDb();
  await setSetting(db, "hours_per_week", n);
  await done();
}

export async function addToQueue(projectId: string) {
  await requireOwner();
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(s.projects.queuePosition) }).from(s.projects);
  await db
    .update(s.projects)
    .set({ queuePosition: (m ?? -1) + 1 })
    .where(and(eq(s.projects.id, projectId)));
  await done("/planner");
}

export async function removeFromQueue(projectIds: string[]) {
  await requireOwner();
  const db = await getDb();
  if (projectIds.length) await db.update(s.projects).set({ queuePosition: null }).where(inArray(s.projects.id, projectIds));
  await done("/planner");
}

export async function runSyncNow(): Promise<FormState> {
  await requireOwner();
  const db = await getDb();
  const res = await runSync(db);
  await done();
  const parts = Object.entries(res.summary).map(([k, v]) => `${k} ${v.status === "ok" ? `updated ${v.updated}` : v.status}`);
  return { ok: res.ok, message: parts.join(" · ") };
}

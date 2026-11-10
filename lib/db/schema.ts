import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const STATUSES = ["live", "preview", "building", "stalled", "archive", "idea", "unknown"] as const;
export type Status = (typeof STATUSES)[number];
export const statusEnum = pgEnum("project_status", STATUSES);

export type Arch = { Client?: string; Host?: string; Data?: string; Auth?: string; Services?: string };
export const DOC_KEYS = ["prd", "tech", "api", "ui", "launch", "claude"] as const;
export type DocKey = (typeof DOC_KEYS)[number];
export type DocFlags = Record<DocKey, 0 | 1>;

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  repo: text("repo").notNull().default(""),
  githubRepo: text("github_repo"),
  category: text("category").notNull().default(""),
  status: statusEnum("status").notNull().default("building"),
  pct: integer("pct"),
  hoursLeft: real("hours_left"),
  value: integer("value"),
  summary: text("summary").notNull().default(""),
  needs: text("needs"),
  risks: text("risks").array().notNull().default(sql`'{}'::text[]`),
  urls: text("urls").array().notNull().default(sql`'{}'::text[]`),
  hostTags: text("host_tags").array().notNull().default(sql`'{}'::text[]`),
  arch: jsonb("arch").$type<Arch | null>(),
  docs: jsonb("docs").$type<DocFlags | null>(),
  docNote: text("doc_note"),
  claudeProjectUrl: text("claude_project_url"),
  vercelProject: text("vercel_project"),
  supabaseRef: text("supabase_ref"),
  lastPush: date("last_push"),
  queuePosition: integer("queue_position"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  hours: real("hours").notNull().default(0),
  done: boolean("done").notNull().default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
  position: integer("position").notNull().default(0),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  starred: boolean("starred").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const claudeSessions = pgTable("claude_sessions", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
});

export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  resource: text("resource").notNull(),
  projectLabel: text("project_label").notNull().default(""),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  note: text("note").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const HK_GROUPS = ["archive", "overlap", "docs"] as const;
export const HK_DECISIONS = ["pending", "approved", "skipped"] as const;
export type HkDecision = (typeof HK_DECISIONS)[number];

export const housekeepingItems = pgTable("housekeeping_items", {
  id: serial("id").primaryKey(),
  group: text("group").$type<(typeof HK_GROUPS)[number]>().notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  decision: text("decision").$type<HkDecision>().notNull().default("pending"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const SIGNAL_SOURCES = ["github", "vercel", "supabase"] as const;
export type SignalSource = (typeof SIGNAL_SOURCES)[number];

export const signals = pgTable(
  "signals",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    source: text("source").$type<SignalSource>().notNull(),
    key: text("key").notNull(),
    value: jsonb("value").$type<unknown>(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.source, t.key] })],
);

export type SyncSummary = Record<string, { status: "ok" | "skipped" | "error"; updated: number; message?: string }>;

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  summary: jsonb("summary").$type<SyncSummary>(),
  error: text("error"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type Step = typeof steps.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type ClaudeSession = typeof claudeSessions.$inferSelect;
export type Component = typeof components.$inferSelect;
export type HousekeepingItem = typeof housekeepingItems.$inferSelect;
export type Signal = typeof signals.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;

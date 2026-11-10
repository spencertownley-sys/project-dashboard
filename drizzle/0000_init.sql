CREATE TYPE "public"."project_status" AS ENUM('live', 'preview', 'building', 'stalled', 'archive', 'idea', 'unknown');--> statement-breakpoint
CREATE TABLE "claude_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"resource" text NOT NULL,
	"project_label" text DEFAULT '' NOT NULL,
	"project_id" text,
	"note" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housekeeping_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"group" text NOT NULL,
	"title" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"decision" text DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text,
	"title" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"repo" text DEFAULT '' NOT NULL,
	"github_repo" text,
	"category" text DEFAULT '' NOT NULL,
	"status" "project_status" DEFAULT 'building' NOT NULL,
	"pct" integer,
	"hours_left" real,
	"value" integer,
	"summary" text DEFAULT '' NOT NULL,
	"needs" text,
	"risks" text[] DEFAULT '{}'::text[] NOT NULL,
	"urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"host_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"arch" jsonb,
	"docs" jsonb,
	"doc_note" text,
	"claude_project_url" text,
	"vercel_project" text,
	"supabase_ref" text,
	"last_push" date,
	"queue_position" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"project_id" text NOT NULL,
	"source" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signals_project_id_source_key_pk" PRIMARY KEY("project_id","source","key")
);
--> statement-breakpoint
CREATE TABLE "steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"hours" real DEFAULT 0 NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"ok" boolean,
	"summary" jsonb,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "claude_sessions" ADD CONSTRAINT "claude_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
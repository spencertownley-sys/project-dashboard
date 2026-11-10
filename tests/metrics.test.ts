import { describe, expect, it } from "vitest";
import { buildAlerts } from "@/lib/alerts";
import { isOwnerEmail, authMode, ownerEmails } from "@/lib/auth-core";
import { daysSince, finishScore, focusLanes, hoursAfterToggle, isStale, planQueue, portfolioSummary } from "@/lib/metrics";
import { ciConclusion } from "@/lib/sync/github";
import type { Status } from "@/lib/db/schema";

const today = new Date("2026-11-10T12:00:00Z");
const mk = (id: string, status: Status, pct: number | null, hoursLeft: number | null, value: number | null, lastPush = "2026-11-01") => ({
  id,
  status,
  pct,
  hoursLeft,
  value,
  lastPush,
  needs: null as string | null,
});

describe("finishScore", () => {
  it("is value × completion ÷ hours × 100, one decimal", () => {
    expect(finishScore({ value: 3, pct: 90, hoursLeft: 13 })).toBe(20.8);
    expect(finishScore({ value: 3, pct: 90, hoursLeft: 6 })).toBe(45);
  });
  it("is null when an input is missing or hours is zero", () => {
    expect(finishScore({ value: null, pct: 90, hoursLeft: 6 })).toBeNull();
    expect(finishScore({ value: 3, pct: null, hoursLeft: 6 })).toBeNull();
    expect(finishScore({ value: 3, pct: 90, hoursLeft: 0 })).toBeNull();
  });
});

describe("focusLanes", () => {
  const list = [
    mk("quick", "live", 90, 6, 3),
    mk("launch", "preview", 80, 28, 5),
    mk("steady", "live", 85, 30, 3),
    mk("huge", "building", 25, 200, 5),
    mk("gone", "archive", 90, 2, 5),
  ];
  const lanes = focusLanes(list);
  it("sorts projects into lanes by hours and value", () => {
    expect(lanes.quick.map((p) => p.id)).toEqual(["quick"]);
    expect(lanes.launch.map((p) => p.id)).toEqual(["launch"]);
    expect(lanes.steady.map((p) => p.id)).toEqual(["steady"]);
  });
  it("leaves out archived projects and launch pushes over 60 h", () => {
    const all = [...lanes.quick, ...lanes.launch, ...lanes.steady].map((p) => p.id);
    expect(all).not.toContain("gone");
    expect(all).not.toContain("huge");
  });
});

describe("planQueue", () => {
  it("stacks projects back to back and rounds ETAs up to whole weeks", () => {
    const plan = planQueue([{ hoursLeft: 6 }, { hoursLeft: 13 }, { hoursLeft: null }], 12, today);
    expect(plan.rows.map((r) => [r.startHours, r.endHours])).toEqual([
      [0, 6],
      [6, 19],
      [19, 19],
    ]);
    expect(plan.weeks).toBe(2);
    expect(plan.rows[0].eta.toISOString().slice(0, 10)).toBe("2026-11-17");
    expect(plan.finish.toISOString().slice(0, 10)).toBe("2026-11-24");
  });
});

describe("dates and summary", () => {
  it("counts days since a push and flags stale projects", () => {
    expect(daysSince("2026-11-08", today)).toBe(2);
    expect(isStale({ lastPush: "2026-10-01" }, today)).toBe(true);
    expect(isStale({ lastPush: "2026-10-20" }, today)).toBe(false);
  });
  it("summarizes the portfolio", () => {
    const k = portfolioSummary([mk("a", "live", 80, 10, 3), mk("b", "preview", 60, 20, 4, "2026-05-01"), mk("c", "archive", 0, 5, 1)], today, 12);
    expect(k).toMatchObject({ total: 3, active: 2, live: 1, preview: 1, avgPct: 70, hours: 30, weeks: 3, stale: 1 });
  });
});

describe("hoursAfterToggle", () => {
  it("subtracts when done, adds back when undone, never below zero", () => {
    expect(hoursAfterToggle(10, 4, true)).toBe(6);
    expect(hoursAfterToggle(6, 4, false)).toBe(10);
    expect(hoursAfterToggle(2, 4, true)).toBe(0);
    expect(hoursAfterToggle(null, 4, true)).toBeNull();
  });
});

describe("auth", () => {
  it("uses Clerk only when both keys are set and fails closed in production", () => {
    expect(authMode({ NODE_ENV: "production", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk", CLERK_SECRET_KEY: "sk" } as unknown as NodeJS.ProcessEnv)).toBe("clerk");
    expect(authMode({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toBe("open");
    expect(authMode({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe("closed");
    expect(authMode({ NODE_ENV: "production", ALLOW_NO_AUTH: "1" } as unknown as NodeJS.ProcessEnv)).toBe("open");
  });
  it("matches owner emails case-insensitively and denies everyone when the list is empty", () => {
    const allowed = ownerEmails({ OWNER_EMAILS: " Me@Example.com , other@example.com" } as unknown as NodeJS.ProcessEnv);
    expect(isOwnerEmail(["me@example.com"], allowed)).toBe(true);
    expect(isOwnerEmail(["stranger@example.com"], allowed)).toBe(false);
    expect(isOwnerEmail(["me@example.com"], [])).toBe(false);
  });
});

describe("alerts and CI", () => {
  it("rolls check runs up to one conclusion", () => {
    expect(ciConclusion([])).toBe("none");
    expect(ciConclusion([{ status: "completed", conclusion: "success" }, { status: "completed", conclusion: "failure" }])).toBe("failure");
    expect(ciConclusion([{ status: "in_progress", conclusion: null }])).toBe("pending");
    expect(ciConclusion([{ status: "completed", conclusion: "skipped" }])).toBe("success");
  });
  it("turns notes and failing signals into alerts", () => {
    const at = new Date();
    const alerts = buildAlerts(
      [
        { id: "a", name: "A", needs: "Merge the PR", status: "live" },
        { id: "b", name: "B", needs: null, status: "live" },
      ],
      [
        { projectId: "b", source: "github", key: "ci", value: { conclusion: "failure", branch: "main" }, observedAt: at },
        { projectId: "b", source: "vercel", key: "deployment", value: { state: "ERROR" }, observedAt: at },
        { projectId: "b", source: "supabase", key: "project", value: { status: "INACTIVE" }, observedAt: at },
      ],
    );
    expect(alerts.map((a) => `${a.projectId}:${a.kind}`)).toEqual(["a:needs", "b:ci", "b:deploy", "b:database"]);
  });
});

import { matchProject } from "@/lib/db/seed";
describe("matchProject", () => {
  const list = [
    { id: "jim", name: "JIMOTHY: A Seattle Story" },
    { id: "tp", name: "TaskParty" },
    { id: "cn", name: "Cruise News You Can Use" },
    { id: "ch", name: "Chronologue" },
  ];
  it("links exact names, unique prefixes and trailing question marks", () => {
    expect(matchProject("TaskParty", list)).toBe("tp");
    expect(matchProject("JIMOTHY", list)).toBe("jim");
    expect(matchProject("Cruise News", list)).toBe("cn");
    expect(matchProject("Chronologue?", list)).toBe("ch");
  });
  it("leaves shared or unknown labels unlinked", () => {
    expect(matchProject("TaskParty, Downbeat, Quiz", list)).toBeNull();
    expect(matchProject("Unmatched", list)).toBeNull();
  });
});

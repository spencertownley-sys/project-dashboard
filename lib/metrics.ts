import type { Status } from "./db/schema";

export const STATUS_LABEL: Record<Status, string> = {
  live: "Live",
  preview: "Preview URL",
  building: "Building",
  stalled: "Stalled",
  archive: "Archive",
  idea: "Idea",
  unknown: "Not assessed",
};
export const STATUS_ORDER: Record<Status, number> = {
  live: 0,
  preview: 1,
  building: 2,
  stalled: 3,
  unknown: 4,
  idea: 5,
  archive: 6,
};

type Scored = { pct: number | null; hoursLeft: number | null; value: number | null };
type Base = Scored & { id: string; status: Status; lastPush: string | null };

const DAY = 86_400_000;

/** value × completion ÷ hours left, scaled by 100. Null when any input is missing or hours is zero. */
export function finishScore(p: Scored): number | null {
  if (p.value == null || p.pct == null || p.hoursLeft == null || p.hoursLeft <= 0) return null;
  return Math.round(((p.value * (p.pct / 100)) / p.hoursLeft) * 1000) / 10;
}

export function isActive(p: { status: Status }) {
  return p.status !== "archive" && p.status !== "idea";
}

export function daysSince(date: string | null, today: Date): number | null {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((today.getTime() - d) / DAY));
}

export function isStale(p: { lastPush: string | null }, today: Date, days = 30) {
  const n = daysSince(p.lastPush, today);
  return n != null && n > days;
}

export type Lanes<T> = { quick: T[]; launch: T[]; steady: T[] };

export function focusLanes<T extends Base>(list: T[], perLane = 4): Lanes<T> {
  const pool = list
    .filter(isActive)
    .map((p) => ({ p, s: finishScore(p) }))
    .filter((x): x is { p: T; s: number } => x.s != null);
  const pick = (fn: (p: T) => boolean) =>
    pool
      .filter((x) => fn(x.p))
      .sort((a, b) => b.s - a.s)
      .slice(0, perLane)
      .map((x) => x.p);
  return {
    quick: pick((p) => p.hoursLeft! <= 15),
    launch: pick((p) => (p.value ?? 0) >= 4 && p.hoursLeft! > 15 && p.hoursLeft! <= 60),
    steady: pick((p) => p.hoursLeft! > 15 && (p.value ?? 0) < 4),
  };
}

export type PlanRow<T> = { project: T; startHours: number; endHours: number; eta: Date };

/** Sequential plan: each project starts when the previous one ends, at a fixed number of hours per week. */
export function planQueue<T extends { hoursLeft: number | null }>(queue: T[], hoursPerWeek: number, today: Date) {
  const hpw = Math.max(1, hoursPerWeek);
  let cum = 0;
  const rows: PlanRow<T>[] = queue.map((project) => {
    const start = cum;
    cum += Math.max(0, project.hoursLeft ?? 0);
    return { project, startHours: start, endHours: cum, eta: addWeeks(today, Math.ceil(cum / hpw)) };
  });
  const weeks = Math.ceil(cum / hpw);
  return { rows, totalHours: cum, weeks, finish: addWeeks(today, weeks) };
}

export function addWeeks(d: Date, weeks: number) {
  return new Date(d.getTime() + weeks * 7 * DAY);
}

export function portfolioSummary<T extends Base & { needs: string | null }>(list: T[], today: Date, hoursPerWeek: number) {
  const active = list.filter(isActive);
  const assessed = active.filter((p) => p.pct != null);
  const hours = active.reduce((a, p) => a + (p.hoursLeft ?? 0), 0);
  return {
    total: list.length,
    active: active.length,
    inactive: list.length - active.length,
    live: list.filter((p) => p.status === "live").length,
    preview: list.filter((p) => p.status === "preview").length,
    avgPct: assessed.length ? Math.round(assessed.reduce((a, p) => a + (p.pct ?? 0), 0) / assessed.length) : 0,
    assessed: assessed.length,
    hours: Math.round(hours),
    weeks: Math.ceil(hours / Math.max(1, hoursPerWeek)),
    stale: active.filter((p) => isStale(p, today)).length,
  };
}

/** Hours left after ticking (or unticking) a step, never below zero. */
export function hoursAfterToggle(hoursLeft: number | null, stepHours: number, nowDone: boolean): number | null {
  if (hoursLeft == null) return null;
  const next = nowDone ? hoursLeft - stepHours : hoursLeft + stepHours;
  return Math.max(0, Math.round(next * 10) / 10);
}

export function fmtDate(d: Date, withYear = false) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });
}

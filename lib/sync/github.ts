import { type AdapterResult, type Fetch, getJson, HttpError, pool, type SyncTarget } from "./types";

type Repo = { pushed_at: string | null; archived: boolean; default_branch: string; html_url: string; private: boolean };
type CheckRuns = { total_count: number; check_runs: { status: string; conclusion: string | null }[] };

const FAILING = new Set(["failure", "timed_out", "action_required", "startup_failure"]);

export function ciConclusion(runs: CheckRuns["check_runs"]): "success" | "failure" | "pending" | "none" {
  if (!runs.length) return "none";
  if (runs.some((r) => r.conclusion && FAILING.has(r.conclusion))) return "failure";
  if (runs.some((r) => r.status !== "completed")) return "pending";
  return "success";
}

export async function syncGithub(targets: SyncTarget[], token: string, fetchImpl: Fetch = fetch): Promise<AdapterResult> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "project-control-room",
  };
  const out: AdapterResult = { signals: [], lastPush: new Map(), errors: [] };
  const withRepo = targets.filter((t): t is SyncTarget & { githubRepo: string } => !!t.githubRepo);

  await pool(withRepo, 4, async (t) => {
    const base = `https://api.github.com/repos/${t.githubRepo}`;
    let repo: Repo;
    try {
      repo = await getJson<Repo>(fetchImpl, base, headers);
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) {
        out.signals.push({ projectId: t.id, source: "github", key: "repo", value: { missing: true } });
      } else {
        out.errors.push(`${t.githubRepo}: ${(e as Error).message}`);
      }
      return;
    }
    out.signals.push({
      projectId: t.id,
      source: "github",
      key: "repo",
      value: { archived: repo.archived, defaultBranch: repo.default_branch, url: repo.html_url, private: repo.private, pushedAt: repo.pushed_at },
    });
    if (repo.pushed_at) out.lastPush!.set(t.id, repo.pushed_at.slice(0, 10));

    try {
      const pulls = await getJson<unknown[]>(fetchImpl, `${base}/pulls?state=open&per_page=100`, headers);
      out.signals.push({ projectId: t.id, source: "github", key: "open_prs", value: pulls.length });
    } catch (e) {
      out.errors.push(`${t.githubRepo} pulls: ${(e as Error).message}`);
    }

    try {
      const runs = await getJson<CheckRuns>(fetchImpl, `${base}/commits/${encodeURIComponent(repo.default_branch)}/check-runs?per_page=100`, headers);
      out.signals.push({ projectId: t.id, source: "github", key: "ci", value: { conclusion: ciConclusion(runs.check_runs), branch: repo.default_branch, runs: runs.total_count } });
    } catch (e) {
      // An empty repo has no commits, so GitHub answers 409 or 404. That just means no CI.
      if (e instanceof HttpError && (e.status === 409 || e.status === 404 || e.status === 422)) {
        out.signals.push({ projectId: t.id, source: "github", key: "ci", value: { conclusion: "none", branch: repo.default_branch, runs: 0 } });
      } else {
        out.errors.push(`${t.githubRepo} checks: ${(e as Error).message}`);
      }
    }
  });
  return out;
}

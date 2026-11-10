import type { SignalSource } from "../db/schema";

export type Fetch = typeof fetch;

export type SyncTarget = {
  id: string;
  githubRepo: string | null;
  vercelProject: string | null;
  supabaseRef: string | null;
};

export type SignalWrite = { projectId: string; source: SignalSource; key: string; value: unknown };

export type AdapterResult = {
  signals: SignalWrite[];
  /** project id → ISO date of the last push, from GitHub. */
  lastPush?: Map<string, string>;
  /** values stored in the settings table, e.g. Supabase active project count. */
  settings?: Record<string, unknown>;
  errors: string[];
};

export class HttpError extends Error {
  constructor(
    public status: number,
    url: string,
  ) {
    super(`HTTP ${status} from ${new URL(url).host}${new URL(url).pathname}`);
  }
}

export async function getJson<T>(fetchImpl: Fetch, url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetchImpl(url, { headers, cache: "no-store" });
  if (!res.ok) throw new HttpError(res.status, url);
  return (await res.json()) as T;
}

/** Run tasks with a small concurrency limit so we stay polite to APIs. */
export async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift()!);
  });
  await Promise.all(workers);
}

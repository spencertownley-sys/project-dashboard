"use client";

import { useActionState } from "react";
import { updateProject, type FormState } from "@/app/actions";
import { STATUSES, type Project } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/metrics";

export function EditProjectForm({ p }: { p: Project }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProject, null);
  const f = (name: string) => `edit-${p.id}-${name}`;
  return (
    <form action={action} className="pad" style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="id" value={p.id} />
      <div className="form-grid">
        <label className="field wide" htmlFor={f("name")}>Name<input id={f("name")} name="name" defaultValue={p.name} required /></label>
        <label className="field" htmlFor={f("status")}>
          Status
          <select id={f("status")} name="status" defaultValue={p.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor={f("category")}>Category<input id={f("category")} name="category" defaultValue={p.category} /></label>
        <label className="field" htmlFor={f("pct")}>Complete %<input id={f("pct")} name="pct" type="number" min={0} max={100} step={1} defaultValue={p.pct ?? ""} /></label>
        <label className="field" htmlFor={f("hours")}>Hours left<input id={f("hours")} name="hoursLeft" type="number" min={0} step={0.5} defaultValue={p.hoursLeft ?? ""} /></label>
        <label className="field" htmlFor={f("value")}>Value 1–5<input id={f("value")} name="value" type="number" min={1} max={5} step={1} defaultValue={p.value ?? ""} /></label>
        <label className="field" htmlFor={f("tags")}>Hosting tags (comma separated)<input id={f("tags")} name="hostTags" defaultValue={p.hostTags.join(", ")} /></label>
        <label className="field full" htmlFor={f("summary")}>Summary<textarea id={f("summary")} name="summary" defaultValue={p.summary} rows={2} /></label>
        <label className="field full" htmlFor={f("needs")}>Needs you (leave blank when nothing is waiting on you)<input id={f("needs")} name="needs" defaultValue={p.needs ?? ""} /></label>
        <label className="field wide" htmlFor={f("urls")}>URLs and domains (one per line)<textarea id={f("urls")} name="urls" defaultValue={p.urls.join("\n")} rows={3} /></label>
        <label className="field wide" htmlFor={f("risks")}>Risks and blockers (one per line)<textarea id={f("risks")} name="risks" defaultValue={p.risks.join("\n")} rows={3} /></label>
        <label className="field wide" htmlFor={f("claude")}>Claude project link<input id={f("claude")} name="claudeProjectUrl" type="url" placeholder="https://claude.ai/project/…" defaultValue={p.claudeProjectUrl ?? ""} /></label>
        <label className="field wide" htmlFor={f("gh")}>GitHub repo for sync<input id={f("gh")} name="githubRepo" placeholder="owner/name" defaultValue={p.githubRepo ?? ""} /></label>
        <label className="field wide" htmlFor={f("vercel")}>Vercel project for sync<input id={f("vercel")} name="vercelProject" defaultValue={p.vercelProject ?? ""} /></label>
        <label className="field wide" htmlFor={f("sb")}>Supabase project ref for sync<input id={f("sb")} name="supabaseRef" defaultValue={p.supabaseRef ?? ""} /></label>
      </div>
      <div className="syncbar">
        <button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        {state ? <span role="status" className={state.ok ? "" : "warn"}>{state.message}</span> : null}
      </div>
    </form>
  );
}

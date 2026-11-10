"use client";

import { useActionState } from "react";
import { runSyncNow, type FormState } from "@/app/actions";

export function SyncButton() {
  const [state, action, pending] = useActionState<FormState>(async () => runSyncNow(), null);
  return (
    <form action={action} className="syncbar">
      <button className="btn sm" disabled={pending}>{pending ? "Syncing…" : "Sync now"}</button>
      {state ? <span role="status" className={state.ok ? "" : "warn"}>{state.message}</span> : null}
    </form>
  );
}

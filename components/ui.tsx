import type { Status } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/metrics";

export function Pill({ status }: { status: Status }) {
  return <span className={`pill s-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Bar({ pct, width }: { pct: number; width?: number }) {
  return (
    <span className="bar" style={width ? { width } : undefined} role="img" aria-label={`${pct}% complete`}>
      <i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </span>
  );
}

export function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="chips">
      {items.map((t) => (
        <span key={t} className="chip">
          {t}
        </span>
      ))}
    </div>
  );
}

export function SectionHead({ title, note, children }: { title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {note ? <span className="muted" style={{ fontSize: 12.5 }}>{note}</span> : null}
      {children}
    </div>
  );
}

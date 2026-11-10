"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "Overview"],
  ["/projects", "Projects"],
  ["/infrastructure", "Infrastructure"],
  ["/planner", "Planner"],
  ["/ideas", "Ideas"],
  ["/housekeeping", "Housekeeping"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map(([href, label]) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

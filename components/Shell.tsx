import Link from "next/link";
import { Nav } from "./Nav";

export function Shell({ children, user }: { children: React.ReactNode; user?: React.ReactNode }) {
  return (
    <>
      <header className="top">
        <div className="wrap gut">
          <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="mark">PC</span>Project Control Room
          </Link>
          <Nav />
          {user}
        </div>
      </header>
      <main className="wrap gut">{children}</main>
      <footer className="wrap gut footer">Private dashboard. Estimates are yours to edit on each project page.</footer>
    </>
  );
}

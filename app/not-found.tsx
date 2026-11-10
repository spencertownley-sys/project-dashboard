import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center gut">
      <div className="panel">
        <h1>Nothing here</h1>
        <p className="muted">That project or page doesn’t exist. It may have been renamed.</p>
        <div>
          <Link href="/projects" className="btn">All projects</Link>
        </div>
      </div>
    </main>
  );
}

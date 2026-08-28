import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="text-5xl mb-3">🧐</div>
      <h2 className="text-xl font-bold">Page not found</h2>
      <p className="text-muted mt-1 mb-5">The page you&apos;re looking for isn&apos;t here.</p>
      <Link
        href="/"
        className="rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
      >
        Back to home
      </Link>
    </div>
  );
}

"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-24">
      <div className="text-5xl mb-3">😵</div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted mt-1 mb-5">Please try again.</p>
      <button
        onClick={reset}
        className="rounded-full bg-primary text-white px-5 py-2.5 font-semibold shadow-sm shadow-primary/30 hover:bg-primary-strong"
      >
        Try again
      </button>
    </div>
  );
}

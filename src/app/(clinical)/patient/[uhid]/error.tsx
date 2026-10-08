"use client";

import { useEffect } from "react";

export default function PatientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Patient chart error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-lg rounded-xl border bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-lg font-bold text-red-700">
          Patient Chart Error
        </h2>
        <p className="mb-4 text-sm text-gray-600">{error.message}</p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-gray-400">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: "2rem" }}>
        <h2 style={{ color: "#b91c1c" }}>Something went wrong</h2>
        <p style={{ color: "#4b5563" }}>{error.message}</p>
        {error.digest && (
          <p style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#059669",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

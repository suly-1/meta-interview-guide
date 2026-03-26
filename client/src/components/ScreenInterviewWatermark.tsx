/**
 * ScreenInterviewWatermark
 *
 * A small, tasteful typographic watermark — "SCREEN" (ghost outline) stacked
 * above "INTERVIEW" (solid Meta blue) — intended to be placed subtly inside
 * every tab page.
 *
 * Props:
 *   size      — controls font-size via a Tailwind-friendly rem value (default "2.2rem")
 *   align     — "left" | "center" | "right" (default "right")
 *   className — extra Tailwind classes for positioning (e.g. "absolute top-4 right-4")
 *   opacity   — overall opacity 0–1 (default 0.18)
 */

interface ScreenInterviewWatermarkProps {
  size?: string;
  align?: "left" | "center" | "right";
  className?: string;
  opacity?: number;
}

export default function ScreenInterviewWatermark({
  size = "2.2rem",
  align = "right",
  className = "",
  opacity = 0.18,
}: ScreenInterviewWatermarkProps) {
  const textAlign = align === "left" ? "left" : align === "center" ? "center" : "right";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none flex flex-col gap-0 leading-none ${className}`}
      style={{ opacity, textAlign }}
    >
      {/* SCREEN — stroke-only ghost outline */}
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: size,
          fontWeight: 300,
          letterSpacing: "-0.02em",
          WebkitTextStroke: "1px rgba(255,255,255,0.55)",
          color: "transparent",
          lineHeight: 1,
          textTransform: "uppercase",
          display: "block",
        }}
      >
        SCREEN
      </span>
      {/* INTERVIEW — solid Meta blue, heavy weight */}
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: size,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#0864ff",
          lineHeight: 1,
          textTransform: "uppercase",
          display: "block",
          textShadow: "0 0 20px rgba(8,100,255,0.4)",
        }}
      >
        INTERVIEW
      </span>
    </div>
  );
}

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Fires a confetti celebration when `trigger` transitions from false → true.
 * Uses a ref so it only fires once per session even if the component re-renders.
 */
export function useConfetti(trigger: boolean) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!trigger || firedRef.current) return;
    firedRef.current = true;

    // Burst from both sides
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });
  }, [trigger]);

  // Reset the guard when trigger goes back to false (e.g. user unchecks)
  useEffect(() => {
    if (!trigger) firedRef.current = false;
  }, [trigger]);
}

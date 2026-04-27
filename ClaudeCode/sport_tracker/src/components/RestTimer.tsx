// src/components/RestTimer.tsx — Rest timer display component

import React from "react";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { formatRemaining } from "../lib/timer.js";

export function RestTimer(): React.ReactElement | null {
  const { remaining, isRunning, skip, extend } = useRestTimer();

  if (!isRunning) {
    return null;
  }

  return (
    <div role="timer" aria-live="polite">
      <span style={{ fontSize: "48px", fontWeight: "bold" }}>
        {formatRemaining(remaining)}
      </span>
      <div>
        <button type="button" onClick={() => extend(15_000)}>
          +15s
        </button>
        <button type="button" onClick={() => skip()}>
          Skip
        </button>
      </div>
    </div>
  );
}

// src/components/RestTimer.tsx — Rest timer display component

import React from "react";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { formatRemaining } from "../lib/timer.js";
import "../styles/timer.css";

export function RestTimer(): React.ReactElement | null {
  const { remaining, isRunning, skip, extend } = useRestTimer();

  if (!isRunning) {
    return null;
  }

  const rootClassName = `timer${isRunning ? " timer--active" : ""}`;

  return (
    <div role="timer" aria-live="polite" className={rootClassName}>
      <span className="timer__display">
        {formatRemaining(remaining)}
      </span>
      <div className="timer__controls">
        <button type="button" className="timer__btn" onClick={() => extend(15_000)}>
          +15s
        </button>
        <button type="button" className="timer__btn" onClick={() => skip()}>
          Skip
        </button>
      </div>
    </div>
  );
}

// src/components/RestTimer.tsx — Rest timer display component

import React from "react";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { formatRemaining } from "../lib/timer.js";
import "../styles/timer.css";

interface RestTimerProps {
  sticky?: boolean;
}

export function RestTimer({ sticky = false }: RestTimerProps): React.ReactElement | null {
  const { remaining, isRunning, skip, extend } = useRestTimer();

  if (!isRunning) {
    return null;
  }

  const className = `timer timer--active${sticky ? " timer--sticky" : ""}`;

  return (
    <div role="timer" aria-live="polite" className={className}>
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

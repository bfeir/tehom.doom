// src/components/RestTimer.tsx — Rest timer display component

import React from "react";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { formatRemaining } from "../lib/timer.js";
import "../styles/timer.css";

interface RestTimerProps {
  sticky?: boolean;
  setNumber?: number;
}

export function RestTimer({ sticky = false, setNumber }: RestTimerProps): React.ReactElement {
  const { remaining, isRunning, start, skip, extend } = useRestTimer();

  const className = `timer${sticky ? " timer--sticky" : ""}${isRunning ? " timer--active" : ""}`;

  return (
    <div role="timer" aria-live="polite" className={className}>
      {isRunning ? (
        <>
          {setNumber !== undefined && (
            <span className="timer__label">Rest after set {setNumber}</span>
          )}
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
        </>
      ) : (
        <>
          {setNumber !== undefined && (
            <span className="timer__label">Set {setNumber + 1}</span>
          )}
          <div className="timer__controls">
            <button type="button" className="timer__btn" onClick={() => start()}>
              Start Rest
            </button>
          </div>
        </>
      )}
    </div>
  );
}

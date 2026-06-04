import React from "react";
import { useRestTimer } from "../hooks/useRestTimer.js";
import { computeRemaining, formatRemaining } from "../lib/timer.js";
import "../styles/timer.css";

const EXTEND_MS = 15_000;
const DEFAULT_DURATION_MS = 90_000;

interface RestTimerProps {
  sticky?: boolean;
  setNumber?: number;
  startedAt?: number | null;
  duration?: number;
  isRunning?: boolean;
  onExtend?: (ms: number) => void;
  onSkip?: () => void;
}

export function RestTimer({
  sticky = false,
  setNumber,
  startedAt,
  duration,
  isRunning: isRunningProp,
  onExtend,
  onSkip,
}: RestTimerProps): React.ReactElement {
  const isControlled = isRunningProp !== undefined;

  const hook = isControlled ? null : useRestTimer(); // eslint-disable-line react-hooks/rules-of-hooks

  const isRunning = isControlled ? isRunningProp : hook!.isRunning;

  const remaining = isControlled
    ? computeControlledRemaining(startedAt, duration)
    : hook!.remaining;

  const handleExtend = isControlled
    ? () => onExtend?.(EXTEND_MS)
    : () => hook!.extend(EXTEND_MS);

  const handleSkip = isControlled
    ? () => onSkip?.()
    : () => hook!.skip();

  const handleStart = isControlled ? () => {} : () => hook!.start();

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
            <button type="button" className="timer__btn" onClick={handleExtend}>
              +15s
            </button>
            <button type="button" className="timer__btn" onClick={handleSkip}>
              Skip
            </button>
          </div>
        </>
      ) : (
        <>
          {setNumber !== undefined && (
            <span className="timer__label">Set {setNumber + 1}</span>
          )}
          {isControlled ? (
            <span className="timer__display">
              {formatRemaining(remaining)}
            </span>
          ) : (
            <div className="timer__controls">
              <button type="button" className="timer__btn" onClick={handleStart}>
                Start Rest
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function computeControlledRemaining(
  startedAt: number | null | undefined,
  duration: number | undefined
): number {
  const durationMs = duration ?? DEFAULT_DURATION_MS;
  if (startedAt == null) {
    return durationMs;
  }
  return computeRemaining(startedAt, durationMs, Date.now());
}

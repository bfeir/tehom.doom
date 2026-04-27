import React from "react";

export interface ReadinessSignalDisplay {
  state: "NOT_YET" | "READY" | "REVIEW";
  streakCurrent: number;
  streakRequired: number;
  criterionSummary: string;
  nextExerciseId: string | null;
  rrWikiUrl: string;
  formScoreHistory: number[];
}

export interface ReadinessCardProps {
  signal: ReadinessSignalDisplay | null;
  isOffline?: boolean;
  hasTimedOut?: boolean;
  onRetry?: () => void;
}

function OfflineMessage(): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--offline">
      <p>Readiness check needs a connection. Your session is saved.</p>
    </div>
  );
}

function TimeoutMessage({ onRetry }: { onRetry?: () => void }): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--timeout">
      <p>Could not compute readiness. Try again.</p>
      <button type="button" onClick={onRetry} aria-label="Try again">
        Try again
      </button>
    </div>
  );
}

function NoSessionMessage(): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--no-session">
      <p>Log more sessions to see your readiness. Keep training at this level.</p>
    </div>
  );
}

function NotYetCard({ signal }: { signal: ReadinessSignalDisplay }): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--not-yet">
      <h2>Not yet</h2>
      <p>
        {signal.streakCurrent} of {signal.streakRequired} consecutive sessions completed
      </p>
      <p>{signal.criterionSummary}</p>
      {signal.rrWikiUrl && (
        <a href={signal.rrWikiUrl} target="_blank" rel="noreferrer">
          RR Wiki
        </a>
      )}
    </div>
  );
}

function ReadyCard({ signal }: { signal: ReadinessSignalDisplay }): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--ready">
      <h2>Ready to advance!</h2>
      <p>{signal.criterionSummary}</p>
      <button type="button">View Progression Chain</button>
      {signal.rrWikiUrl && (
        <a href={signal.rrWikiUrl} target="_blank" rel="noreferrer">
          RR Wiki
        </a>
      )}
    </div>
  );
}

function ReviewCard({ signal }: { signal: ReadinessSignalDisplay }): React.ReactElement {
  return (
    <div className="readiness-card readiness-card--review">
      <h2>Review your form</h2>
      <p>Check your form before advancing</p>
      <p>{signal.criterionSummary}</p>
      {signal.rrWikiUrl && (
        <a href={signal.rrWikiUrl} target="_blank" rel="noreferrer">
          RR Wiki
        </a>
      )}
    </div>
  );
}

export function ReadinessCard(props: ReadinessCardProps): React.ReactElement {
  const { signal, isOffline = false, hasTimedOut = false, onRetry } = props;

  if (isOffline) {
    return <OfflineMessage />;
  }

  if (hasTimedOut) {
    return <TimeoutMessage onRetry={onRetry} />;
  }

  if (signal === null) {
    return <NoSessionMessage />;
  }

  if (signal.state === "NOT_YET") {
    return <NotYetCard signal={signal} />;
  }

  if (signal.state === "READY") {
    return <ReadyCard signal={signal} />;
  }

  return <ReviewCard signal={signal} />;
}

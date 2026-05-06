import React from "react";
import type { Exercise } from "../types/index.js";
import "../styles/chain.css";

export interface ProgressionChainProps {
  chain: Exercise[];
  currentExerciseId: string | null;
  isOffline?: boolean;
}

function EndOfChainMessage(): React.ReactElement {
  return (
    <p className="progression-chain__end-message">
      You&apos;ve reached the end of this progression!
    </p>
  );
}

function FreeTextOrientationMessage(): React.ReactElement {
  return (
    <p className="progression-chain__orientation-message">
      Your current exercise is not in the RR progression registry. Here is the
      standard chain for reference:
    </p>
  );
}

function NextExercisePanel({ exercise }: { exercise: Exercise }): React.ReactElement {
  return (
    <div className="progression-chain__next-exercise">
      <h3>Next: {exercise.name}</h3>
      {exercise.criteria && (
        <ul className="progression-chain__criteria">
          <li>Target: {exercise.criteria.targetSets}×{exercise.criteria.targetReps}</li>
          <li>Consecutive sessions: {exercise.criteria.consecutiveSessions}</li>
          <li>Min form quality: {exercise.criteria.minFormQuality}/5</li>
        </ul>
      )}
      {exercise.rrWikiUrl && (
        <a
          href={exercise.rrWikiUrl}
          target="_blank"
          rel="noreferrer"
          className="progression-chain__wiki-link"
        >
          RR Wiki source
        </a>
      )}
    </div>
  );
}

function ExerciseListItem({
  exercise,
  isCurrent,
}: {
  exercise: Exercise;
  isCurrent: boolean;
}): React.ReactElement {
  return (
    <li
      className={`progression-chain__item${isCurrent ? " progression-chain__item--current" : ""}`}
      aria-current={isCurrent ? "step" : undefined}
    >
      {exercise.name}
      {isCurrent && (
        <span className="progression-chain__current-badge"> (current)</span>
      )}
    </li>
  );
}

export function ProgressionChain(props: ProgressionChainProps): React.ReactElement {
  const { chain, currentExerciseId, isOffline = false } = props;

  const currentIndex = currentExerciseId
    ? chain.findIndex((exercise) => exercise.id === currentExerciseId)
    : -1;

  const isCurrentExerciseUntracked = currentExerciseId === null;
  const isEndOfChain = currentIndex >= 0 && currentIndex === chain.length - 1;
  const nextExercise =
    currentIndex >= 0 && currentIndex + 1 < chain.length
      ? chain[currentIndex + 1]
      : null;

  return (
    <div className="progression-chain">
      {isOffline && (
        <div className="progression-chain__offline-banner" role="status" aria-label="offline indicator">
          You are offline — data may be outdated
        </div>
      )}
      {isCurrentExerciseUntracked && <FreeTextOrientationMessage />}
      <ol className="progression-chain__list">
        {chain.map((exercise) => (
          <ExerciseListItem
            key={exercise.id}
            exercise={exercise}
            isCurrent={exercise.id === currentExerciseId}
          />
        ))}
      </ol>
      {isEndOfChain && <EndOfChainMessage />}
      {nextExercise && <NextExercisePanel exercise={nextExercise} />}
    </div>
  );
}

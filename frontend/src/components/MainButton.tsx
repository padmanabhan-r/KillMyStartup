import type { AppState } from '../types';

interface Props {
  state: AppState;
  onStart: () => void;
  onStop: () => void;
}

const stateLabel: Record<AppState, string> = {
  idle: 'Kill My Startup',
  listening: 'Listening...',
  searching: 'Pondering...',
  roasting: 'Taking notes...',
};

export function MainButton({ state, onStart, onStop }: Props) {
  const isActive = state !== 'idle';

  return (
    <div className="button-area">
      <button
        className={`main-btn main-btn--${state}`}
        onClick={isActive ? onStop : onStart}
      >
        <span className="main-btn__ring" />
        <span className="main-btn__label">{stateLabel[state]}</span>
      </button>
      {isActive && (
        <p className="button-hint" onClick={onStop}>
          Click to end session
        </p>
      )}
    </div>
  );
}

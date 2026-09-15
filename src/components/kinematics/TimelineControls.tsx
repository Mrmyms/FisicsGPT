import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { TrajectoryPoint, MotionTelemetry } from '../../types/kinematics';

interface TimelineControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  currentTime: number;
  maxTime: number;
  onChangeMaxTime?: (time: number) => void;
  onSeek: (time: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  mode?: 'projectile' | 'mru' | 'mrua';
  telemetry?: TrajectoryPoint;
  motionTelemetry?: MotionTelemetry;
}

const SPEEDS = [0.25, 0.5, 1, 2];

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  currentTime,
  maxTime,
  onChangeMaxTime,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  mode = 'projectile',
  telemetry,
  motionTelemetry
}) => {
  const [durationInput, setDurationInput] = React.useState(maxTime.toFixed(1));

  React.useEffect(() => {
    setDurationInput(maxTime.toFixed(1));
  }, [maxTime]);

  const commitDuration = (valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0.5 && val <= 120 && onChangeMaxTime) {
      onChangeMaxTime(val);
      setDurationInput(val.toFixed(1));
    } else {
      setDurationInput(maxTime.toFixed(1));
    }
  };

  return (
    <div className="timeline-bar">
      <div className="timeline-btn-group">
        <button className="timeline-play-btn" onClick={onTogglePlay} title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        <button className="btn-icon" onClick={onReset} title="Reiniciar a t = 0">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="timeline-scrubber">
        <div className="timeline-scrubber-labels">
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>t = {currentTime.toFixed(2)} s</span>
          <div className="timeline-duration-control" title="Modificar la duración de la simulación (segundos)">
            <span>{mode === 'projectile' ? 't_vuelo' : 't_max'}:</span>
            {onChangeMaxTime ? (
              <input
                type="number"
                min="0.5"
                max="120"
                step="0.5"
                value={durationInput}
                onChange={(e) => {
                  setDurationInput(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.5 && val <= 120) {
                    onChangeMaxTime(val);
                  }
                }}
                onBlur={(e) => commitDuration(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitDuration((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="timeline-duration-input"
              />
            ) : (
              <span style={{ fontWeight: 600 }}>{maxTime.toFixed(2)}</span>
            )}
            <span>s</span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0.01, maxTime)}
          step={Math.max(0.01, maxTime / 200)}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
        />
      </div>

      <div className="timeline-speed-group">
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`pill-btn ${playbackSpeed === s ? 'active' : ''}`}
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            onClick={() => onChangeSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="timeline-telemetry">
        {mode === 'projectile' && telemetry && (
          <>
            <span className="telemetry-tag">x: {telemetry.x.toFixed(2)}m</span>
            <span className="telemetry-tag">y: {telemetry.y.toFixed(2)}m</span>
            <span className="telemetry-tag" style={{ color: '#eab308' }}>|v|: {telemetry.v.toFixed(2)}m/s</span>
          </>
        )}

        {mode === 'mru' && motionTelemetry && (
          <>
            <span className="telemetry-tag">x: {motionTelemetry.x.toFixed(2)}m</span>
            <span className="telemetry-tag" style={{ color: '#10b981' }}>v: {motionTelemetry.v.toFixed(2)}m/s</span>
            <span className="telemetry-tag" style={{ color: '#64748b' }}>a: 0.00 m/s²</span>
          </>
        )}

        {mode === 'mrua' && motionTelemetry && (
          <>
            <span className="telemetry-tag">x: {motionTelemetry.x.toFixed(2)}m</span>
            <span className="telemetry-tag" style={{ color: '#10b981' }}>v: {motionTelemetry.v.toFixed(2)}m/s</span>
            <span className="telemetry-tag" style={{ color: '#f59e0b' }}>a: {motionTelemetry.a.toFixed(2)}m/s²</span>
          </>
        )}
      </div>
    </div>
  );
};

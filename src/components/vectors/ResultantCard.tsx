import { useState } from 'react';
import { formatNum } from '../../math/vectorMath';
import { Latex } from '../Latex';
import type { VectorOperation, CoordinateMode } from '../../types/vectors';

interface ResultantCardProps {
  operation: VectorOperation;
  resultVector?: {
    x: number;
    y: number;
    magnitude: number;
    angleDeg: number;
  };
  displayMode?: CoordinateMode;
  onToggleDisplayMode?: () => void;
}

export const ResultantCard: React.FC<ResultantCardProps> = ({
  operation,
  resultVector,
  displayMode,
  onToggleDisplayMode
}) => {
  const [internalMode, setInternalMode] = useState<CoordinateMode>('polar');
  const activeMode = displayMode ?? internalMode;

  if (!resultVector || operation === 'none') return null;

  const isSum = operation === 'sum';
  const label = isSum ? 'R' : 'D';
  const title = isSum ? 'Vector Resultante (R)' : 'Vector Diferencia (D)';
  const color = isSum ? '#eab308' : '#ec4899'; // Dorado para Suma, Rosa para Resta

  const rx = resultVector.x;
  const ry = resultVector.y;
  const mag = resultVector.magnitude;
  const ang = resultVector.angleDeg;

  // Representación canónica en LaTeX
  const rectLatex = `\\vec{${label}} = (${formatNum(rx)}\\hat{i} ${ry >= 0 ? '+' : ''} ${formatNum(ry)}\\hat{j})`;
  const polarLatex = `\\vec{${label}} = ${formatNum(mag)} \\,\\angle\\, ${formatNum(ang)}^\\circ`;

  const handleToggle = () => {
    if (onToggleDisplayMode) {
      onToggleDisplayMode();
    } else {
      setInternalMode((prev) => (prev === 'polar' ? 'cartesian' : 'polar'));
    }
  };

  return (
    <div
      style={{
        background: isSum ? 'rgba(234, 179, 8, 0.06)' : 'rgba(236, 72, 153, 0.06)',
        border: `1.5px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: `0 0 16px ${isSum ? 'rgba(234, 179, 8, 0.15)' : 'rgba(236, 72, 153, 0.15)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            {title}
          </span>
          <button
            className="btn-card-action"
            onClick={handleToggle}
            title={`Formato actual: ${activeMode === 'polar' ? 'Angular / Polar (r, θ)' : 'Rectangular (x, y)'}. Clic para cambiar`}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              border: `1px solid ${color}`,
              background: 'var(--bg-input)',
              color: color,
              cursor: 'pointer'
            }}
          >
            {activeMode === 'polar' ? '(r, θ)' : '(x, y)'}
          </button>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: color,
            color: '#0f172a'
          }}
        >
          {isSum ? 'A + B' : 'A - B'}
        </span>
      </div>

      {/* Visualización individual según el modo activo: Angular/Polar o Rectangular */}
      {activeMode === 'polar' ? (
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="input-label" style={{ color: color, fontWeight: 700 }}>
              Formato Angular / Polar (r, θ)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Magnitud y Ángulo
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
            <span>|{label}|: <b style={{ color: color }}>{formatNum(mag)}</b></span>
            <span>θ: <b style={{ color: color }}>{formatNum(ang)}°</b></span>
          </div>

          <div style={{ marginTop: '2px', textAlign: 'center', overflowX: 'auto', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px' }}>
            <Latex math={polarLatex} />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-tertiary)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="input-label" style={{ color: color, fontWeight: 700 }}>
              Formato Rectangular (x, y)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Componentes Cartesianas
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
            <span>{label}_x: <b style={{ color: color }}>{formatNum(rx)}</b></span>
            <span>{label}_y: <b style={{ color: color }}>{formatNum(ry)}</b></span>
          </div>

          <div style={{ marginTop: '2px', textAlign: 'center', overflowX: 'auto', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px' }}>
            <Latex math={rectLatex} />
          </div>
        </div>
      )}
    </div>
  );
};

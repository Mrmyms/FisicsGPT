import React from 'react';
import type { CriticalPoints } from '../../types/kinematics';
import { formatNum } from '../../math/vectorMath';

interface CriticalPointsCardProps {
  criticalPoints: CriticalPoints;
  projectileName?: string;
  projectileColor?: string;
}

export const CriticalPointsCard: React.FC<CriticalPointsCardProps> = ({
  criticalPoints,
  projectileName,
  projectileColor = '#38bdf8'
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="input-label">Puntos Notables Calculados</span>
        {projectileName && (
          <span
            className="badge"
            style={{
              background: `${projectileColor}22`,
              color: projectileColor,
              border: `1px solid ${projectileColor}55`,
              fontSize: '0.72rem',
              fontWeight: 700
            }}
          >
            ● {projectileName}
          </span>
        )}
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">Altura Máx (H_max)</span>
          <span className="metric-value" style={{ color: '#f59e0b' }}>
            {formatNum(criticalPoints.hMax)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m</span>
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Alcance Total (R)</span>
          <span className="metric-value" style={{ color: '#10b981' }}>
            {formatNum(criticalPoints.alcanceMax)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m</span>
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Tiempo de Vuelo (t_v)</span>
          <span className="metric-value" style={{ color: '#38bdf8' }}>
            {formatNum(criticalPoints.tVuelo)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>s</span>
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Tiempo de Subida (t_s)</span>
          <span className="metric-value" style={{ color: '#818cf8' }}>
            {formatNum(criticalPoints.tSubida)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>s</span>
          </span>
        </div>

        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <span className="metric-label">Rapidez de Impacto</span>
          <span className="metric-value" style={{ color: '#f43f5e' }}>
            {formatNum(criticalPoints.vImpacto)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m/s</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
              ({formatNum(criticalPoints.anguloImpactoDeg)}°)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sliders, Eye, EyeOff, Compass, TrendingUp, Activity, Gauge, Plus, Trash2 } from 'lucide-react';
import type { ProjectileParams, ProjectileItem, MotionGraphType } from '../../types/kinematics';
import { PLANET_PRESETS } from '../../math/kinematicsMath';
import { formatNum } from '../../math/vectorMath';

interface KinematicsControlsProps {
  params: ProjectileParams;
  onChangeParams: (params: ProjectileParams) => void;
  graphType: MotionGraphType;
  onSelectGraphType: (type: MotionGraphType) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showComponents: boolean;
  onToggleComponents: () => void;
  // Soporte Multi-Tiro
  projectiles?: ProjectileItem[];
  activeProjectileId?: string;
  onSelectProjectile?: (id: string) => void;
  onAddProjectile?: () => void;
  onDeleteProjectile?: (id: string) => void;
  onToggleProjectileVisibility?: (id: string) => void;
}

export const KinematicsControls: React.FC<KinematicsControlsProps> = ({
  params,
  onChangeParams,
  graphType,
  onSelectGraphType,
  showVectors,
  onToggleVectors,
  showComponents,
  onToggleComponents,
  projectiles = [],
  activeProjectileId,
  onSelectProjectile,
  onAddProjectile,
  onDeleteProjectile,
  onToggleProjectileVisibility
}) => {
  const updateField = (field: keyof ProjectileParams, val: number) => {
    onChangeParams({
      ...params,
      [field]: isNaN(val) ? 0 : val
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 0. Gestor de Múltiples Tiros Parabólicos */}
      {projectiles.length > 0 && (
        <div className="expression-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span className="input-label" style={{ fontWeight: 700 }}>Proyectiles en Simulación</span>
            <button
              className="pill-btn active"
              onClick={onAddProjectile}
              style={{ fontSize: '0.75rem', padding: '5px 10px', gap: '4px' }}
              title="Añadir nuevo tiro con parámetros independientes"
            >
              <Plus size={14} />
              <span>Agregar Tiro</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {projectiles.map(p => {
              const isSelected = p.id === activeProjectileId;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProjectile?.(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-input-focus)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: p.color,
                        boxShadow: `0 0 6px ${p.color}`
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({p.params.v0} m/s, {p.params.angleDeg}°)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-card-action"
                      onClick={() => onToggleProjectileVisibility?.(p.id)}
                      title={p.visible ? 'Ocultar tiro' : 'Mostrar tiro'}
                      style={{ color: p.visible ? p.color : 'var(--text-muted)' }}
                    >
                      {p.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {projectiles.length > 1 && (
                      <button
                        className="btn-card-action"
                        onClick={() => onDeleteProjectile?.(p.id)}
                        title="Eliminar tiro"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Selector de Método de Graficación para Tiro Parabólico */}
      <div className="expression-card">
        <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
          Método de Graficación (Tiro Parabólico)
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            className={`pill-btn ${graphType === 'trajectory_2d' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem' }}
            onClick={() => onSelectGraphType('trajectory_2d')}
          >
            <Compass size={16} style={{ marginRight: '8px', color: '#38bdf8', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Trayectoria 2D (Simulación Real)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Plano físico (x, y), plataforma, suelo y puntos clave
              </div>
            </div>
          </button>

          <button
            className={`pill-btn ${graphType === 'x_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem' }}
            onClick={() => onSelectGraphType('x_vs_t')}
          >
            <TrendingUp size={16} style={{ marginRight: '8px', color: '#10b981', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Distancia vs Tiempo (x, y vs t)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Altura y(t) parabólica y avance x(t) lineal
              </div>
            </div>
          </button>

          <button
            className={`pill-btn ${graphType === 'v_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem' }}
            onClick={() => onSelectGraphType('v_vs_t')}
          >
            <Activity size={16} style={{ marginRight: '8px', color: '#eab308', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Rapidez vs Tiempo (|v| vs t)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Mínimo en vértice (|v| = v_x) y componentes
              </div>
            </div>
          </button>

          <button
            className={`pill-btn ${graphType === 'a_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem' }}
            onClick={() => onSelectGraphType('a_vs_t')}
          >
            <Gauge size={16} style={{ marginRight: '8px', color: '#f59e0b', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Aceleración vs Tiempo (a vs t)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Gravedad constante a_y = -g y a_x = 0
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Selector de Planetas / Gravedad */}
      <div className="expression-card">
        <span className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
          Entorno Gravitacional
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {PLANET_PRESETS.map((p) => (
            <button
              key={p.name}
              className={`pill-btn ${Math.abs(params.g - p.g) < 0.05 ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 4px', flexDirection: 'column', gap: '2px' }}
              onClick={() => updateField('g', p.g)}
            >
              <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Control: Velocidad Inicial v0 */}
      <div className="expression-card">
        <div className="input-row" style={{ marginBottom: '6px' }}>
          <div className="input-field" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="input-label">Velocidad Inicial (v₀)</span>
              <span className="slider-value" style={{ color: '#38bdf8' }}>{formatNum(params.v0)} m/s</span>
            </div>
            <div className="input-box">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={params.v0}
                onChange={(e) => updateField('v0', parseFloat(e.target.value))}
              />
              <span className="input-unit">m/s</span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="80"
          step="0.5"
          value={params.v0}
          onChange={(e) => updateField('v0', parseFloat(e.target.value))}
        />
      </div>

      {/* 4. Control: Ángulo de Lanzamiento θ */}
      <div className="expression-card">
        <div className="input-row" style={{ marginBottom: '6px' }}>
          <div className="input-field" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="input-label">Ángulo de Disparo (θ)</span>
              <span className="slider-value" style={{ color: '#eab308' }}>{formatNum(params.angleDeg)}°</span>
            </div>
            <div className="input-box">
              <input
                type="number"
                min="0"
                max="90"
                step="1"
                value={params.angleDeg}
                onChange={(e) => updateField('angleDeg', parseFloat(e.target.value))}
              />
              <span className="input-unit">°</span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="90"
          step="1"
          value={params.angleDeg}
          onChange={(e) => updateField('angleDeg', parseFloat(e.target.value))}
        />
      </div>

      {/* 5. Control: Altura Inicial y0 */}
      <div className="expression-card">
        <div className="input-row" style={{ marginBottom: '6px' }}>
          <div className="input-field" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="input-label">Altura de Lanzamiento (y₀)</span>
              <span className="slider-value" style={{ color: '#10b981' }}>{formatNum(params.y0)} m</span>
            </div>
            <div className="input-box">
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={params.y0}
                onChange={(e) => updateField('y0', parseFloat(e.target.value))}
              />
              <span className="input-unit">m</span>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="40"
          step="0.5"
          value={params.y0}
          onChange={(e) => updateField('y0', parseFloat(e.target.value))}
        />
      </div>

      {/* 6. Opciones de Visualización 2D (sólo activas en Trayectoria 2D) */}
      {graphType === 'trajectory_2d' && (
        <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <span className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
            Vectores en el Plano Físico
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className={`pill-btn ${showVectors ? 'active' : ''}`}
              onClick={onToggleVectors}
              style={{ justifyContent: 'flex-start' }}
            >
              <Eye size={15} />
              <span>Vector Velocidad Instantáneo v(t)</span>
            </button>

            <button
              className={`pill-btn ${showComponents ? 'active' : ''}`}
              onClick={onToggleComponents}
              style={{ justifyContent: 'flex-start' }}
            >
              <Sliders size={15} />
              <span>Componentes Ortogonales (v_x, v_y)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

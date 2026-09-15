import React, { useState } from 'react';
import { TrendingUp, Activity, Gauge, RotateCcw, ShieldAlert, Zap, Target, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { MRUAParams, MRUAItem, MotionGraphType } from '../../types/kinematics';
import { formatNum } from '../../math/vectorMath';
import { Latex } from '../Latex';

interface MRUAControlsProps {
  params: MRUAParams;
  onChangeParams: (newParams: MRUAParams) => void;
  graphType: MotionGraphType;
  onSelectGraphType: (type: MotionGraphType) => void;
  currentTime: number;
  onSeekTime?: (t: number) => void;
  // Soporte Multi-MRUA
  mruaItems?: MRUAItem[];
  activeMruaId?: string;
  onSelectMrua?: (id: string) => void;
  onAddMrua?: () => void;
  onDeleteMrua?: (id: string) => void;
  onToggleMruaVisibility?: (id: string) => void;
}

export const MRUAControls: React.FC<MRUAControlsProps> = ({
  params,
  onChangeParams,
  graphType,
  onSelectGraphType,
  currentTime,
  onSeekTime,
  mruaItems = [],
  activeMruaId,
  onSelectMrua,
  onAddMrua,
  onDeleteMrua,
  onToggleMruaVisibility
}) => {
  const [targetDistance, setTargetDistance] = useState<number>(60);

  const currentX = params.x0 + params.v0 * currentTime + 0.5 * params.a * currentTime * currentTime;
  const currentV = params.v0 + params.a * currentTime;
  const currentSpeed = Math.abs(currentV);
  const deltaX = currentX - params.x0;
  const torricelliV2 = params.v0 * params.v0 + 2 * params.a * deltaX;

  // Detección y análisis de frenado
  const isBraking = params.v0 !== 0 && params.a !== 0 && (params.v0 * params.a < 0);
  const tStop = isBraking ? -params.v0 / params.a : null;
  const dBraking = isBraking ? (params.v0 * params.v0) / (2 * Math.abs(params.a)) : null;

  // Ecuaciones KaTeX vivas
  const signV0 = params.v0 >= 0 ? '+' : '-';
  const absV0 = Math.abs(params.v0);
  const halfA = 0.5 * params.a;
  const signHalfA = halfA >= 0 ? '+' : '-';
  const absHalfA = Math.abs(halfA);

  const xFormulaLatex = `x(t) = ${formatNum(params.x0)} ${signV0} ${formatNum(absV0)}t ${signHalfA} ${formatNum(absHalfA)}t^2`;
  const vFormulaLatex = `v(t) = ${formatNum(params.v0)} ${params.a >= 0 ? '+' : '-'} ${formatNum(Math.abs(params.a))}t`;

  // Tiempo requerido para distancia objetivo (ecuación cuadrática 0.5*a*t^2 + v0*t + (x0 - d) = 0)
  let tToTarget: number | null = null;
  if (Math.abs(params.a) < 1e-4) {
    if (Math.abs(params.v0) > 1e-4) {
      const t = (targetDistance - params.x0) / params.v0;
      if (t >= 0) tToTarget = t;
    }
  } else {
    const A = 0.5 * params.a;
    const B = params.v0;
    const C = params.x0 - targetDistance;
    const disc = B * B - 4 * A * C;
    if (disc >= 0) {
      const t1 = (-B + Math.sqrt(disc)) / (2 * A);
      const t2 = (-B - Math.sqrt(disc)) / (2 * A);
      const validT = [t1, t2].filter(t => t >= 0);
      if (validT.length > 0) {
        tToTarget = Math.min(...validT);
      }
    }
  }

  const updateParam = (field: keyof MRUAParams, val: number) => {
    onChangeParams({
      ...params,
      [field]: isNaN(val) ? 0 : val
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 0. Gestor de Múltiples Móviles MRUA */}
      {mruaItems.length > 0 && (
        <div className="expression-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span className="input-label" style={{ fontWeight: 700 }}>Móviles MRUA en Pista</span>
            <button
              className="pill-btn active"
              onClick={onAddMrua}
              style={{ fontSize: '0.75rem', padding: '5px 10px', gap: '4px' }}
              title="Añadir nuevo móvil acelerado"
            >
              <Plus size={14} />
              <span>Agregar Móvil</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mruaItems.map(a => {
              const isSelected = a.id === activeMruaId;
              return (
                <div
                  key={a.id}
                  onClick={() => onSelectMrua?.(a.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? `2px solid ${a.color}` : '1px solid var(--border-subtle)',
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
                        backgroundColor: a.color,
                        boxShadow: `0 0 6px ${a.color}`
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (v₀ = {a.params.v0}m/s, a = {a.params.a}m/s²)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-card-action"
                      onClick={() => onToggleMruaVisibility?.(a.id)}
                      title={a.visible ? 'Ocultar móvil' : 'Mostrar móvil'}
                      style={{ color: a.visible ? a.color : 'var(--text-muted)' }}
                    >
                      {a.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {mruaItems.length > 1 && (
                      <button
                        className="btn-card-action"
                        onClick={() => onDeleteMrua?.(a.id)}
                        title="Eliminar móvil"
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

      {/* 1. Selector de los 3 Métodos de Graficación Requeridos */}
      <div className="expression-card">
        <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
          Método de Graficación (MRUA)
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            className={`pill-btn ${graphType === 'x_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem' }}
            onClick={() => onSelectGraphType('x_vs_t')}
          >
            <TrendingUp size={16} style={{ marginRight: '8px', color: '#38bdf8', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>1. Distancia vs Tiempo (x vs t)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Parábola cuadrática. Recta tangente = v(t)
              </div>
            </div>
          </button>

          <button
            className={`pill-btn ${graphType === 'v_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem' }}
            onClick={() => onSelectGraphType('v_vs_t')}
          >
            <Activity size={16} style={{ marginRight: '8px', color: '#10b981', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>2. Rapidez vs Tiempo (v vs t)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Recta lineal con pendiente m = a. Área bajo la recta = Δx
              </div>
            </div>
          </button>

          <button
            className={`pill-btn ${graphType === 'a_vs_t' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem' }}
            onClick={() => onSelectGraphType('a_vs_t')}
          >
            <Gauge size={16} style={{ marginRight: '8px', color: '#f59e0b', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>3. Aceleración vs Tiempo (a vs t)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Recta horizontal en a = cte. Área bajo la recta = Δv
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Ecuaciones Horarias KaTeX */}
      <div className="expression-card" style={{ borderLeft: '3px solid #ec4899' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Ecuaciones Horarias del MRUA</span>
          <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', fontSize: '0.7rem' }}>
            a = {formatNum(params.a)} m/s²
          </span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
            <Latex math={xFormulaLatex} block={false} />
          </div>
          <div style={{ fontSize: '0.88rem', color: '#10b981' }}>
            <Latex math={vFormulaLatex} block={false} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            x({formatNum(currentTime, 2)}s) = <strong style={{ color: '#38bdf8' }}>{formatNum(currentX, 2)}m</strong> | v({formatNum(currentTime, 2)}s) = <strong style={{ color: '#10b981' }}>{formatNum(currentV, 2)}m/s</strong>
          </div>
        </div>
      </div>

      {/* 3. Parámetro 1: Posición Inicial (x0) */}
      <div className="expression-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Posición Inicial (x₀)</span>
          <button
            className="btn-card-action"
            title="Reiniciar a 0"
            onClick={() => updateParam('x0', 0)}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="input-box" style={{ marginBottom: '8px' }}>
          <input
            type="number"
            step="1"
            value={params.x0}
            onChange={(e) => updateParam('x0', parseFloat(e.target.value))}
            placeholder="0"
          />
          <span className="input-unit">m</span>
        </div>

        <input
          type="range"
          min="-50"
          max="50"
          step="1"
          value={params.x0}
          onChange={(e) => updateParam('x0', parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>-50 m</span>
          <span>0 m</span>
          <span>+50 m</span>
        </div>
      </div>

      {/* 4. Parámetro 2: Velocidad Inicial (v0) */}
      <div className="expression-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Velocidad Inicial (v₀)</span>
          <button
            className="btn-card-action"
            title="Reiniciar a 0"
            onClick={() => updateParam('v0', 0)}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="input-box" style={{ marginBottom: '8px' }}>
          <input
            type="number"
            step="0.5"
            value={params.v0}
            onChange={(e) => updateParam('v0', parseFloat(e.target.value))}
            placeholder="0"
          />
          <span className="input-unit">m/s</span>
        </div>

        <input
          type="range"
          min="-40"
          max="40"
          step="0.5"
          value={params.v0}
          onChange={(e) => updateParam('v0', parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>-40 m/s</span>
          <span>0 m/s</span>
          <span>+40 m/s</span>
        </div>
      </div>

      {/* 5. Parámetro 3: Aceleración Constante (a) */}
      <div className="expression-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Aceleración Constante (a)</span>
          <button
            className="btn-card-action"
            title="Reiniciar a 2 m/s²"
            onClick={() => updateParam('a', 2)}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="input-box" style={{ marginBottom: '8px' }}>
          <input
            type="number"
            step="0.2"
            value={params.a}
            onChange={(e) => updateParam('a', parseFloat(e.target.value))}
            placeholder="2"
          />
          <span className="input-unit">m/s²</span>
        </div>

        <input
          type="range"
          min="-20"
          max="20"
          step="0.2"
          value={params.a}
          onChange={(e) => updateParam('a', parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>-20 m/s²</span>
          <span>0 m/s²</span>
          <span>+20 m/s²</span>
        </div>
      </div>

      {/* 6. Módulo Especial: Análisis de Frenado y Parada */}
      {isBraking && tStop !== null && dBraking !== null && (
        <div className="expression-card" style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ShieldAlert size={16} style={{ color: '#f59e0b' }} />
            <span className="input-label" style={{ color: '#f59e0b' }}>Cinemática de Frenado</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Tiempo de Parada (v=0)</span>
              <strong style={{ color: '#f59e0b', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                {formatNum(tStop, 2)} s
              </strong>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Distancia de Frenado</span>
              <strong style={{ color: '#f59e0b', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                {formatNum(dBraking, 2)} m
              </strong>
            </div>
          </div>

          {onSeekTime && (
            <button
              className="pill-btn"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '6px' }}
              onClick={() => onSeekTime(tStop)}
            >
              <Zap size={13} style={{ marginRight: '4px', color: '#f59e0b' }} />
              Ir al instante de parada (t = {formatNum(tStop, 2)} s)
            </button>
          )}
        </div>
      )}

      {/* 7. Solucionador de Distancia Objetivo */}
      <div className="expression-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Target size={15} style={{ color: '#ec4899' }} />
          <span className="input-label">Calculadora de Distancia Objetivo</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <div className="input-box" style={{ flex: 1 }}>
            <input
              type="number"
              step="5"
              value={targetDistance}
              onChange={(e) => setTargetDistance(parseFloat(e.target.value) || 0)}
              placeholder="60"
            />
            <span className="input-unit">m</span>
          </div>

          {tToTarget !== null && onSeekTime && (
            <button
              className="pill-btn"
              style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'var(--accent-glow)' }}
              onClick={() => onSeekTime(tToTarget)}
              title="Saltar la simulación a este tiempo"
            >
              <Zap size={13} style={{ marginRight: '4px' }} />
              Ver t
            </button>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
          {tToTarget !== null ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tiempo para alcanzar {targetDistance} m:</span>
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                t = {formatNum(tToTarget, 2)} s
              </strong>
            </div>
          ) : (
            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
              La trayectoria actual no alcanza la posición {targetDistance} m.
            </span>
          )}
        </div>
      </div>

      {/* 8. Telemetría y Ecuación de Torricelli */}
      <div className="expression-card" style={{ borderLeft: '3px solid #38bdf8' }}>
        <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
          Telemetría Instantánea (t = {formatNum(currentTime, 2)} s)
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Posición x(t)</span>
            <strong style={{ color: '#38bdf8', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              {formatNum(currentX, 2)} m
            </strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Rapidez |v|</span>
            <strong style={{ color: '#10b981', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              {formatNum(currentSpeed, 2)} m/s
            </strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Desplazamiento Δx</span>
            <strong style={{ color: '#ec4899', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              {formatNum(deltaX, 2)} m
            </strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Aceleración a</span>
            <strong style={{ color: '#f59e0b', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              {formatNum(params.a, 2)} m/s²
            </strong>
          </div>
        </div>

        {/* Torricelli */}
        <div style={{ marginTop: '8px', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Torricelli (v² = v₀² + 2aΔx):</span>
          <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {formatNum(Math.max(0, torricelliV2), 1)} m²/s²
          </strong>
        </div>
      </div>
    </div>
  );
};

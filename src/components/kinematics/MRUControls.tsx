import React, { useState } from 'react';
import { TrendingUp, Activity, RotateCcw, Target, Zap, Plus, Trash2, Eye, EyeOff, Users } from 'lucide-react';
import type { MRUParams, MRUItem, MotionGraphType } from '../../types/kinematics';
import { formatNum } from '../../math/vectorMath';
import { Latex } from '../Latex';

interface MRUControlsProps {
  params: MRUParams;
  onChangeParams: (newParams: MRUParams) => void;
  graphType: MotionGraphType;
  onSelectGraphType: (type: MotionGraphType) => void;
  currentTime: number;
  onSeekTime?: (t: number) => void;
  // Soporte Multi-MRU
  mruItems?: MRUItem[];
  activeMruId?: string;
  onSelectMru?: (id: string) => void;
  onAddMru?: () => void;
  onDeleteMru?: (id: string) => void;
  onToggleMruVisibility?: (id: string) => void;
}

export const MRUControls: React.FC<MRUControlsProps> = ({
  params,
  onChangeParams,
  graphType,
  onSelectGraphType,
  currentTime,
  onSeekTime,
  mruItems = [],
  activeMruId,
  onSelectMru,
  onAddMru,
  onDeleteMru,
  onToggleMruVisibility
}) => {
  const [targetDistance, setTargetDistance] = useState<number>(50);

  const currentX = params.x0 + params.v * currentTime;
  const deltaX = currentX - params.x0;
  const speed = Math.abs(params.v);

  // Ecuación canónica viva en LaTeX
  const signV = params.v >= 0 ? '+' : '-';
  const absV = Math.abs(params.v);
  const formulaLatex = `x(t) = ${formatNum(params.x0)} ${signV} ${formatNum(absV)} \\cdot t`;
  const evaluatedLatex = `x(${formatNum(currentTime, 2)}\\text{s}) = ${formatNum(currentX, 2)}\\text{ m}`;

  // Cálculo de punto de encuentro si hay 2 móviles activos
  const visibleMru = mruItems.filter(m => m.visible);
  let meetingInfo: { t: number; x: number } | null = null;
  if (visibleMru.length >= 2) {
    const m1 = visibleMru[0].params;
    const m2 = visibleMru[1].params;
    const dv = m1.v - m2.v;
    if (Math.abs(dv) > 1e-4) {
      const tMeet = (m2.x0 - m1.x0) / dv;
      if (tMeet > 0) {
        const xMeet = m1.x0 + m1.v * tMeet;
        meetingInfo = { t: tMeet, x: xMeet };
      }
    }
  }

  // Cálculo del tiempo objetivo
  let timeToTarget: number | null = null;
  if (Math.abs(params.v) > 1e-4) {
    const tNeeded = (targetDistance - params.x0) / params.v;
    if (tNeeded >= 0) {
      timeToTarget = tNeeded;
    }
  }

  const updateParam = (field: keyof MRUParams, val: number) => {
    onChangeParams({
      ...params,
      [field]: isNaN(val) ? 0 : val
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 0. Gestor de Múltiples Móviles MRU */}
      {mruItems.length > 0 && (
        <div className="expression-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span className="input-label" style={{ fontWeight: 700 }}>Móviles MRU en Pista</span>
            <button
              className="pill-btn active"
              onClick={onAddMru}
              style={{ fontSize: '0.75rem', padding: '5px 10px', gap: '4px' }}
              title="Añadir nuevo móvil para problemas de persecución o encuentro"
            >
              <Plus size={14} />
              <span>Agregar Móvil</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mruItems.map(m => {
              const isSelected = m.id === activeMruId;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMru?.(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? `2px solid ${m.color}` : '1px solid var(--border-subtle)',
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
                        backgroundColor: m.color,
                        boxShadow: `0 0 6px ${m.color}`
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (x₀ = {m.params.x0}m, v = {m.params.v}m/s)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-card-action"
                      onClick={() => onToggleMruVisibility?.(m.id)}
                      title={m.visible ? 'Ocultar móvil' : 'Mostrar móvil'}
                      style={{ color: m.visible ? m.color : 'var(--text-muted)' }}
                    >
                      {m.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {mruItems.length > 1 && (
                      <button
                        className="btn-card-action"
                        onClick={() => onDeleteMru?.(m.id)}
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

          {/* Tarjeta de Punto de Encuentro si hay 2 móviles en curso de colisión */}
          {meetingInfo && (
            <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '2px' }}>
                <Users size={14} />
                <span>Intersección de Trayectorias (Punto de Encuentro)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                Se cruzan en <strong>t = {formatNum(meetingInfo.t, 2)} s</strong> en la posición <strong>x = {formatNum(meetingInfo.x, 1)} m</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Selector de los 2 Métodos de Graficación Requeridos */}
      <div className="expression-card">
        <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
          Método de Graficación (MRU)
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
                Recta lineal con pendiente constante m = v
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
                Recta horizontal en v. Área sombreada = Desplazamiento (Δx)
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Ecuación Cinemática Interactiva en KaTeX */}
      <div className="expression-card" style={{ borderLeft: '3px solid #38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Ecuación Horaria del Movimiento</span>
          <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.7rem' }}>
            MRU
          </span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            <Latex math={formulaLatex} block={false} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            <Latex math={evaluatedLatex} block={false} />
          </div>
        </div>
      </div>

      {/* 3. Parámetro 1: Posición Inicial (x0) con Input Dual */}
      <div className="expression-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Posición Inicial (x₀)</span>
          <button
            className="btn-card-action"
            title="Reiniciar x₀ a 0"
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

      {/* 4. Parámetro 2: Velocidad / Rapidez Constante (v) con Input Dual */}
      <div className="expression-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="input-label">Velocidad Constante (v)</span>
          <button
            className="btn-card-action"
            title="Reiniciar v a 10 m/s"
            onClick={() => updateParam('v', 10)}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="input-box" style={{ marginBottom: '8px' }}>
          <input
            type="number"
            step="0.5"
            value={params.v}
            onChange={(e) => updateParam('v', parseFloat(e.target.value))}
            placeholder="10"
          />
          <span className="input-unit">m/s</span>
        </div>

        <input
          type="range"
          min="-40"
          max="40"
          step="0.5"
          value={params.v}
          onChange={(e) => updateParam('v', parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>-40 m/s</span>
          <span>0 m/s</span>
          <span>+40 m/s</span>
        </div>
      </div>

      {/* 5. Solucionador / Calculadora de Objetivos */}
      <div className="expression-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Target size={15} style={{ color: '#f59e0b' }} />
          <span className="input-label">Calculadora de Arribo a Objetivo</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <div className="input-box" style={{ flex: 1 }}>
            <input
              type="number"
              step="5"
              value={targetDistance}
              onChange={(e) => setTargetDistance(parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
            <span className="input-unit">m</span>
          </div>

          {timeToTarget !== null && onSeekTime && (
            <button
              className="pill-btn"
              style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'var(--accent-glow)' }}
              onClick={() => onSeekTime(timeToTarget)}
              title="Saltar la animación a este tiempo"
            >
              <Zap size={13} style={{ marginRight: '4px' }} />
              Ver t
            </button>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
          {timeToTarget !== null ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tiempo para alcanzar {targetDistance} m:</span>
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                t = {formatNum(timeToTarget, 2)} s
              </strong>
            </div>
          ) : (
            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
              {params.v === 0 ? 'Velocidad cero: El móvil no se desplazará.' : 'El móvil se desplaza en dirección opuesta al objetivo.'}
            </span>
          )}
        </div>
      </div>

      {/* 6. Telemetría Instantánea Detallada */}
      <div className="expression-card" style={{ borderLeft: '3px solid #10b981' }}>
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
              {formatNum(speed, 2)} m/s
            </strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Desplazamiento Δx</span>
            <strong style={{ color: '#f59e0b', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              {formatNum(deltaX, 2)} m
            </strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Aceleración a</span>
            <strong style={{ color: '#64748b', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
              0.00 m/s²
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

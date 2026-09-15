import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, Sliders, Hash } from 'lucide-react';
import type { Vector2D } from '../../types/vectors';
import { cartesianToPolar, polarToCartesian, formatNum } from '../../math/vectorMath';

const COLOR_PALETTE = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4'  // Cyan
];

interface VectorInputCardProps {
  vector: Vector2D;
  onUpdate: (updated: Vector2D) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export const VectorInputCard: React.FC<VectorInputCardProps> = ({
  vector,
  onUpdate,
  onDelete,
  canDelete
}) => {
  const [inputMode, setInputMode] = useState<'cartesian' | 'polar'>('cartesian');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Valores polares calculados con resguardo para vector nulo
  const polar = cartesianToPolar(vector.x, vector.y);
  const currentR = polar.r;
  const currentTheta = currentR === 0 && vector.polarAngle !== undefined ? vector.polarAngle : polar.thetaDeg;

  // Estados locales de texto para permitir escribir negativos, puntos y borrado sin NaN
  const [textX, setTextX] = useState(formatNum(vector.x));
  const [textY, setTextY] = useState(formatNum(vector.y));
  const [textR, setTextR] = useState(formatNum(currentR));
  const [textTheta, setTextTheta] = useState(formatNum(currentTheta));

  // Sincronizar estados locales cuando cambian las props externas (ej. arrastre en canvas)
  useEffect(() => {
    setTextX(formatNum(vector.x));
    setTextY(formatNum(vector.y));
    setTextR(formatNum(currentR));
    setTextTheta(formatNum(currentTheta));
  }, [vector.x, vector.y, currentR, currentTheta]);

  const handleCartesianChange = (field: 'x' | 'y', rawStr: string) => {
    if (field === 'x') setTextX(rawStr);
    else setTextY(rawStr);

    const parsed = parseFloat(rawStr);
    const safeVal = isNaN(parsed) ? 0 : parsed;

    onUpdate({
      ...vector,
      [field]: safeVal
    });
  };

  const handlePolarChange = (field: 'r' | 'theta', rawStr: string) => {
    if (field === 'r') setTextR(rawStr);
    else setTextTheta(rawStr);

    const parsed = parseFloat(rawStr);
    const safeR = field === 'r' ? (isNaN(parsed) ? 0 : Math.max(0, parsed)) : currentR;
    const safeTheta = field === 'theta' ? (isNaN(parsed) ? 0 : parsed) : currentTheta;

    const { x, y } = polarToCartesian(safeR, safeTheta);

    onUpdate({
      ...vector,
      x,
      y,
      polarAngle: safeTheta
    });
  };

  return (
    <div className={`expression-card ${vector.visible ? 'active' : ''}`}>
      <div className="card-top">
        <div className="card-title-group">
          <div
            className="color-indicator"
            style={{ backgroundColor: vector.color, borderColor: vector.color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Cambiar color del vector"
          />
          <span className="vector-name">{vector.name}</span>
          
          <button
            className="btn-card-action"
            onClick={() => setInputMode(inputMode === 'cartesian' ? 'polar' : 'cartesian')}
            title={`Modo: ${inputMode === 'cartesian' ? 'Cartesiano (x, y)' : 'Polar (r, θ)'}`}
            style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', border: '1px solid var(--border-subtle)' }}
          >
            {inputMode === 'cartesian' ? '(x, y)' : '(r, θ)'}
          </button>
        </div>

        <div className="card-actions">
          <button
            className="btn-card-action"
            onClick={() => onUpdate({ ...vector, showComponents: !vector.showComponents })}
            style={{ color: vector.showComponents ? 'var(--accent-primary)' : 'var(--text-dim)' }}
            title="Proyectar componentes ortogonales"
          >
            <Sliders size={15} />
          </button>

          <button
            className="btn-card-action"
            onClick={() => onUpdate({ ...vector, showAngle: !vector.showAngle })}
            style={{ color: vector.showAngle ? 'var(--accent-primary)' : 'var(--text-dim)' }}
            title="Mostrar arco angular"
          >
            <Hash size={15} />
          </button>

          <button
            className="btn-card-action"
            onClick={() => onUpdate({ ...vector, visible: !vector.visible })}
            title={vector.visible ? 'Ocultar vector' : 'Mostrar vector'}
          >
            {vector.visible ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>

          {canDelete && (
            <button
              className="btn-card-action"
              onClick={() => onDelete(vector.id)}
              title="Eliminar vector"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {showColorPicker && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '6px', background: 'var(--bg-input)', borderRadius: '6px' }}>
          {COLOR_PALETTE.map((c) => (
            <div
              key={c}
              onClick={() => {
                onUpdate({ ...vector, color: c });
                setShowColorPicker(false);
              }}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: c,
                cursor: 'pointer',
                transform: vector.color === c ? 'scale(1.25)' : 'scale(1)',
                boxShadow: vector.color === c ? '0 0 6px white' : 'none'
              }}
            />
          ))}
        </div>
      )}

      {inputMode === 'cartesian' ? (
        <>
          <div className="input-row">
            <div className="input-field">
              <span className="input-label">Componente X</span>
              <div className="input-box">
                <input
                  type="text"
                  inputMode="decimal"
                  value={textX}
                  onChange={(e) => handleCartesianChange('x', e.target.value)}
                />
              </div>
            </div>

            <div className="input-field">
              <span className="input-label">Componente Y</span>
              <div className="input-box">
                <input
                  type="text"
                  inputMode="decimal"
                  value={textY}
                  onChange={(e) => handleCartesianChange('y', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="slider-container" style={{ marginTop: '10px' }}>
            <div className="slider-header">
              <span className="slider-name">Deslizador X</span>
              <span className="slider-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatNum(vector.x)}</span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="0.5"
              value={isNaN(vector.x) ? 0 : vector.x}
              onChange={(e) => handleCartesianChange('x', e.target.value)}
            />
          </div>

          <div className="slider-container" style={{ marginTop: '8px' }}>
            <div className="slider-header">
              <span className="slider-name">Deslizador Y</span>
              <span className="slider-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatNum(vector.y)}</span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="0.5"
              value={isNaN(vector.y) ? 0 : vector.y}
              onChange={(e) => handleCartesianChange('y', e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="input-row">
            <div className="input-field">
              <span className="input-label">Magnitud (|r|)</span>
              <div className="input-box">
                <input
                  type="text"
                  inputMode="decimal"
                  value={textR}
                  onChange={(e) => handlePolarChange('r', e.target.value)}
                />
              </div>
            </div>

            <div className="input-field">
              <span className="input-label">Ángulo (θ°)</span>
              <div className="input-box">
                <input
                  type="text"
                  inputMode="decimal"
                  value={textTheta}
                  onChange={(e) => handlePolarChange('theta', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="slider-container" style={{ marginTop: '10px' }}>
            <div className="slider-header">
              <span className="slider-name">Deslizador Magnitud (|r|)</span>
              <span className="slider-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatNum(currentR)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={isNaN(currentR) ? 0 : currentR}
              onChange={(e) => handlePolarChange('r', e.target.value)}
            />
          </div>

          <div className="slider-container" style={{ marginTop: '8px' }}>
            <div className="slider-header">
              <span className="slider-name">Deslizador Ángulo (θ)</span>
              <span className="slider-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatNum(currentTheta)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={isNaN(currentTheta) ? 0 : currentTheta}
              onChange={(e) => handlePolarChange('theta', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};

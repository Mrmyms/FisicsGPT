import React from 'react';
import { Plus, Minus, Split } from 'lucide-react';
import type { VectorOperation } from '../../types/vectors';

interface VectorOperationsProps {
  operation: VectorOperation;
  onSelectOperation: (op: VectorOperation) => void;
}

export const VectorOperations: React.FC<VectorOperationsProps> = ({
  operation,
  onSelectOperation
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <span className="input-label" style={{ display: 'block', marginBottom: '8px' }}>
          Operación Vectorial
        </span>
        <div className="pill-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button
            className={`pill-btn ${operation === 'none' ? 'active' : ''}`}
            onClick={() => onSelectOperation('none')}
          >
            <Split size={14} />
            <span>Individual</span>
          </button>

          <button
            className={`pill-btn ${operation === 'sum' ? 'active' : ''}`}
            onClick={() => onSelectOperation('sum')}
          >
            <Plus size={14} />
            <span>Suma (A + B)</span>
          </button>

          <button
            className={`pill-btn ${operation === 'subtract' ? 'active' : ''}`}
            onClick={() => onSelectOperation('subtract')}
          >
            <Minus size={14} />
            <span>Resta (A - B)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

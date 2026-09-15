import React from 'react';
import { BookOpen } from 'lucide-react';
import type { MathStep } from '../../types/vectors';
import { Latex } from '../Latex';

interface KinematicsStepsProps {
  steps: MathStep[];
}

export const KinematicsSteps: React.FC<KinematicsStepsProps> = ({ steps }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <BookOpen size={18} color="var(--accent-primary)" />
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Deducción y Ecuaciones Físicas
        </h3>
      </div>

      {steps.map((step, idx) => (
        <div key={idx} className="math-step-card">
          <div className="math-step-title">
            <span>{step.title}</span>
          </div>

          <div className="math-step-formula-box">
            <Latex math={step.latexFormula} block />
          </div>

          <p className="math-step-explanation">{step.explanation}</p>

          {step.numericSub && (
            <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Evaluación Numérica:</span>
              <div style={{ overflowX: 'auto', textAlign: 'center' }}>
                <Latex math={step.numericSub} block />
              </div>
            </div>
          )}

          {step.resultLatex && (
            <div className="math-step-result-box">
              <Latex math={step.resultLatex} block />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

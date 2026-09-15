export interface Vector2D {
  id: string;
  name: string;
  color: string;
  x: number; // Componente x
  y: number; // Componente y
  originX: number; // Posición de inicio en x (por defecto 0)
  originY: number; // Posición de inicio en y (por defecto 0)
  visible: boolean;
  isResultant?: boolean;
  showComponents?: boolean;
  showAngle?: boolean;
  polarAngle?: number;
}

export type VectorOperation = 'none' | 'sum' | 'subtract';

export type SumVisualMethod = 'parallelogram' | 'polygon' | 'components';

export type CoordinateMode = 'cartesian' | 'polar';

export interface MathStep {
  title: string;
  latexFormula: string;
  explanation: string;
  numericSub?: string;
  resultLatex?: string;
}

export interface VectorCalculationResult {
  operation: VectorOperation;
  title: string;
  resultVector?: { x: number; y: number; magnitude: number; angleDeg: number };
  scalarResult?: number;
  steps: MathStep[];
}

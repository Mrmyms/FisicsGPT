export type KinematicsMode = 'projectile' | 'mru' | 'mrua';
export type MotionGraphType = 'trajectory_2d' | 'x_vs_t' | 'v_vs_t' | 'a_vs_t';

export interface ProjectileParams {
  x0: number;       // Posición inicial en X (m)
  y0: number;       // Altura inicial en Y (m)
  v0: number;       // Velocidad inicial (m/s)
  angleDeg: number; // Ángulo con la horizontal (grados)
  g: number;        // Aceleración gravitacional (m/s²)
}

export interface ProjectileItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  params: ProjectileParams;
}

export interface MRUParams {
  x0: number;       // Posición inicial (m)
  v: number;        // Velocidad constante (m/s)
}

export interface MRUItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  params: MRUParams;
}

export interface MRUAParams {
  x0: number;       // Posición inicial (m)
  v0: number;       // Velocidad inicial (m/s)
  a: number;        // Aceleración constante (m/s²)
}

export interface MRUAItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  params: MRUAParams;
}

export const KINEMATICS_PALETTE = [
  '#38bdf8', // Cian cielo
  '#ec4899', // Rosa neón
  '#10b981', // Verde esmeralda
  '#f59e0b', // Ámbar cálido
  '#a855f7', // Violeta eléctrico
  '#06b6d4', // Turquesa
  '#ef4444', // Rojo coral
  '#eab308'  // Amarillo oro
];

export interface CriticalPoints {
  tSubida: number;      // Tiempo hasta altura máxima (s)
  hMax: number;         // Altura máxima total (m)
  tVuelo: number;       // Tiempo total de vuelo (s)
  alcanceMax: number;   // Alcance horizontal total (m)
  vImpacto: number;     // Rapidez de impacto (m/s)
  anguloImpactoDeg: number; // Ángulo al impactar el suelo (grados)
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  v: number;
  angleDeg: number;
}

export interface SimulationState {
  isPlaying: boolean;
  currentTime: number;
  maxTime: number;
  playbackSpeed: number;
}

export interface MotionTelemetry {
  t: number;
  x: number;
  v: number;
  a: number;
  deltaX: number;
}

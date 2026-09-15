import type { ProjectileParams, CriticalPoints, TrajectoryPoint, MRUParams, MRUAParams, MotionGraphType, MotionTelemetry } from '../types/kinematics';
import type { MathStep } from '../types/vectors';
import { formatNum } from './vectorMath';

export const PLANET_PRESETS = [
  { name: 'Tierra', g: 9.81, icon: '🌍' },
  { name: 'Luna', g: 1.62, icon: '🌑' },
  { name: 'Marte', g: 3.71, icon: '🔴' },
  { name: 'Júpiter', g: 24.79, icon: '🪐' },
  { name: 'Venus', g: 8.87, icon: '🟡' },
  { name: 'Gravedad Cero', g: 0.001, icon: '🌌' }
];

export function calculateProjectileCriticalPoints(p: ProjectileParams): CriticalPoints {
  const rad = (p.angleDeg * Math.PI) / 180;
  const v0x = p.v0 * Math.cos(rad);
  const v0y = p.v0 * Math.sin(rad);
  const g = Math.max(0.0001, p.g);

  // Tiempo hasta el vértice (altura máxima)
  const tSubida = v0y > 0 ? v0y / g : 0;

  // Altura máxima total
  const hMax = v0y > 0 ? p.y0 + (v0y * v0y) / (2 * g) : p.y0;

  // Tiempo total de vuelo: y(t) = y0 + v0y*t - 0.5*g*t^2 = 0
  // -0.5*g*t^2 + v0y*t + y0 = 0
  // Discriminante: D = v0y^2 - 4*(-0.5*g)*(y0) = v0y^2 + 2*g*y0
  const disc = v0y * v0y + 2 * g * p.y0;
  const tVuelo = disc >= 0 ? (v0y + Math.sqrt(disc)) / g : 0;

  // Alcance horizontal total
  const alcanceMax = p.x0 + v0x * tVuelo;

  // Velocidad al impactar el suelo y = 0
  const vyImpacto = v0y - g * tVuelo;
  const vImpacto = Math.sqrt(v0x * v0x + vyImpacto * vyImpacto);
  let anguloImpactoDeg = (Math.atan2(vyImpacto, v0x) * 180) / Math.PI;

  return {
    tSubida,
    hMax,
    tVuelo,
    alcanceMax,
    vImpacto,
    anguloImpactoDeg
  };
}

export function getProjectilePointAtTime(p: ProjectileParams, t: number): TrajectoryPoint {
  const rad = (p.angleDeg * Math.PI) / 180;
  const v0x = p.v0 * Math.cos(rad);
  const v0y = p.v0 * Math.sin(rad);
  const g = p.g;

  const x = p.x0 + v0x * t;
  const y = Math.max(0, p.y0 + v0y * t - 0.5 * g * t * t);
  const vx = v0x;
  const vy = v0y - g * t;
  const v = Math.sqrt(vx * vx + vy * vy);
  const angleDeg = (Math.atan2(vy, vx) * 180) / Math.PI;

  return {
    t,
    x,
    y,
    vx,
    vy,
    v,
    angleDeg
  };
}

export function generateProjectileTrajectoryPoints(
  p: ProjectileParams,
  samples: number = 100
): TrajectoryPoint[] {
  const { tVuelo } = calculateProjectileCriticalPoints(p);
  const totalT = Math.max(0.1, tVuelo);
  const points: TrajectoryPoint[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * totalT;
    points.push(getProjectilePointAtTime(p, t));
  }

  return points;
}

export function generateProjectileSteps(p: ProjectileParams, currentT: number): MathStep[] {
  const rad = (p.angleDeg * Math.PI) / 180;
  const v0x = p.v0 * Math.cos(rad);
  const v0y = p.v0 * Math.sin(rad);
  const cp = calculateProjectileCriticalPoints(p);
  const curr = getProjectilePointAtTime(p, currentT);

  const steps: MathStep[] = [
    {
      title: '1. Descomposición de la Velocidad Inicial',
      latexFormula: `v_{0x} = v_0 \\cos(\\theta), \\quad v_{0y} = v_0 \\sin(\\theta)`,
      explanation: 'El movimiento parabólico es bidimensional e independiente: velocidad constante en X y aceleración uniforme por gravedad en Y.',
      numericSub: `v_{0x} = (${formatNum(p.v0)}) \\cos(${formatNum(p.angleDeg)}^\\circ) = ${formatNum(v0x)}\\text{ m/s}, \\quad v_{0y} = (${formatNum(p.v0)}) \\sin(${formatNum(p.angleDeg)}^\\circ) = ${formatNum(v0y)}\\text{ m/s}`,
      resultLatex: `\\vec{v}_0 = (${formatNum(v0x)}\\hat{i} + ${formatNum(v0y)}\\hat{j})\\text{ m/s}`
    },
    {
      title: '2. Ecuaciones Horarias del Movimiento',
      latexFormula: `x(t) = x_0 + v_{0x}t, \\quad y(t) = y_0 + v_{0y}t - \\frac{1}{2}gt^2`,
      explanation: 'Posición espacial en cualquier instante de tiempo t.',
      numericSub: `x(t) = ${formatNum(p.x0)} + ${formatNum(v0x)}t, \\quad y(t) = ${formatNum(p.y0)} + ${formatNum(v0y)}t - \\frac{1}{2}(${formatNum(p.g)})t^2`
    },
    {
      title: '3. Tiempo hasta la Altura Máxima (Vértice)',
      latexFormula: `v_y(t_s) = 0 \\implies t_s = \\frac{v_{0y}}{g}`,
      explanation: 'En el punto más alto de la trayectoria, la velocidad vertical se anula instantáneamente.',
      numericSub: `t_s = \\frac{${formatNum(v0y)}}{${formatNum(p.g)}}`,
      resultLatex: `t_s = ${formatNum(cp.tSubida)}\\text{ s}`
    },
    {
      title: '4. Altura Máxima Alcanzada (H_max)',
      latexFormula: `H_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g}`,
      explanation: 'Sustituyendo el tiempo de subida en la ecuación de posición vertical y(t_s).',
      numericSub: `H_{\\text{max}} = ${formatNum(p.y0)} + \\frac{(${formatNum(v0y)})^2}{2(${formatNum(p.g)})}`,
      resultLatex: `H_{\\text{max}} = ${formatNum(cp.hMax)}\\text{ m}`
    },
    {
      title: '5. Tiempo Total de Vuelo (t_v)',
      latexFormula: `y(t_v) = 0 \\implies y_0 + v_{0y}t_v - \\frac{1}{2}gt_v^2 = 0`,
      explanation: 'Resolviendo la ecuación cuadrática para la llegada del proyectil al nivel del suelo y=0.',
      numericSub: `t_v = \\frac{${formatNum(v0y)} + \\sqrt{(${formatNum(v0y)})^2 + 2(${formatNum(p.g)})(${formatNum(p.y0)})}}{${formatNum(p.g)}}`,
      resultLatex: `t_v = ${formatNum(cp.tVuelo)}\\text{ s}`
    },
    {
      title: '6. Alcance Horizontal Total (R)',
      latexFormula: `R = x(t_v) = x_0 + v_{0x} \\cdot t_v`,
      explanation: 'Distancia total recorrida horizontalmente antes del impacto con el suelo.',
      numericSub: `R = ${formatNum(p.x0)} + (${formatNum(v0x)}) \\cdot (${formatNum(cp.tVuelo)})`,
      resultLatex: `R = ${formatNum(cp.alcanceMax)}\\text{ m}`
    },
    {
      title: `7. Estado Cinemático Instantáneo en t = ${formatNum(currentT)} s`,
      latexFormula: `\\vec{r}(t) = (x(t), y(t)), \\quad \\vec{v}(t) = (v_x(t), v_y(t))`,
      explanation: 'Valores exactos calculados para el instante seleccionado en la línea de tiempo.',
      numericSub: `x = ${formatNum(curr.x)}\\text{ m}, \\quad y = ${formatNum(curr.y)}\\text{ m}, \\quad v_x = ${formatNum(curr.vx)}\\text{ m/s}, \\quad v_y = ${formatNum(curr.vy)}\\text{ m/s}`,
      resultLatex: `|\\vec{v}| = ${formatNum(curr.v)}\\text{ m/s}, \\quad \\theta_v = ${formatNum(curr.angleDeg)}^\\circ`
    }
  ];

  return steps;
}

// Telemetría para MRU (a = 0)
export function getMRUTelemetry(p: MRUParams, t: number): MotionTelemetry {
  const x = p.x0 + p.v * t;
  return {
    t,
    x,
    v: p.v,
    a: 0,
    deltaX: x - p.x0
  };
}

// Telemetría para MRUA (a = cte)
export function getMRUATelemetry(p: MRUAParams, t: number): MotionTelemetry {
  const x = p.x0 + p.v0 * t + 0.5 * p.a * t * t;
  const v = p.v0 + p.a * t;
  return {
    t,
    x,
    v,
    a: p.a,
    deltaX: x - p.x0
  };
}

// Pasos detallados para MRU según el método de graficación seleccionado
export function generateMRUSteps(
  p: MRUParams,
  currentT: number,
  graphType: MotionGraphType = 'x_vs_t'
): MathStep[] {
  const currentX = p.x0 + p.v * currentT;
  const deltaX = currentX - p.x0;

  if (graphType === 'v_vs_t') {
    return [
      {
        title: '1. Gráfica de Rapidez / Velocidad vs Tiempo en MRU',
        latexFormula: `v(t) = v = ${formatNum(p.v)}\\text{ m/s (constante)}`,
        explanation: 'En el MRU la velocidad es constante en todo instante. La gráfica en el plano (t, v) es una recta horizontal a altura v.'
      },
      {
        title: '2. Teorema del Área: Desplazamiento (Δx)',
        latexFormula: `\\text{Área} = \\text{base} \\times \\text{altura} = t \\cdot v = \\Delta x`,
        explanation: 'El área del rectángulo delimitado entre el eje temporal t = 0 y t = t_actual bajo la recta v representa exactamente el desplazamiento recorrido.'
      },
      {
        title: `3. Desplazamiento en t = ${formatNum(currentT)} s`,
        latexFormula: `\\Delta x = (${formatNum(p.v)}\\text{ m/s}) \\times (${formatNum(currentT)}\\text{ s}) = ${formatNum(deltaX)}\\text{ m}`,
        explanation: 'Posición final sumando la posición inicial x₀:',
        resultLatex: `x(t) = x_0 + \\Delta x = ${formatNum(p.x0)} + ${formatNum(deltaX)} = ${formatNum(currentX)}\\text{ m}`
      }
    ];
  }

  // Por defecto: x_vs_t (Distancia vs Tiempo)
  return [
    {
      title: '1. Ecuación Horaria de la Posición en MRU',
      latexFormula: `x(t) = x_0 + v \\cdot t`,
      explanation: 'En el MRU la distancia varía linealmente con respecto al tiempo. La función matemática es una recta afín y = mx + b.'
    },
    {
      title: '2. Pendiente y Ordenada al Origen',
      latexFormula: `m = \\frac{\\Delta x}{\\Delta t} = v = ${formatNum(p.v)}\\text{ m/s}, \\quad b = x_0 = ${formatNum(p.x0)}\\text{ m}`,
      explanation: 'La pendiente de la recta en la gráfica x vs t representa la velocidad constante del móvil.'
    },
    {
      title: `3. Evaluación en t = ${formatNum(currentT)} s`,
      latexFormula: `x(${formatNum(currentT)}) = (${formatNum(p.x0)}) + (${formatNum(p.v)}) \\cdot (${formatNum(currentT)})`,
      explanation: 'Posición física exacta alcanzada en el instante actual de la simulación.',
      resultLatex: `x(${formatNum(currentT)}\\text{ s}) = ${formatNum(currentX)}\\text{ m}`
    },
    {
      title: '4. Desplazamiento Total Recorrido',
      latexFormula: `\\Delta x = x(t) - x_0 = v \\cdot t`,
      explanation: 'Diferencia entre la posición final y la posición inicial.',
      numericSub: `\\Delta x = (${formatNum(p.v)}) \\cdot (${formatNum(currentT)})`,
      resultLatex: `\\Delta x = ${formatNum(deltaX)}\\text{ m}`
    }
  ];
}

// Pasos detallados para MRUA según el método de graficación seleccionado
export function generateMRUASteps(
  p: MRUAParams,
  currentT: number,
  graphType: MotionGraphType = 'x_vs_t'
): MathStep[] {
  const currentX = p.x0 + p.v0 * currentT + 0.5 * p.a * currentT * currentT;
  const currentV = p.v0 + p.a * currentT;
  const deltaX = currentX - p.x0;
  const torricelliV2 = p.v0 * p.v0 + 2 * p.a * deltaX;

  if (graphType === 'a_vs_t') {
    const areaDeltaV = p.a * currentT;
    return [
      {
        title: '1. Ecuación de Aceleración Constante en MRUA',
        latexFormula: `a(t) = a = ${formatNum(p.a)}\\text{ m/s}^2 = \\text{constante}`,
        explanation: 'En el MRUA la aceleración no cambia con el tiempo. La gráfica a vs t es una línea horizontal recta a la altura y = a.'
      },
      {
        title: '2. Teorema del Área: Cambio de Velocidad (Δv)',
        latexFormula: `\\Delta v = \\int_0^t a(t)\\,dt = a \\cdot t`,
        explanation: 'El área sombreada bajo la recta horizontal entre t=0 y t=t_actual representa exactamente el incremento o decremento de velocidad Δv.'
      },
      {
        title: `3. Cálculo del Área en t = ${formatNum(currentT)} s`,
        latexFormula: `\\Delta v = (${formatNum(p.a)}\\text{ m/s}^2) \\times (${formatNum(currentT)}\\text{ s}) = ${formatNum(areaDeltaV)}\\text{ m/s}`,
        explanation: 'Velocidad final instantánea sumando la velocidad inicial v₀:',
        resultLatex: `v(t) = v_0 + \\Delta v = ${formatNum(p.v0)} + ${formatNum(areaDeltaV)} = ${formatNum(currentV)}\\text{ m/s}`
      }
    ];
  }

  if (graphType === 'v_vs_t') {
    const areaDeltaX = p.v0 * currentT + 0.5 * p.a * currentT * currentT;
    return [
      {
        title: '1. Ecuación Lineal de Velocidad vs Tiempo (MRUA)',
        latexFormula: `v(t) = v_0 + a \\cdot t`,
        explanation: 'La velocidad varía linealmente con el tiempo. La pendiente de la recta es la aceleración constante m = a y la ordenada al origen es la velocidad inicial v₀.'
      },
      {
        title: '2. Teorema del Área: Desplazamiento (Trapecio)',
        latexFormula: `\\text{Área} = \\int_0^t (v_0 + a\\tau)\\,d\\tau = v_0 t + \\frac{1}{2}a t^2 = \\Delta x`,
        explanation: 'El área bajo la recta entre t=0 y t_actual corresponde al área de un trapecio, igual al desplazamiento neto Δx.'
      },
      {
        title: `3. Estado en t = ${formatNum(currentT)} s`,
        latexFormula: `v(${formatNum(currentT)}) = ${formatNum(p.v0)} + (${formatNum(p.a)})(${formatNum(currentT)}) = ${formatNum(currentV)}\\text{ m/s}`,
        explanation: `Área bajo la curva (desplazamiento): Δx = ${formatNum(areaDeltaX)} m.`,
        resultLatex: `x(t) = x_0 + \\Delta x = ${formatNum(p.x0)} + ${formatNum(areaDeltaX)} = ${formatNum(currentX)}\\text{ m}`
      }
    ];
  }

  // Por defecto: x_vs_t (Distancia vs Tiempo)
  const steps: MathStep[] = [
    {
      title: '1. Ecuación Horaria Cuadrática de Posición (Parábola)',
      latexFormula: `x(t) = x_0 + v_0 t + \\frac{1}{2}a t^2`,
      explanation: p.a > 0
        ? 'Aceleración positiva (a > 0): la parábola es cóncava hacia arriba (acelerando hacia adelante).'
        : p.a < 0
        ? 'Aceleración negativa (a < 0): la parábola es cóncava hacia abajo (frenado o aceleración en reversa).'
        : 'Aceleración nula (a = 0): la parábola degenera en una línea recta (MRU).'
    },
    {
      title: `2. Posición Instantánea en t = ${formatNum(currentT)} s`,
      latexFormula: `x(t) = (${formatNum(p.x0)}) + (${formatNum(p.v0)})(${formatNum(currentT)}) + \\frac{1}{2}(${formatNum(p.a)})(${formatNum(currentT)})^2`,
      explanation: 'Evaluación del polinomio de segundo orden.',
      resultLatex: `x(${formatNum(currentT)}\\text{ s}) = ${formatNum(currentX)}\\text{ m}`
    },
    {
      title: `3. Velocidad Instantánea (Pendiente Tangente a la Curva)`,
      latexFormula: `v(t) = \\frac{dx}{dt} = v_0 + a t = (${formatNum(p.v0)}) + (${formatNum(p.a)})(${formatNum(currentT)})`,
      explanation: 'La pendiente de la recta tangente en cualquier punto de la parábola es exactamente la velocidad instantánea v(t).',
      resultLatex: `v(${formatNum(currentT)}\\text{ s}) = ${formatNum(currentV)}\\text{ m/s}`
    }
  ];

  // Si a != 0, calcular el vértice (donde v = 0)
  if (Math.abs(p.a) > 0.001) {
    const tVertex = -p.v0 / p.a;
    const xVertex = p.x0 + p.v0 * tVertex + 0.5 * p.a * tVertex * tVertex;
    if (tVertex > 0) {
      steps.push({
        title: '4. Vértice de la Parábola (Punto de Inflexión / Velocidad Cero)',
        latexFormula: `v(t_v) = 0 \\implies t_v = -\\frac{v_0}{a} = -\\frac{${formatNum(p.v0)}}{${formatNum(p.a)}}`,
        explanation: 'Instante en el que la velocidad se anula y el móvil invierte el sentido de su movimiento.',
        numericSub: `t_v = ${formatNum(tVertex)}\\text{ s}, \\quad x_v = ${formatNum(xVertex)}\\text{ m}`,
        resultLatex: `(t_v, x_v) = (${formatNum(tVertex)}\\text{ s}, ${formatNum(xVertex)}\\text{ m})`
      });
    }
  }

  // Torricelli
  steps.push({
    title: '5. Ecuación de Torricelli',
    latexFormula: `v^2 = v_0^2 + 2a\\Delta x`,
    explanation: 'Relación cinemática independiente del tiempo entre aceleración, desplazamiento y velocidad.',
    numericSub: `v^2 = (${formatNum(p.v0)})^2 + 2(${formatNum(p.a)})(${formatNum(deltaX)}) = ${formatNum(torricelliV2)}`,
    resultLatex: `|v| = ${formatNum(Math.abs(currentV))}\\text{ m/s}`
  });

  return steps;
}

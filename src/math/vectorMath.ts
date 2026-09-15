import type { Vector2D, VectorOperation, VectorCalculationResult, MathStep } from '../types/vectors';

export function cartesianToPolar(x: number, y: number): { r: number; thetaDeg: number } {
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const r = Math.hypot(safeX, safeY);

  if (r === 0) {
    return { r: 0, thetaDeg: 0 };
  }

  let thetaRad = Math.atan2(safeY, safeX);
  let thetaDeg = (thetaRad * 180) / Math.PI;
  if (thetaDeg < 0) thetaDeg += 360;

  return {
    r: Number(r.toFixed(4)),
    thetaDeg: Number(thetaDeg.toFixed(2))
  };
}

export function polarToCartesian(r: number, thetaDeg: number): { x: number; y: number } {
  const safeR = isNaN(r) ? 0 : Math.max(0, r);
  const safeTheta = isNaN(thetaDeg) ? 0 : thetaDeg;

  if (safeR === 0) {
    return { x: 0, y: 0 };
  }

  const rad = (safeTheta * Math.PI) / 180;
  let x = safeR * Math.cos(rad);
  let y = safeR * Math.sin(rad);

  if (Math.abs(x) < 1e-6) x = 0;
  if (Math.abs(y) < 1e-6) y = 0;

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4))
  };
}

export function formatNum(n: number, decimals: number = 2): string {
  if (isNaN(n) || n === null || n === undefined) return '0';
  if (Math.abs(n) < 1e-6) return '0';
  if (Number.isInteger(n)) return n.toString();
  const fixed = Number(n.toFixed(decimals));
  return fixed.toString();
}

export function calculateVectorOperation(
  vectors: Vector2D[],
  operation: VectorOperation
): VectorCalculationResult {
  const visibleVectors = vectors.filter(v => v.visible);

  if (visibleVectors.length === 0) {
    return {
      operation,
      title: 'Sin vectores activos',
      steps: [
        {
          title: 'Aviso',
          latexFormula: '\\text{No hay vectores visibles}',
          explanation: 'Habilita o agrega al menos un vector en la lista lateral para ver los procedimientos.'
        }
      ]
    };
  }

  // 1. Análisis individual de un vector
  if (operation === 'none' || visibleVectors.length === 1) {
    const v = visibleVectors[0];
    const vx = isNaN(v.x) ? 0 : v.x;
    const vy = isNaN(v.y) ? 0 : v.y;
    const { r, thetaDeg } = cartesianToPolar(vx, vy);

    const isZero = r === 0;
    const isVertical = vx === 0 && vy !== 0;
    const isHorizontal = vy === 0 && vx !== 0;

    let dirFormula = `\\theta = \\arctan\\left(\\frac{${v.name}_y}{${v.name}_x}\\right)`;
    let dirExplanation = 'Calculado mediante la función arco tangente según el cuadrante.';
    let dirNumeric: string | undefined = `\\theta = \\arctan\\left(\\frac{${formatNum(vy)}}{${formatNum(vx)}}\\right)`;
    let dirResult = `\\theta = ${formatNum(thetaDeg)}^\\circ`;

    if (isZero) {
      dirFormula = `|${v.name}| = 0 \\implies \\text{Vector Nulo } (\\vec{0})`;
      dirExplanation = 'Al tener magnitud cero, la dirección es indeterminada (por convención estándar se toma \\theta = 0^\\circ).';
      dirNumeric = undefined;
      dirResult = `\\theta = 0^\\circ`;
    } else if (isVertical) {
      dirFormula = `${v.name}_x = 0 \\implies \\text{Vector perpendicular sobre el eje Y}`;
      dirExplanation = vy > 0 
        ? 'Apunta directamente hacia arriba sobre el semieje positivo Y.' 
        : 'Apunta directamente hacia abajo sobre el semieje negativo Y.';
      dirNumeric = undefined;
      dirResult = `\\theta = ${vy > 0 ? '90' : '270'}^\\circ`;
    } else if (isHorizontal) {
      dirFormula = `${v.name}_y = 0 \\implies \\text{Vector horizontal sobre el eje X}`;
      dirExplanation = vx > 0 
        ? 'Apunta hacia la derecha sobre el semieje positivo X.' 
        : 'Apunta hacia la izquierda sobre el semieje negativo X.';
      dirNumeric = undefined;
      dirResult = `\\theta = ${vx > 0 ? '0' : '180'}^\\circ`;
    }

    const steps: MathStep[] = [
      {
        title: `Descomposición y Propiedades de ${v.name}`,
        latexFormula: `${v.name} = (${formatNum(vx)}\\hat{i} + ${formatNum(vy)}\\hat{j})`,
        explanation: 'Representación en componentes rectangulares canónicas unitarias (eje X horizontal, eje Y vertical).'
      },
      {
        title: 'Magnitud (Módulo)',
        latexFormula: `|${v.name}| = \\sqrt{${v.name}_x^2 + ${v.name}_y^2}`,
        explanation: 'Se aplica el Teorema de Pitágoras sobre las componentes ortogonales.',
        numericSub: `|${v.name}| = \\sqrt{(${formatNum(vx)})^2 + (${formatNum(vy)})^2} = \\sqrt{${formatNum(vx * vx + vy * vy)}}`,
        resultLatex: `|${v.name}| = ${formatNum(r)}`
      },
      {
        title: 'Dirección (Ángulo con el eje +X)',
        latexFormula: dirFormula,
        explanation: dirExplanation,
        numericSub: dirNumeric,
        resultLatex: dirResult
      },
      {
        title: 'Vector Unitario Asociado',
        latexFormula: `\\hat{u}_{${v.name}} = \\frac{${v.name}}{|${v.name}|}`,
        explanation: r > 0 ? 'Vector de magnitud 1 que señala en la misma dirección.' : 'El vector nulo no tiene vector unitario normalizado.',
        resultLatex: r > 0 
          ? `\\hat{u} = (${formatNum(vx / r, 3)}\\hat{i} + ${formatNum(vy / r, 3)}\\hat{j})`
          : '\\hat{u} = (0\\hat{i} + 0\\hat{j})'
      }
    ];

    return {
      operation: 'none',
      title: `Análisis de ${v.name}`,
      resultVector: { x: vx, y: vy, magnitude: r, angleDeg: thetaDeg },
      steps
    };
  }

  // 2. Operaciones con dos o más vectores (Suma y Resta)
  const vA = visibleVectors[0];
  const vB = visibleVectors[1];
  const vAx = isNaN(vA.x) ? 0 : vA.x;
  const vAy = isNaN(vA.y) ? 0 : vA.y;
  const vBx = isNaN(vB.x) ? 0 : vB.x;
  const vBy = isNaN(vB.y) ? 0 : vB.y;

  if (operation === 'sum') {
    let sumX = 0;
    let sumY = 0;
    const names = visibleVectors.map(v => v.name).join(' + ');

    visibleVectors.forEach(v => {
      sumX += isNaN(v.x) ? 0 : v.x;
      sumY += isNaN(v.y) ? 0 : v.y;
    });

    if (Math.abs(sumX) < 1e-6) sumX = 0;
    if (Math.abs(sumY) < 1e-6) sumY = 0;

    const { r: magR, thetaDeg: angR } = cartesianToPolar(sumX, sumY);

    const xSumFormula = visibleVectors.map(v => `${v.name}_x`).join(' + ');
    const xNumSub = visibleVectors.map(v => `(${formatNum(isNaN(v.x) ? 0 : v.x)})`).join(' + ');

    const ySumFormula = visibleVectors.map(v => `${v.name}_y`).join(' + ');
    const yNumSub = visibleVectors.map(v => `(${formatNum(isNaN(v.y) ? 0 : v.y)})`).join(' + ');

    let dirFormula = `\\theta_R = \\arctan\\left(\\frac{R_y}{R_x}\\right)`;
    let dirExplanation = 'Ángulo medido en sentido antihorario respecto al eje positivo X.';
    let dirNumeric: string | undefined = `\\theta_R = \\arctan\\left(\\frac{${formatNum(sumY)}}{${formatNum(sumX)}}\\right)`;
    let dirResult = `\\theta_R = ${formatNum(angR)}^\\circ`;

    if (magR === 0) {
      dirFormula = `|\\vec{R}| = 0 \\implies \\text{Equilibrio Vectorial (Vector Nulo)}`;
      dirExplanation = 'Las componentes se contrarrestan exactamente dando magnitud 0.';
      dirNumeric = undefined;
      dirResult = `\\theta_R = 0^\\circ`;
    } else if (sumX === 0) {
      dirFormula = `R_x = 0 \\implies \\text{Resultante vertical}`;
      dirExplanation = sumY > 0 ? 'Apunta verticalmente hacia arriba.' : 'Apunta verticalmente hacia abajo.';
      dirNumeric = undefined;
      dirResult = `\\theta_R = ${sumY > 0 ? '90' : '270'}^\\circ`;
    }

    const steps: MathStep[] = [
      {
        title: 'Principio de Superposición Vectorial',
        latexFormula: `\\vec{R} = ${names}`,
        explanation: 'La suma de vectores se efectúa sumando algebraicamente sus componentes cartesianas independientes.'
      },
      {
        title: 'Suma de Componentes en X',
        latexFormula: `R_x = ${xSumFormula}`,
        explanation: 'Sumatoria de las proyecciones en el eje horizontal.',
        numericSub: `R_x = ${xNumSub}`,
        resultLatex: `R_x = ${formatNum(sumX)}`
      },
      {
        title: 'Suma de Componentes en Y',
        latexFormula: `R_y = ${ySumFormula}`,
        explanation: 'Sumatoria de las proyecciones en el eje vertical.',
        numericSub: `R_y = ${yNumSub}`,
        resultLatex: `R_y = ${formatNum(sumY)}`
      },
      {
        title: 'Magnitud del Vector Resultante',
        latexFormula: `|\\vec{R}| = \\sqrt{R_x^2 + R_y^2}`,
        explanation: 'Norma euclidiana del vector total resultante.',
        numericSub: `|\\vec{R}| = \\sqrt{(${formatNum(sumX)})^2 + (${formatNum(sumY)})^2} = \\sqrt{${formatNum(sumX * sumX + sumY * sumY)}}`,
        resultLatex: `|\\vec{R}| = ${formatNum(magR)}`
      },
      {
        title: 'Ángulo de Dirección de la Resultante',
        latexFormula: dirFormula,
        explanation: dirExplanation,
        numericSub: dirNumeric,
        resultLatex: dirResult
      }
    ];

    return {
      operation: 'sum',
      title: `Suma Vectorial: \\vec{R} = ${names}`,
      resultVector: { x: sumX, y: sumY, magnitude: magR, angleDeg: angR },
      steps
    };
  }

  // 3. Resta Vectorial (A - B)
  let diffX = vAx - vBx;
  let diffY = vAy - vBy;
  if (Math.abs(diffX) < 1e-6) diffX = 0;
  if (Math.abs(diffY) < 1e-6) diffY = 0;

  const { r: magD, thetaDeg: angD } = cartesianToPolar(diffX, diffY);

  let diffDirFormula = `\\theta_D = \\arctan\\left(\\frac{D_y}{D_x}\\right)`;
  let diffDirExplanation = 'Módulo y ángulo polar del vector diferencia.';
  let diffDirNumeric: string | undefined = `\\theta_D = \\arctan\\left(\\frac{${formatNum(diffY)}}{${formatNum(diffX)}}\\right)`;
  let diffDirResult = `\\theta_D = ${formatNum(angD)}^\\circ`;

  if (magD === 0) {
    diffDirFormula = `|\\vec{D}| = 0 \\implies \\text{Vectores Idénticos}`;
    diffDirExplanation = 'Ambos vectores son iguales, por lo que su diferencia es el vector nulo.';
    diffDirNumeric = undefined;
    diffDirResult = `\\theta_D = 0^\\circ`;
  } else if (diffX === 0) {
    diffDirFormula = `D_x = 0 \\implies \\text{Diferencia vertical}`;
    diffDirExplanation = diffY > 0 ? 'Apunta verticalmente hacia arriba.' : 'Apunta verticalmente hacia abajo.';
    diffDirNumeric = undefined;
    diffDirResult = `\\theta_D = ${diffY > 0 ? '90' : '270'}^\\circ`;
  }

  const steps: MathStep[] = [
    {
      title: `Resta Vectorial: \\vec{D} = ${vA.name} - ${vB.name}`,
      latexFormula: `\\vec{D} = ${vA.name} + (-${vB.name})`,
      explanation: 'Restar un vector equivale a sumar su opuesto simétrico (mismo módulo, sentido contrario).'
    },
    {
      title: 'Diferencia en Componentes',
      latexFormula: `D_x = ${vA.name}_x - ${vB.name}_x, \\quad D_y = ${vA.name}_y - ${vB.name}_y`,
      explanation: 'Se restan las componentes cartesianas término a término.',
      numericSub: `D_x = (${formatNum(vAx)}) - (${formatNum(vBx)}) = ${formatNum(diffX)}, \\quad D_y = (${formatNum(vAy)}) - (${formatNum(vBy)}) = ${formatNum(diffY)}`,
      resultLatex: `\\vec{D} = (${formatNum(diffX)}\\hat{i} + ${formatNum(diffY)}\\hat{j})`
    },
    {
      title: 'Magnitud del Vector Diferencia',
      latexFormula: `|\\vec{D}| = \\sqrt{D_x^2 + D_y^2}`,
      explanation: 'Norma euclidiana del vector resultante de la resta.',
      numericSub: `|\\vec{D}| = \\sqrt{(${formatNum(diffX)})^2 + (${formatNum(diffY)})^2} = \\sqrt{${formatNum(diffX * diffX + diffY * diffY)}}`,
      resultLatex: `|\\vec{D}| = ${formatNum(magD)}`
    },
    {
      title: 'Ángulo de Dirección de la Diferencia',
      latexFormula: diffDirFormula,
      explanation: diffDirExplanation,
      numericSub: diffDirNumeric,
      resultLatex: diffDirResult
    }
  ];

  return {
    operation: 'subtract',
    title: `Resta: \\vec{D} = ${vA.name} - ${vB.name}`,
    resultVector: { x: diffX, y: diffY, magnitude: magD, angleDeg: angD },
    steps
  };
}

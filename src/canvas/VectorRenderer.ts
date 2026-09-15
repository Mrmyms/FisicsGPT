import { CartesianPlane } from './CartesianPlane';
import type { Vector2D } from '../types/vectors';

export class VectorRenderer {
  private plane: CartesianPlane;

  constructor(plane: CartesianPlane) {
    this.plane = plane;
  }

  // Dibujar una flecha vectorial completa con cabeza proporcional y etiquetas
  public drawVector(
    vector: Vector2D,
    options: {
      isHovered?: boolean;
      isDragging?: boolean;
      customLabel?: string;
      customColor?: string;
      dashed?: boolean;
      lineWidth?: number;
      arrowHeadLength?: number;
    } = {}
  ): void {
    const ctx = this.plane.getContext();
    const dpr = this.plane.getDpr();
    const isDark = this.plane.isDarkMode;

    const startX = vector.originX || 0;
    const startY = vector.originY || 0;
    const endX = startX + vector.x;
    const endY = startY + vector.y;

    const pStart = this.plane.worldToScreen(startX, startY);
    const pEnd = this.plane.worldToScreen(endX, endY);

    const dx = pEnd.sx - pStart.sx;
    const dy = pEnd.sy - pStart.sy;
    const length = Math.hypot(dx, dy);
    const color = options.customColor || vector.color;

    if (length < 2) {
      // Vector nulo (0,0): dibujar punto central interactivo y etiqueta
      ctx.save();
      ctx.scale(dpr, dpr);
      if (options.isHovered || options.isDragging) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(pStart.sx, pStart.sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.stroke();

      const labelText = options.customLabel || `${vector.name} (0, 0)`;
      this.drawLabelBadge(ctx, labelText, pStart.sx, pStart.sy - 16, color, isDark);
      ctx.restore();
      return;
    }
    const lineWidth = options.lineWidth || (vector.isResultant ? 3.5 : 2.5);
    const headLen = Math.min(18, Math.max(10, (options.arrowHeadLength || 14)));
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Si está hovered o dragged, añadir resplandor (glow)
    if (options.isHovered || options.isDragging) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (options.dashed) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    // Cuerpo de la flecha
    ctx.beginPath();
    ctx.moveTo(pStart.sx, pStart.sy);
    ctx.lineTo(pEnd.sx, pEnd.sy);
    ctx.stroke();

    // Cabeza de flecha
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pEnd.sx, pEnd.sy);
    ctx.lineTo(
      pEnd.sx - headLen * Math.cos(angle - Math.PI / 7),
      pEnd.sy - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      pEnd.sx - (headLen * 0.7) * Math.cos(angle),
      pEnd.sy - (headLen * 0.7) * Math.sin(angle)
    );
    ctx.lineTo(
      pEnd.sx - headLen * Math.cos(angle + Math.PI / 7),
      pEnd.sy - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();

    // Puntero interactivo en la punta del vector
    const handleRadius = options.isDragging ? 7 : (options.isHovered ? 6 : 4.5);
    ctx.beginPath();
    ctx.arc(pEnd.sx, pEnd.sy, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#ffffff' : '#111827';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Dibujar componentes rectangulares (si está habilitado y no es línea punteada)
    if (vector.showComponents && !options.dashed) {
      this.drawVectorComponents(vector, pStart, pEnd, color);
    }

    // Dibujar arco de ángulo (si está habilitado y no es línea punteada)
    if (vector.showAngle && !options.dashed) {
      this.drawVectorAngle(vector, pStart);
    }

    // Etiqueta del vector (estilo badge flotante)
    const labelText = options.customLabel || vector.name;
    const midX = (pStart.sx + pEnd.sx) / 2;
    const midY = (pStart.sy + pEnd.sy) / 2;
    // Offset perpendicular
    const perpX = -Math.sin(angle) * 16;
    const perpY = Math.cos(angle) * 16;

    this.drawLabelBadge(ctx, labelText, midX + perpX, midY + perpY, color, isDark);

    ctx.restore();
  }

  // Dibujar proyecciones discontinuas en X e Y
  private drawVectorComponents(
    _vector: Vector2D,
    pStart: { sx: number; sy: number },
    pEnd: { sx: number; sy: number },
    color: string
  ): void {
    const ctx = this.plane.getContext();
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.65;

    // Triángulo rectángulo: desde el inicio en X hasta la proyección, luego vertical hacia la punta
    const cornerX = pEnd.sx;
    const cornerY = pStart.sy;

    ctx.beginPath();
    ctx.moveTo(pStart.sx, pStart.sy);
    ctx.lineTo(cornerX, cornerY);
    ctx.lineTo(pEnd.sx, pEnd.sy);
    ctx.stroke();

    ctx.restore();
  }

  // Dibujar arco angular desde el eje +X
  private drawVectorAngle(vector: Vector2D, pStart: { sx: number; sy: number }): void {
    const ctx = this.plane.getContext();
    const rad = Math.atan2(-vector.y, vector.x); // Invertir Y para canvas
    const arcRadius = 26;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = vector.color;
    ctx.lineWidth = 1.8;
    ctx.arc(pStart.sx, pStart.sy, arcRadius, 0, rad, vector.y > 0);
    ctx.stroke();

    let deg = (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    const midRad = rad / 2;
    const textX = pStart.sx + (arcRadius + 14) * Math.cos(midRad);
    const textY = pStart.sy + (arcRadius + 14) * Math.sin(midRad);

    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = this.plane.isDarkMode ? '#e2e8f0' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${deg.toFixed(1)}°`, textX, textY);

    ctx.restore();
  }

  // Etiqueta legible con fondo tipo cápsula
  private drawLabelBadge(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
    isDark: boolean
  ): void {
    ctx.save();
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textMetrics = ctx.measureText(text);
    const padX = 7;
    const w = textMetrics.width + padX * 2;
    const h = 18;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  // Demostración geométrica del paralelogramo
  public drawParallelogram(
    vA: Vector2D,
    vB: Vector2D,
    resultant: Vector2D,
    options: {
      isHoveredA?: boolean;
      isDraggingA?: boolean;
      isHoveredB?: boolean;
      isDraggingB?: boolean;
    } = {}
  ): void {
    const ctx = this.plane.getContext();
    const dpr = this.plane.getDpr();
    const isDark = this.plane.isDarkMode;

    const origX = vA.originX || 0;
    const origY = vA.originY || 0;

    const pOrig = this.plane.worldToScreen(origX, origY);
    const pTipA = this.plane.worldToScreen(origX + vA.x, origY + vA.y);
    const pTipB = this.plane.worldToScreen(origX + vB.x, origY + vB.y);
    const pTipR = this.plane.worldToScreen(origX + vA.x + vB.x, origY + vA.y + vB.y);

    // 1. Área sombreada del paralelogramo (con escala DPR aislada)
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.beginPath();
    ctx.moveTo(pOrig.sx, pOrig.sy);
    ctx.lineTo(pTipA.sx, pTipA.sy);
    ctx.lineTo(pTipR.sx, pTipR.sy);
    ctx.lineTo(pTipB.sx, pTipB.sy);
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(234, 179, 8, 0.12)';
    ctx.fill();
    ctx.restore();

    // 2. Vector A original desde el origen
    this.drawVector(vA, {
      isHovered: options.isHoveredA,
      isDragging: options.isDraggingA,
      lineWidth: 2.8
    });

    // 3. Vector B original desde el origen
    this.drawVector(vB, {
      isHovered: options.isHoveredB,
      isDragging: options.isDraggingB,
      lineWidth: 2.8
    });

    // 4. Vector B trasladado a la punta de A (B')
    const vBTrans: Vector2D = {
      ...vB,
      originX: origX + vA.x,
      originY: origY + vA.y
    };
    this.drawVector(vBTrans, {
      dashed: true,
      customColor: vB.color,
      customLabel: `${vB.name}'`,
      lineWidth: 2
    });

    // 5. Vector A trasladado a la punta de B (A')
    const vATrans: Vector2D = {
      ...vA,
      originX: origX + vB.x,
      originY: origY + vB.y
    };
    this.drawVector(vATrans, {
      dashed: true,
      customColor: vA.color,
      customLabel: `${vA.name}'`,
      lineWidth: 2
    });

    // 6. Vector Resultante (diagonal principal)
    this.drawVector(resultant, {
      customLabel: resultant.name,
      lineWidth: 3.8
    });
  }

  // Demostración del método cola con punta (polígono)
  public drawTipToTail(
    vectors: Vector2D[],
    resultant: Vector2D,
    options?: { hoveredId?: string | null; draggedId?: string | null }
  ): void {
    let currentOriginX = 0;
    let currentOriginY = 0;

    vectors.forEach((v) => {
      const chainedVector: Vector2D = {
        ...v,
        originX: currentOriginX,
        originY: currentOriginY
      };
      this.drawVector(chainedVector, {
        customLabel: `${v.name}`,
        lineWidth: 2.5,
        isHovered: v.id === options?.hoveredId,
        isDragging: v.id === options?.draggedId
      });
      currentOriginX += v.x;
      currentOriginY += v.y;
    });

    // Resultante de origen a final
    this.drawVector(resultant, {
      customLabel: resultant.name,
      lineWidth: 3.5
    });
  }

  // Detección de clic/arrastre sobre el extremo o cuerpo de un vector
  public hitTest(screenX: number, screenY: number, vectors: Vector2D[]): { vector: Vector2D; isTip: boolean } | null {
    const threshold = 14; // Píxeles de tolerancia

    for (let i = vectors.length - 1; i >= 0; i--) {
      const v = vectors[i];
      if (!v.visible) continue;

      const startX = v.originX || 0;
      const startY = v.originY || 0;
      const endX = startX + v.x;
      const endY = startY + v.y;

      const pTip = this.plane.worldToScreen(endX, endY);
      const distTip = Math.hypot(screenX - pTip.sx, screenY - pTip.sy);

      if (distTip <= threshold) {
        return { vector: v, isTip: true };
      }
    }

    return null;
  }
}

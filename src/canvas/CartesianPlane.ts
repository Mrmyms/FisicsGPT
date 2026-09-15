export interface CanvasViewTransform {
  scale: number; // Pixels por unidad de mundo
  offsetX: number; // Desplazamiento en píxeles de pantalla
  offsetY: number; // Desplazamiento en píxeles de pantalla
}

export interface GridStep {
  major: number;
  minor: number;
}

export class CartesianPlane {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public transform: CanvasViewTransform;
  public isDarkMode: boolean = true;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement, isDarkMode: boolean = true) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo obtener el contexto 2D del Canvas');
    this.ctx = context;
    this.isDarkMode = isDarkMode;

    // Valores iniciales (centrado con 40px por unidad)
    this.transform = {
      scale: 40,
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2
    };

    this.updateDpr();
  }

  public updateDpr(): void {
    this.dpr = window.devicePixelRatio || 1;
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
  }

  // Conversión: Coordenadas de Mundo (Física) -> Coordenadas de Pantalla (Píxeles)
  public worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: this.transform.offsetX + wx * this.transform.scale,
      sy: this.transform.offsetY - wy * this.transform.scale // Invertido en Y para plano cartesiano tradicional
    };
  }

  // Conversión: Coordenadas de Pantalla (Píxeles) -> Coordenadas de Mundo (Física)
  public screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    return {
      wx: (sx - this.transform.offsetX) / this.transform.scale,
      wy: -(sy - this.transform.offsetY) / this.transform.scale
    };
  }

  // Zoom centrado en el punto del cursor (estilo Desmos / Google Maps)
  public zoomAt(screenX: number, screenY: number, factor: number): void {
    // Permite un rango de zoom ultra-amplio (zoom negativo hasta 0.02 y zoom positivo hasta 1000)
    const newScale = Math.max(0.02, Math.min(1000, this.transform.scale * factor));
    if (newScale === this.transform.scale) return;

    // El punto de mundo bajo el cursor debe mantenerse exactamente en el mismo pixel
    const wx = (screenX - this.transform.offsetX) / this.transform.scale;
    const wy = -(screenY - this.transform.offsetY) / this.transform.scale;

    this.transform.scale = newScale;
    this.transform.offsetX = screenX - wx * newScale;
    this.transform.offsetY = screenY + wy * newScale;
  }

  // Pan (arrastre)
  public pan(dx: number, dy: number): void {
    this.transform.offsetX += dx;
    this.transform.offsetY += dy;
  }

  // Centrar vista en el origen o en una región
  public centerAt(wx: number = 0, wy: number = 0, targetScale?: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (targetScale) this.transform.scale = targetScale;
    this.transform.offsetX = rect.width / 2 - wx * this.transform.scale;
    this.transform.offsetY = rect.height / 2 + wy * this.transform.scale;
  }

  // Ajustar vista para encajar un bounding box (minX, minY, maxX, maxY)
  public fitBounds(minX: number, minY: number, maxX: number, maxY: number, padding: number = 60): void {
    const rect = this.canvas.getBoundingClientRect();
    const widthW = Math.max(0.1, maxX - minX);
    const heightW = Math.max(0.1, maxY - minY);

    const scaleX = (rect.width - padding * 2) / widthW;
    const scaleY = (rect.height - padding * 2) / heightW;
    const newScale = Math.max(0.02, Math.min(500, Math.min(scaleX, scaleY)));

    this.transform.scale = newScale;
    const centerWX = (minX + maxX) / 2;
    const centerWY = (minY + maxY) / 2;

    this.transform.offsetX = rect.width / 2 - centerWX * newScale;
    this.transform.offsetY = rect.height / 2 + centerWY * newScale;
  }

  // Calcular paso de rejilla adaptativo estilo Desmos: 1, 2, 5 * 10^k
  private getAdaptiveGridStep(): GridStep {
    const minPixelSpacing = 70; // Separación mínima deseada entre líneas mayores en pantalla
    const roughStep = minPixelSpacing / this.transform.scale;

    const exponent = Math.floor(Math.log10(roughStep));
    const powerOfTen = Math.pow(10, exponent);
    const fraction = roughStep / powerOfTen;

    let major: number;
    let minor: number;

    if (fraction <= 1.5) {
      major = 1 * powerOfTen;
      minor = major / 5;
    } else if (fraction <= 3.5) {
      major = 2 * powerOfTen;
      minor = major / 4;
    } else if (fraction <= 7.5) {
      major = 5 * powerOfTen;
      minor = major / 5;
    } else {
      major = 10 * powerOfTen;
      minor = major / 5;
    }

    return { major, minor };
  }

  // Limpiar y dibujar la rejilla y los ejes con tipografía nítida
  public drawGrid(): void {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Fondo
    ctx.fillStyle = this.isDarkMode ? '#0d1117' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const { major, minor } = this.getAdaptiveGridStep();

    // Rango visible de coordenadas de mundo
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(width, height);

    const startX = Math.floor(topLeft.wx / minor) * minor;
    const endX = Math.ceil(bottomRight.wx / minor) * minor;
    const startY = Math.floor(bottomRight.wy / minor) * minor;
    const endY = Math.ceil(topLeft.wy / minor) * minor;

    // Colores según tema
    const minorLineColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const majorLineColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    const axisColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.55)';
    const labelColor = this.isDarkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.65)';

    // 1. Líneas menores (subrejilla)
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = minorLineColor;

    for (let wx = startX; wx <= endX; wx += minor) {
      // Omitir si es línea mayor para evitar sobreescritura
      const isMajor = Math.abs(Math.round(wx / major) * major - wx) < minor * 0.01;
      if (!isMajor) {
        const { sx } = this.worldToScreen(wx, 0);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }
    }

    for (let wy = startY; wy <= endY; wy += minor) {
      const isMajor = Math.abs(Math.round(wy / major) * major - wy) < minor * 0.01;
      if (!isMajor) {
        const { sy } = this.worldToScreen(0, wy);
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }
    }
    ctx.stroke();

    // 2. Líneas mayores
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = majorLineColor;

    for (let wx = Math.floor(topLeft.wx / major) * major; wx <= endX; wx += major) {
      const { sx } = this.worldToScreen(wx, 0);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    for (let wy = Math.floor(bottomRight.wy / major) * major; wy <= endY; wy += major) {
      const { sy } = this.worldToScreen(0, wy);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // 3. Ejes principales (X e Y)
    const origin = this.worldToScreen(0, 0);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisColor;

    // Eje Y (vertical en x=0)
    if (origin.sx >= 0 && origin.sx <= width) {
      ctx.moveTo(origin.sx, 0);
      ctx.lineTo(origin.sx, height);
    }
    // Eje X (horizontal en y=0)
    if (origin.sy >= 0 && origin.sy <= height) {
      ctx.moveTo(0, origin.sy);
      ctx.lineTo(width, origin.sy);
    }
    ctx.stroke();

    // 4. Etiquetas numéricas (Estilo Desmos: se mantienen en vista aunque el eje esté al borde)
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Determinar posición 'pegajosa' de las etiquetas de X
    let labelY = origin.sy + 14;
    if (labelY < 18) labelY = 18;
    if (labelY > height - 16) labelY = height - 16;

    // Determinar posición 'pegajosa' de las etiquetas de Y
    let labelX = origin.sx - 14;
    if (labelX < 24) labelX = 24;
    if (labelX > width - 24) labelX = width - 24;

    // Números en Eje X
    for (let wx = Math.floor(topLeft.wx / major) * major; wx <= endX; wx += major) {
      if (Math.abs(wx) < major * 0.001) continue; // Evitar el 0 (se dibuja en el origen)
      const { sx } = this.worldToScreen(wx, 0);
      if (sx > 15 && sx < width - 15) {
        ctx.fillText(this.formatGridLabel(wx, major), sx, labelY);
      }
    }

    // Números en Eje Y
    ctx.textAlign = origin.sx < 30 ? 'left' : 'right';
    for (let wy = Math.floor(bottomRight.wy / major) * major; wy <= endY; wy += major) {
      if (Math.abs(wy) < major * 0.001) continue;
      const { sy } = this.worldToScreen(0, wy);
      if (sy > 15 && sy < height - 15) {
        ctx.fillText(this.formatGridLabel(wy, major), labelX, sy);
      }
    }

    // Etiqueta del Origen "(0,0)"
    if (origin.sx > 15 && origin.sx < width - 15 && origin.sy > 15 && origin.sy < height - 15) {
      ctx.textAlign = 'right';
      ctx.fillText('0', origin.sx - 6, origin.sy + 12);
    }

    ctx.restore();
  }

  private formatGridLabel(val: number, step: number): string {
    if (Math.abs(val) < 1e-9) return '0';
    if (step >= 1) return val.toFixed(0);
    if (step >= 0.1) return val.toFixed(1);
    if (step >= 0.01) return val.toFixed(2);
    return val.toPrecision(3);
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getDpr(): number {
    return this.dpr;
  }
}

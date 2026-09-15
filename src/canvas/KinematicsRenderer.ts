import { CartesianPlane } from './CartesianPlane';
import type {
  ProjectileParams,
  ProjectileItem,
  CriticalPoints,
  TrajectoryPoint,
  MRUParams,
  MRUItem,
  MRUAParams,
  MRUAItem,
  MotionGraphType
} from '../types/kinematics';
import { calculateProjectileCriticalPoints, generateProjectileTrajectoryPoints, getProjectilePointAtTime } from '../math/kinematicsMath';
import { formatNum } from '../math/vectorMath';

export class KinematicsRenderer {
  private plane: CartesianPlane;

  constructor(plane: CartesianPlane) {
    this.plane = plane;
  }

  // Renderizar tiro parabólico completo (soporta 1 o múltiples proyectiles simultáneos)
  public drawProjectileSimulation(
    paramsOrItems: ProjectileParams | ProjectileItem[],
    currentTime: number,
    options: {
      showVectors?: boolean;
      showComponents?: boolean;
      showTrajectoryTrace?: boolean;
      showCriticalPoints?: boolean;
    } = {},
    activeId?: string
  ): void {
    const ctx = this.plane.getContext();
    const dpr = this.plane.getDpr();
    const isDark = this.plane.isDarkMode;

    const items: ProjectileItem[] = Array.isArray(paramsOrItems)
      ? paramsOrItems
      : [{ id: 'p-default', name: 'Tiro 1', color: '#38bdf8', visible: true, params: paramsOrItems }];

    const visibleItems = items.filter(i => i.visible);
    if (visibleItems.length === 0) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Dibujar suelo que cubra el alcance máximo de todos los tiros
    let maxReach = 20;
    let minStartX = 0;
    visibleItems.forEach(it => {
      const cp = calculateProjectileCriticalPoints(it.params);
      if (cp.alcanceMax > maxReach) maxReach = cp.alcanceMax;
      if (it.params.x0 < minStartX) minStartX = it.params.x0;
    });
    this.drawGround(minStartX, maxReach);

    // 2. Dibujar cada proyectil visible
    visibleItems.forEach((it, idx) => {
      const params = it.params;
      const criticalPoints = calculateProjectileCriticalPoints(params);
      const trajectoryPoints = generateProjectileTrajectoryPoints(params, 120);
      const currentPoint = getProjectilePointAtTime(params, currentTime);
      const color = it.color || '#38bdf8';
      const isActive = activeId ? it.id === activeId : idx === 0;

      // Plataforma si y0 > 0
      if (params.y0 > 0) {
        this.drawLaunchPlatform(params.x0, params.y0);
      }

      // Trayectoria parabólica
      if (options.showTrajectoryTrace !== false && trajectoryPoints.length > 1) {
        ctx.beginPath();
        const first = this.plane.worldToScreen(trajectoryPoints[0].x, trajectoryPoints[0].y);
        ctx.moveTo(first.sx, first.sy);

        for (let i = 1; i < trajectoryPoints.length; i++) {
          const pt = this.plane.worldToScreen(trajectoryPoints[i].x, trajectoryPoints[i].y);
          ctx.lineTo(pt.sx, pt.sy);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = isActive ? 3 : 2;
        ctx.stroke();

        // Relleno degradado sutil
        const groundY = this.plane.worldToScreen(0, 0).sy;
        ctx.lineTo(this.plane.worldToScreen(criticalPoints.alcanceMax, 0).sx, groundY);
        ctx.lineTo(first.sx, groundY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, this.plane.worldToScreen(0, criticalPoints.hMax).sy, 0, groundY);
        grad.addColorStop(0, `${color}28`);
        grad.addColorStop(1, `${color}00`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Puntos críticos (para el activo o si hay uno solo)
      if (options.showCriticalPoints !== false && (isActive || visibleItems.length === 1)) {
        this.drawCriticalPointsPins(params, criticalPoints, isDark, color);
      }

      // Partícula móvil animada
      this.drawProjectileBall(currentPoint, params, options, isDark, color, it.name);
    });

    // 3. Leyenda en la esquina superior derecha si hay múltiples tiros
    if (visibleItems.length > 1) {
      this.drawTopRightLegend(ctx, visibleItems, isDark);
    }

    ctx.restore();
  }

  // Dibujar suelo y marcas
  private drawGround(startX: number, endX: number): void {
    const ctx = this.plane.getContext();
    const pOrigin = this.plane.worldToScreen(0, 0);
    const minW = Math.min(-10, startX - 5);
    const maxW = Math.max(endX + 10, 20);

    const sLeft = this.plane.worldToScreen(minW, 0).sx;
    const sRight = this.plane.worldToScreen(maxW, 0).sx;

    ctx.beginPath();
    ctx.moveTo(sLeft, pOrigin.sy);
    ctx.lineTo(sRight, pOrigin.sy);
    ctx.strokeStyle = this.plane.isDarkMode ? 'rgba(74, 222, 128, 0.6)' : 'rgba(22, 163, 74, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Plataforma si y0 > 0
  private drawLaunchPlatform(x0: number, y0: number): void {
    const ctx = this.plane.getContext();
    const pTop = this.plane.worldToScreen(x0, y0);
    const pBottom = this.plane.worldToScreen(x0, 0);
    const widthPx = 24;

    ctx.fillStyle = this.plane.isDarkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.4)';
    ctx.strokeStyle = this.plane.isDarkMode ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 1.5;

    ctx.fillRect(pTop.sx - widthPx, pTop.sy, widthPx, pBottom.sy - pTop.sy);
    ctx.strokeRect(pTop.sx - widthPx, pTop.sy, widthPx, pBottom.sy - pTop.sy);
  }

  // Puntos clave: Altura Máxima, Alcance Máximo
  private drawCriticalPointsPins(
    params: ProjectileParams,
    cp: CriticalPoints,
    isDark: boolean,
    color: string = '#f59e0b'
  ): void {
    const rad = (params.angleDeg * Math.PI) / 180;
    const v0x = params.v0 * Math.cos(rad);
    const xVertex = params.x0 + v0x * cp.tSubida;

    // 1. Pin Vértice (Altura Máxima)
    const pVertex = this.plane.worldToScreen(xVertex, cp.hMax);
    this.drawPin(
      pVertex.sx,
      pVertex.sy,
      `H_max: ${formatNum(cp.hMax)} m`,
      color,
      isDark
    );

    // 2. Pin Alcance (Impacto)
    const pImpact = this.plane.worldToScreen(cp.alcanceMax, 0);
    this.drawPin(
      pImpact.sx,
      pImpact.sy,
      `R: ${formatNum(cp.alcanceMax)} m`,
      color,
      isDark
    );
  }

  private drawPin(x: number, y: number, text: string, color: string, isDark: boolean): void {
    const ctx = this.plane.getContext();
    ctx.save();

    // Punto central
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
    ctx.stroke();

    // Badge
    ctx.font = 'bold 11px -apple-system, sans-serif';
    const metrics = ctx.measureText(text);
    const pad = 6;
    const bw = metrics.width + pad * 2;
    const bh = 18;
    const badgeY = y - 18;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(x - bw / 2, badgeY - bh / 2, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, badgeY);

    ctx.restore();
  }

  // Dibujar partícula con vectores de velocidad
  private drawProjectileBall(
    pt: TrajectoryPoint,
    _params: ProjectileParams,
    options: { showVectors?: boolean; showComponents?: boolean },
    isDark: boolean,
    color: string = '#f43f5e',
    label?: string
  ): void {
    const ctx = this.plane.getContext();
    const pPos = this.plane.worldToScreen(pt.x, pt.y);

    // Sombra sobre el suelo
    const pShadow = this.plane.worldToScreen(pt.x, 0);
    ctx.beginPath();
    ctx.ellipse(pShadow.sx, pShadow.sy, 8, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)';
    ctx.fill();

    // Línea de altura vertical tenue
    if (pt.y > 0.05) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.moveTo(pPos.sx, pPos.sy);
      ctx.lineTo(pShadow.sx, pShadow.sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Partícula
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(pPos.sx, pPos.sy, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // Etiqueta del nombre del proyectil flotante sobre la esfera
    if (label) {
      ctx.save();
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, pPos.sx, pPos.sy - 12);
      ctx.restore();
    }

    // Vectores cinemáticos
    if (options.showVectors !== false) {
      const vScale = 1.6; // Factor para visualización de longitud de velocidad en pantalla
      const vEndX = pPos.sx + pt.vx * vScale;
      const vEndY = pPos.sy - pt.vy * vScale; // -vy por inversión Y de pantalla

      // Componente Vx (horizontal cian)
      if (options.showComponents !== false) {
        this.drawArrow(ctx, pPos.sx, pPos.sy, vEndX, pPos.sy, '#06b6d4', 1.8, 'v_x');
        // Componente Vy (vertical violeta)
        this.drawArrow(ctx, pPos.sx, pPos.sy, pPos.sx, vEndY, '#a855f7', 1.8, 'v_y');
      }

      // Vector Velocidad Resultante Total (amarillo vibrante)
      this.drawArrow(ctx, pPos.sx, pPos.sy, vEndX, vEndY, '#eab308', 2.8, 'v(t)');
    }
  }

  // Leyenda en la esquina superior derecha para múltiples tiros en 2D
  private drawTopRightLegend(
    ctx: CanvasRenderingContext2D,
    items: ProjectileItem[],
    isDark: boolean
  ): void {
    const rect = ctx.canvas.getBoundingClientRect();
    const viewWidth = rect.width;
    const visible = items.filter(i => i.visible);
    if (visible.length <= 1) return;

    const lw = 175;
    const lh = 28 + visible.length * 20;
    const lx = Math.max(16, viewWidth - lw - 20);
    const ly = 20;

    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PROYECTILES ACTIVOS', lx + 12, ly + 18);

    visible.forEach((it, i) => {
      const iy = ly + 38 + i * 20;
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(lx + 16, iy - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText(it.name, lx + 26, iy);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText(`${formatNum(it.params.v0, 1)}m/s @ ${formatNum(it.params.angleDeg, 0)}°`, lx + 88, iy);
    });

    ctx.restore();
  }

  // Función auxiliar de flechas para vectores cinemáticos
  private drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    width: number,
    label: string
  ): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;

    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(12, Math.max(7, len * 0.25));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Etiqueta
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillText(label, toX + Math.cos(angle) * 8, toY + Math.sin(angle) * 8);

    ctx.restore();
  }

  // Render para MRU, MRUA y Tiro Parabólico con métodos de graficación analítica
  public drawMotionGraph(
    mode: 'mru' | 'mrua' | 'projectile',
    graphType: MotionGraphType,
    mruParamsOrItems: MRUParams | MRUItem[],
    mruaParamsOrItems: MRUAParams | MRUAItem[],
    currentTime: number,
    maxTime: number,
    projectileParamsOrItems?: ProjectileParams | ProjectileItem[]
  ): void {
    const ctx = this.plane.getContext();
    const dpr = this.plane.getDpr();
    const isDark = this.plane.isDarkMode;
    const rect = this.plane.getContext().canvas.getBoundingClientRect();
    const viewWidth = rect.width;
    const viewHeight = rect.height;

    ctx.save();
    ctx.scale(dpr, dpr);

    if (mode === 'projectile' && projectileParamsOrItems) {
      const pItems: ProjectileItem[] = Array.isArray(projectileParamsOrItems)
        ? projectileParamsOrItems
        : [{ id: 'p1', name: 'Tiro 1', color: '#38bdf8', visible: true, params: projectileParamsOrItems }];

      const visibleProjectiles = pItems.filter(p => p.visible);

      if (graphType === 'x_vs_t') {
        this.drawProjectileDistanceVsTime(visibleProjectiles, currentTime, isDark);
      } else if (graphType === 'v_vs_t') {
        this.drawProjectileSpeedVsTime(visibleProjectiles, currentTime, isDark);
      } else if (graphType === 'a_vs_t') {
        this.drawProjectileAccelerationVsTime(visibleProjectiles, currentTime, isDark);
      }

      this.drawGraphHeaderBadge(ctx, 'projectile', graphType, isDark, visibleProjectiles);
      ctx.restore();
      return;
    }

    if (mode === 'mru') {
      const mruList: MRUItem[] = Array.isArray(mruParamsOrItems)
        ? mruParamsOrItems
        : [{ id: 'm1', name: 'Móvil 1', color: '#38bdf8', visible: true, params: mruParamsOrItems }];

      const visibleMru = mruList.filter(m => m.visible);

      if (graphType === 'x_vs_t') {
        this.drawMRUDistanceVsTime(visibleMru, currentTime, maxTime, isDark);
      } else if (graphType === 'v_vs_t') {
        this.drawMRUSpeedVsTime(visibleMru, currentTime, maxTime, isDark);
      }

      this.drawGraphHeaderBadge(ctx, 'mru', graphType, isDark, visibleMru);

      const cars = visibleMru.map(it => ({
        name: it.name,
        color: it.color,
        posX: it.params.x0 + it.params.v * currentTime,
        velX: it.params.v,
        accX: 0
      }));
      this.draw1DCarTrackStrip(ctx, viewWidth, viewHeight, 'mru', cars, isDark);
    } else {
      // MRUA
      const mruaList: MRUAItem[] = Array.isArray(mruaParamsOrItems)
        ? mruaParamsOrItems
        : [{ id: 'a1', name: 'Móvil 1', color: '#38bdf8', visible: true, params: mruaParamsOrItems }];

      const visibleMrua = mruaList.filter(m => m.visible);

      if (graphType === 'x_vs_t') {
        this.drawMRUADistanceVsTime(visibleMrua, currentTime, maxTime, isDark);
      } else if (graphType === 'v_vs_t') {
        this.drawMRUASpeedVsTime(visibleMrua, currentTime, maxTime, isDark);
      } else if (graphType === 'a_vs_t') {
        this.drawMRUAAccelerationVsTime(visibleMrua, currentTime, maxTime, isDark);
      }

      this.drawGraphHeaderBadge(ctx, 'mrua', graphType, isDark, visibleMrua);

      const cars = visibleMrua.map(it => ({
        name: it.name,
        color: it.color,
        posX: it.params.x0 + it.params.v0 * currentTime + 0.5 * it.params.a * currentTime * currentTime,
        velX: it.params.v0 + it.params.a * currentTime,
        accX: it.params.a
      }));
      this.draw1DCarTrackStrip(ctx, viewWidth, viewHeight, 'mrua', cars, isDark);
    }

    ctx.restore();
  }

  // MRU: DISTANCIA VS TIEMPO (x vs t) para múltiples móviles
  private drawMRUDistanceVsTime(
    items: MRUItem[],
    currentTime: number,
    maxTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const tEnd = Math.max(2, maxTime * 1.05);

    items.forEach(it => {
      const color = it.color || '#38bdf8';
      const pStart = this.plane.worldToScreen(0, it.params.x0);
      const pEnd = this.plane.worldToScreen(tEnd, it.params.x0 + it.params.v * tEnd);

      // Línea proyectada completa discontinua
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Segmento recorrido sólido con brillo
      const currX = it.params.x0 + it.params.v * currentTime;
      const pCurr = this.plane.worldToScreen(currentTime, currX);

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pCurr.sx, pCurr.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.restore();

      // Proyección al eje x y t
      const pAxisT = this.plane.worldToScreen(currentTime, 0);
      const pAxisX = this.plane.worldToScreen(0, currX);
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.moveTo(pCurr.sx, pCurr.sy);
      ctx.lineTo(pAxisT.sx, pAxisT.sy);
      ctx.moveTo(pCurr.sx, pCurr.sy);
      ctx.lineTo(pAxisX.sx, pAxisX.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Punto seguidor animado
      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: x = ${formatNum(currX, 1)} m`,
        color,
        isDark
      );
    });
  }

  // MRU: RAPIDEZ VS TIEMPO (v vs t) para múltiples móviles
  private drawMRUSpeedVsTime(
    items: MRUItem[],
    currentTime: number,
    maxTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const tEnd = Math.max(2, maxTime * 1.05);

    items.forEach((it, idx) => {
      const color = it.color || '#10b981';
      const v = it.params.v;

      // Área sombreada bajo la curva para el primer móvil
      if (currentTime > 0.05 && idx === 0) {
        const pZeroStart = this.plane.worldToScreen(0, 0);
        const pVStart = this.plane.worldToScreen(0, v);
        const pVCurr = this.plane.worldToScreen(currentTime, v);
        const pZeroCurr = this.plane.worldToScreen(currentTime, 0);

        ctx.beginPath();
        ctx.moveTo(pZeroStart.sx, pZeroStart.sy);
        ctx.lineTo(pVStart.sx, pVStart.sy);
        ctx.lineTo(pVCurr.sx, pVCurr.sy);
        ctx.lineTo(pZeroCurr.sx, pZeroCurr.sy);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, pVStart.sy, 0, pZeroStart.sy);
        grad.addColorStop(0, `${color}40`);
        grad.addColorStop(1, `${color}08`);
        ctx.fillStyle = grad;
        ctx.fill();

        const deltaX = v * currentTime;
        const pMid = this.plane.worldToScreen(currentTime / 2, v / 2);
        this.drawPin(pMid.sx, pMid.sy, `Área = Δx: ${formatNum(deltaX, 1)} m`, color, isDark);
      }

      // Línea horizontal completa
      const pStart = this.plane.worldToScreen(0, v);
      const pEnd = this.plane.worldToScreen(tEnd, v);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Tramo recorrido sólido
      const pCurr = this.plane.worldToScreen(currentTime, v);
      ctx.beginPath();
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pCurr.sx, pCurr.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: v = ${formatNum(v, 1)} m/s`,
        color,
        isDark
      );
    });
  }

  // MRUA: DISTANCIA VS TIEMPO (x vs t) para múltiples móviles
  private drawMRUADistanceVsTime(
    items: MRUAItem[],
    currentTime: number,
    maxTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const tEnd = Math.max(2, maxTime * 1.05);
    const samples = 140;

    items.forEach(it => {
      const color = it.color || '#38bdf8';

      // Curva completa punteada
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * tEnd;
        const x = it.params.x0 + it.params.v0 * t + 0.5 * it.params.a * t * t;
        const p = this.plane.worldToScreen(t, x);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tramo recorrido sólido con brillo
      const currX = it.params.x0 + it.params.v0 * currentTime + 0.5 * it.params.a * currentTime * currentTime;
      const currV = it.params.v0 + it.params.a * currentTime;
      const progressSamples = Math.max(5, Math.floor((currentTime / tEnd) * samples));

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i <= progressSamples; i++) {
        const t = (i / progressSamples) * currentTime;
        const x = it.params.x0 + it.params.v0 * t + 0.5 * it.params.a * t * t;
        const p = this.plane.worldToScreen(t, x);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.restore();

      // Punto actual y proyecciones
      const pCurrent = this.plane.worldToScreen(currentTime, currX);
      const pAxisT = this.plane.worldToScreen(currentTime, 0);
      const pAxisX = this.plane.worldToScreen(0, currX);

      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.moveTo(pCurrent.sx, pCurrent.sy);
      ctx.lineTo(pAxisT.sx, pAxisT.sy);
      ctx.moveTo(pCurrent.sx, pCurrent.sy);
      ctx.lineTo(pAxisX.sx, pAxisX.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      this.drawFollowerPoint(pCurrent.sx, pCurrent.sy, color);
      this.drawPin(
        pCurrent.sx,
        pCurrent.sy - 12,
        `${it.name}: x=${formatNum(currX, 1)}m, v=${formatNum(currV, 1)}m/s`,
        color,
        isDark
      );
    });
  }

  // MRUA: RAPIDEZ VS TIEMPO (v vs t) para múltiples móviles
  private drawMRUASpeedVsTime(
    items: MRUAItem[],
    currentTime: number,
    maxTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const tEnd = Math.max(2, maxTime * 1.05);
    const samples = 100;

    items.forEach((it, idx) => {
      const color = it.color || '#10b981';
      const velX = it.params.v0 + it.params.a * currentTime;

      // Área sombreada para el primer móvil
      if (currentTime > 0.05 && idx === 0) {
        ctx.beginPath();
        const pZeroStart = this.plane.worldToScreen(0, 0);
        ctx.moveTo(pZeroStart.sx, pZeroStart.sy);

        const areaSamples = Math.max(10, Math.floor((currentTime / tEnd) * samples));
        for (let i = 0; i <= areaSamples; i++) {
          const t = (i / areaSamples) * currentTime;
          const v = it.params.v0 + it.params.a * t;
          const pt = this.plane.worldToScreen(t, v);
          ctx.lineTo(pt.sx, pt.sy);
        }

        const pZeroCurr = this.plane.worldToScreen(currentTime, 0);
        ctx.lineTo(pZeroCurr.sx, pZeroCurr.sy);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, this.plane.worldToScreen(0, velX).sy, 0, pZeroCurr.sy);
        grad.addColorStop(0, `${color}35`);
        grad.addColorStop(1, `${color}05`);
        ctx.fillStyle = grad;
        ctx.fill();

        const deltaX = it.params.v0 * currentTime + 0.5 * it.params.a * currentTime * currentTime;
        const pMid = this.plane.worldToScreen(currentTime / 2, velX / 2);
        this.drawPin(pMid.sx, pMid.sy, `Área = Δx: ${formatNum(deltaX, 1)} m`, color, isDark);
      }

      // Recta completa de velocidad
      const pStart = this.plane.worldToScreen(0, it.params.v0);
      const pEnd = this.plane.worldToScreen(tEnd, it.params.v0 + it.params.a * tEnd);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Tramo recorrido sólido
      const pCurr = this.plane.worldToScreen(currentTime, velX);
      ctx.beginPath();
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pCurr.sx, pCurr.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: v = ${formatNum(velX, 1)} m/s`,
        color,
        isDark
      );
    });
  }

  // MRUA: ACELERACIÓN VS TIEMPO (a vs t) para múltiples móviles
  private drawMRUAAccelerationVsTime(
    items: MRUAItem[],
    currentTime: number,
    maxTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const tEnd = Math.max(2, maxTime * 1.05);

    items.forEach((it, idx) => {
      const color = it.color || '#f59e0b';
      const accX = it.params.a;

      // Área sombreada bajo aceleración para el primer móvil
      if (currentTime > 0.05 && Math.abs(accX) > 0.01 && idx === 0) {
        const pStart = this.plane.worldToScreen(0, accX);
        const pCurr = this.plane.worldToScreen(currentTime, accX);
        const pZeroStart = this.plane.worldToScreen(0, 0);
        const pZeroCurr = this.plane.worldToScreen(currentTime, 0);

        ctx.beginPath();
        ctx.moveTo(pZeroStart.sx, pZeroStart.sy);
        ctx.lineTo(pStart.sx, pStart.sy);
        ctx.lineTo(pCurr.sx, pCurr.sy);
        ctx.lineTo(pZeroCurr.sx, pZeroCurr.sy);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, pStart.sy, 0, pZeroStart.sy);
        grad.addColorStop(0, `${color}35`);
        grad.addColorStop(1, `${color}08`);
        ctx.fillStyle = grad;
        ctx.fill();

        const pMid = this.plane.worldToScreen(currentTime / 2, accX / 2);
        this.drawPin(pMid.sx, pMid.sy, `Área = Δv: ${formatNum(accX * currentTime)} m/s`, color, isDark);
      }

      // Línea horizontal completa
      const pStart = this.plane.worldToScreen(0, accX);
      const pEnd = this.plane.worldToScreen(tEnd, accX);
      ctx.beginPath();
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      const pCurr = this.plane.worldToScreen(currentTime, accX);
      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: a = ${formatNum(accX, 1)} m/s²`,
        color,
        isDark
      );
    });
  }

  // TIRO PARABÓLICO: DISTANCIA / ALTURA VS TIEMPO (x, y vs t)
  private drawProjectileDistanceVsTime(
    items: ProjectileItem[],
    currentTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const samples = 120;

    items.forEach(it => {
      const params = it.params;
      const color = it.color || '#38bdf8';
      const cp = calculateProjectileCriticalPoints(params);
      const tFlight = cp.tVuelo;
      const v0x = params.v0 * Math.cos((params.angleDeg * Math.PI) / 180);
      const v0y = params.v0 * Math.sin((params.angleDeg * Math.PI) / 180);

      // Curva y(t) Altura
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * tFlight;
        const y = Math.max(0, params.y0 + v0y * t - 0.5 * params.g * t * t);
        const p = this.plane.worldToScreen(t, y);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight y(t) hasta currentTime
      const tYCurr = Math.min(currentTime, tFlight);
      const currY = Math.max(0, params.y0 + v0y * tYCurr - 0.5 * params.g * tYCurr * tYCurr);
      ctx.beginPath();
      const ySamples = Math.max(10, Math.floor((tYCurr / tFlight) * samples));
      for (let i = 0; i <= ySamples; i++) {
        const t = (i / ySamples) * tYCurr;
        const y = Math.max(0, params.y0 + v0y * t - 0.5 * params.g * t * t);
        const p = this.plane.worldToScreen(t, y);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Recta x(t) Posición Horizontal
      const currX = params.x0 + v0x * tYCurr;
      const pXStart = this.plane.worldToScreen(0, params.x0);
      const pXCurr = this.plane.worldToScreen(tYCurr, currX);
      ctx.beginPath();
      ctx.moveTo(pXStart.sx, pXStart.sy);
      ctx.lineTo(pXCurr.sx, pXCurr.sy);
      ctx.strokeStyle = `${color}bb`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Punto seguidor animado
      const pCurr = this.plane.worldToScreen(tYCurr, currY);
      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: y=${formatNum(currY, 1)}m, x=${formatNum(currX, 1)}m`,
        color,
        isDark
      );
    });
  }

  // TIRO PARABÓLICO: RAPIDEZ VS TIEMPO (v vs t)
  private drawProjectileSpeedVsTime(
    items: ProjectileItem[],
    currentTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();
    const samples = 100;

    items.forEach(it => {
      const params = it.params;
      const color = it.color || '#eab308';
      const cp = calculateProjectileCriticalPoints(params);
      const tFlight = cp.tVuelo;
      const v0x = params.v0 * Math.cos((params.angleDeg * Math.PI) / 180);
      const v0y = params.v0 * Math.sin((params.angleDeg * Math.PI) / 180);

      // Curva completa punteada
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * tFlight;
        const vy = v0y - params.g * t;
        const speed = Math.hypot(v0x, vy);
        const p = this.plane.worldToScreen(t, speed);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tramo recorrido sólido
      const tCurr = Math.min(currentTime, tFlight);
      const vyCurr = v0y - params.g * tCurr;
      const speedCurr = Math.hypot(v0x, vyCurr);
      ctx.beginPath();
      const currSamples = Math.max(10, Math.floor((tCurr / tFlight) * samples));
      for (let i = 0; i <= currSamples; i++) {
        const t = (i / currSamples) * tCurr;
        const vy = v0y - params.g * t;
        const speed = Math.hypot(v0x, vy);
        const p = this.plane.worldToScreen(t, speed);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      const pSpeedPt = this.plane.worldToScreen(tCurr, speedCurr);
      this.drawFollowerPoint(pSpeedPt.sx, pSpeedPt.sy, color);
      this.drawPin(
        pSpeedPt.sx,
        pSpeedPt.sy - 12,
        `${it.name}: |v| = ${formatNum(speedCurr, 1)} m/s`,
        color,
        isDark
      );
    });
  }

  // TIRO PARABÓLICO: ACELERACIÓN VS TIEMPO (a vs t)
  private drawProjectileAccelerationVsTime(
    items: ProjectileItem[],
    currentTime: number,
    isDark: boolean
  ): void {
    const ctx = this.plane.getContext();

    items.forEach((it, idx) => {
      const params = it.params;
      const color = it.color || '#f59e0b';
      const cp = calculateProjectileCriticalPoints(params);
      const tFlight = cp.tVuelo;
      const tEnd = Math.max(tFlight * 1.15, 6);
      const gVal = params.g;
      const tCurr = Math.min(currentTime, tFlight);

      // Área bajo la curva para el primero
      if (tCurr > 0.05 && idx === 0) {
        const pGStart = this.plane.worldToScreen(0, -gVal);
        const pZeroStart = this.plane.worldToScreen(0, 0);
        const pGCurr = this.plane.worldToScreen(tCurr, -gVal);
        const pZeroCurr = this.plane.worldToScreen(tCurr, 0);

        ctx.beginPath();
        ctx.moveTo(pZeroStart.sx, pZeroStart.sy);
        ctx.lineTo(pGStart.sx, pGStart.sy);
        ctx.lineTo(pGCurr.sx, pGCurr.sy);
        ctx.lineTo(pZeroCurr.sx, pZeroCurr.sy);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, pGStart.sy, 0, pZeroStart.sy);
        grad.addColorStop(0, `${color}35`);
        grad.addColorStop(1, `${color}06`);
        ctx.fillStyle = grad;
        ctx.fill();

        const pMid = this.plane.worldToScreen(tCurr / 2, -gVal / 2);
        this.drawPin(pMid.sx, pMid.sy, `Área = Δvy: ${formatNum(-gVal * tCurr)} m/s`, color, isDark);
      }

      // Línea horizontal ay = -g
      const pG1 = this.plane.worldToScreen(0, -gVal);
      const pG2 = this.plane.worldToScreen(tEnd, -gVal);
      ctx.beginPath();
      ctx.moveTo(pG1.sx, pG1.sy);
      ctx.lineTo(pG2.sx, pG2.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      const pCurr = this.plane.worldToScreen(tCurr, -gVal);
      this.drawFollowerPoint(pCurr.sx, pCurr.sy, color);
      this.drawPin(
        pCurr.sx,
        pCurr.sy - 12,
        `${it.name}: ay = -${formatNum(gVal, 1)} m/s²`,
        color,
        isDark
      );
    });
  }

  // Punto seguidor brillante sobre curvas
  private drawFollowerPoint(sx: number, sy: number, color: string): void {
    const ctx = this.plane.getContext();
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  // Badge en la esquina superior DERECHA (nunca tapado por la barra lateral)
  private drawGraphHeaderBadge(
    ctx: CanvasRenderingContext2D,
    mode: 'mru' | 'mrua' | 'projectile',
    graphType: MotionGraphType,
    isDark: boolean,
    items?: { name: string; color: string; visible: boolean }[]
  ): void {
    let title = '';
    let subtitle = '';
    let formula = '';
    let xLabel = '';
    let yLabel = '';

    if (mode === 'projectile') {
      title = 'Tiro Parabólico';
      if (graphType === 'x_vs_t') {
        subtitle = 'Posición vs Tiempo';
        formula = 'y(t) = y₀ + v₀ᵧ·t - ½g·t²,  x(t) = v₀ₓ·t';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Altura y, Alcance x (m)';
      } else if (graphType === 'v_vs_t') {
        subtitle = 'Rapidez vs Tiempo';
        formula = '|v(t)| = √(vₓ² + vᵧ(t)²),  vᵧ = v₀ᵧ - g·t';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Rapidez |v| (m/s)';
      } else if (graphType === 'a_vs_t') {
        subtitle = 'Aceleración vs Tiempo';
        formula = 'aᵧ = -g (constante),  aₓ = 0';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Aceleración a (m/s²)';
      }
    } else if (mode === 'mru') {
      title = 'MRU (v = constante)';
      if (graphType === 'x_vs_t') {
        subtitle = 'Distancia vs Tiempo';
        formula = 'x(t) = x₀ + v·t  (Pendiente m = v)';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Distancia x (m)';
      } else if (graphType === 'v_vs_t') {
        subtitle = 'Rapidez vs Tiempo';
        formula = 'v(t) = v = cte  (Área bajo la curva = Δx)';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Rapidez v (m/s)';
      }
    } else {
      title = 'MRUA (a = constante)';
      if (graphType === 'x_vs_t') {
        subtitle = 'Distancia vs Tiempo';
        formula = 'x(t) = x₀ + v₀·t + ½a·t²  (Parábola)';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Distancia x (m)';
      } else if (graphType === 'v_vs_t') {
        subtitle = 'Rapidez vs Tiempo';
        formula = 'v(t) = v₀ + a·t  (Pendiente = a, Área = Δx)';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Rapidez v (m/s)';
      } else if (graphType === 'a_vs_t') {
        subtitle = 'Aceleración vs Tiempo';
        formula = 'a(t) = a = cte  (Área bajo la curva = Δv)';
        xLabel = 'Eje Horizontal: Tiempo t (s)';
        yLabel = 'Eje Vertical: Aceleración a (m/s²)';
      }
    }

    const rect = ctx.canvas.getBoundingClientRect();
    const viewWidth = rect.width;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const titleFull = `${title} • ${subtitle}`;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const wTitle = ctx.measureText(titleFull).width;

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "SF Mono", monospace';
    const wFormula = ctx.measureText(formula).width;

    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const wXLabel = ctx.measureText(xLabel).width;
    const wYLabel = ctx.measureText(yLabel).width;

    const visibleItems = items ? items.filter(i => i.visible) : [];
    const hasMultiple = visibleItems.length > 1;

    let wTags = 0;
    if (hasMultiple) {
      ctx.font = 'bold 9px -apple-system, sans-serif';
      visibleItems.slice(0, 4).forEach(it => {
        wTags += ctx.measureText(it.name).width + 24;
      });
    }

    const contentWidth = Math.max(wTitle, wFormula, wXLabel, wYLabel, wTags);
    const bw = Math.max(320, Math.ceil(contentWidth + 32));
    const bh = hasMultiple ? 112 : 90;

    // Ubicado en la esquina SUPERIOR DERECHA, debajo de los controles superiores
    const bx = Math.max(16, viewWidth - bw - 20);
    const by = 78;

    // Sombra suave para separar del lienzo
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    // Reset de sombras para textos nítidos
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const padLeft = bx + 16;

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(titleFull, padLeft, by + 22);

    ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "SF Mono", monospace';
    ctx.fillText(formula, padLeft, by + 40);

    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(xLabel, padLeft, by + 58);
    ctx.fillText(yLabel, padLeft, by + 74);

    // Mini leyenda con los colores de los objetos visibles
    if (hasMultiple) {
      let tagX = padLeft;
      const tagY = by + 95;
      ctx.font = 'bold 9px -apple-system, sans-serif';

      visibleItems.slice(0, 4).forEach(it => {
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(tagX + 4, tagY - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
        ctx.fillText(it.name, tagX + 11, tagY);
        tagX += ctx.measureText(it.name).width + 18;
      });
    }

    ctx.restore();
  }

  // Pista física animada en la parte inferior de la pantalla con soporte para múltiples autos
  private draw1DCarTrackStrip(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    mode: 'mru' | 'mrua',
    cars: { name: string; color: string; posX: number; velX: number; accX: number }[],
    isDark: boolean
  ): void {
    if (cars.length === 0) return;

    const isMultiCar = cars.length > 1;
    const stripH = isMultiCar ? 64 : 54;
    const stripY = viewH - stripH - 12;
    const stripX = 14;
    // Margen derecho adicional para no interferir con los controles flotantes de zoom (bottom: 24px, right: 24px)
    const stripW = viewW - stripX - 82;

    ctx.save();

    // Fondo del panel de pista
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(241, 245, 249, 0.95)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(stripX, stripY, stripW, stripH, 8);
    ctx.fill();
    ctx.stroke();

    // Línea de asfalto / carretera
    const roadY = stripY + (isMultiCar ? 44 : 36);
    ctx.beginPath();
    ctx.moveTo(stripX + 16, roadY);
    ctx.lineTo(stripX + stripW - 16, roadY);
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ticks de distancia en la pista adaptables al recorrido máximo
    const minMeters = -20;
    const maxCarPos = Math.max(100, ...cars.map(c => c.posX));
    const maxMeters = Math.ceil(Math.max(100, maxCarPos * 1.1) / 20) * 20;
    const trackStartPx = stripX + 30;
    const trackEndPx = stripX + stripW - 30;

    const metersToPx = (m: number) => {
      const frac = (m - minMeters) / (maxMeters - minMeters);
      const clamped = Math.max(0, Math.min(1, frac));
      return trackStartPx + clamped * (trackEndPx - trackStartPx);
    };

    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.textAlign = 'center';

    const tickStep = maxMeters > 200 ? 50 : 20;
    for (let m = 0; m <= maxMeters; m += tickStep) {
      const px = metersToPx(m);
      ctx.beginPath();
      ctx.moveTo(px, roadY - 4);
      ctx.lineTo(px, roadY + 4);
      ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(`${m}m`, px, roadY + 14);
    }

    // Dibujar cada carro
    cars.forEach(car => {
      const carPx = metersToPx(car.posX);
      const carW = 32;
      const carH = 14;
      const carColor = car.color || '#6366f1';

      // Chasis
      ctx.fillStyle = carColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(carPx - carW / 2, roadY - carH - 2, carW, carH, 3);
      ctx.fill();
      ctx.stroke();

      // Ruedas
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(carPx - 9, roadY - 2, 3, 0, Math.PI * 2);
      ctx.arc(carPx + 9, roadY - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta del nombre encima del auto
      ctx.save();
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = carColor;
      ctx.textAlign = 'center';
      ctx.fillText(`${car.name}`, carPx, roadY - carH - 14);
      ctx.restore();

      // Vector velocidad
      if (Math.abs(car.velX) > 0.05) {
        const vLen = Math.max(-28, Math.min(28, car.velX * 1.5));
        this.drawArrow(
          ctx,
          carPx,
          roadY - carH - 6,
          carPx + vLen,
          roadY - carH - 6,
          carColor,
          1.8,
          `v: ${formatNum(car.velX)} m/s`
        );
      }

      // Vector aceleración si es MRUA
      if (mode === 'mrua' && Math.abs(car.accX) > 0.05) {
        const aLen = Math.max(-24, Math.min(24, car.accX * 2.2));
        this.drawArrow(
          ctx,
          carPx,
          roadY - carH - 24,
          carPx + aLen,
          roadY - carH - 24,
          '#f59e0b',
          1.4,
          `a: ${formatNum(car.accX)}`
        );
      }
    });

    // Etiqueta de la pista
    ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    if (isMultiCar) {
      ctx.fillText(`Móviles en Pista (${cars.length})`, stripX + 16, stripY + 16);
    } else {
      ctx.fillText(`Móvil en Vivo: x = ${formatNum(cars[0].posX)} m`, stripX + 16, stripY + 16);
    }

    ctx.restore();
  }
}

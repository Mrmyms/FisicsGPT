import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, Crosshair, Menu } from 'lucide-react';
import { CartesianPlane } from '../canvas/CartesianPlane';
import { VectorRenderer } from '../canvas/VectorRenderer';
import { KinematicsRenderer } from '../canvas/KinematicsRenderer';
import type { Vector2D, VectorOperation } from '../types/vectors';
import type {
  ProjectileParams,
  ProjectileItem,
  MRUParams,
  MRUItem,
  MRUAParams,
  MRUAItem,
  MotionGraphType
} from '../types/kinematics';
import type { ActiveModule } from './Navbar';
import { formatNum } from '../math/vectorMath';

interface CanvasViewportProps {
  activeModule: ActiveModule;
  motionGraphType: MotionGraphType;
  isDarkMode: boolean;
  // Estado para vectores
  vectors: Vector2D[];
  onUpdateVector: (v: Vector2D) => void;
  operation: VectorOperation;
  resultVector?: { x: number; y: number; magnitude: number; angleDeg: number };
  resultantDisplayMode?: 'polar' | 'cartesian';
  // Estado para cinemática (individual y listas)
  projectileParams: ProjectileParams;
  projectiles?: ProjectileItem[];
  activeProjectileId?: string;
  mruParams: MRUParams;
  mruItems?: MRUItem[];
  mruaParams: MRUAParams;
  mruaItems?: MRUAItem[];
  currentTime: number;
  maxTime?: number;
  showKinematicsVectors: boolean;
  showKinematicsComponents: boolean;
  // Control de sidebar
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  resetViewTrigger: number;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  activeModule,
  motionGraphType,
  isDarkMode,
  vectors,
  onUpdateVector,
  operation,
  resultVector,
  resultantDisplayMode = 'polar',
  projectileParams,
  projectiles = [],
  activeProjectileId,
  mruParams,
  mruItems = [],
  mruaParams,
  mruaItems = [],
  currentTime,
  maxTime = 10,
  showKinematicsVectors,
  showKinematicsComponents,
  isSidebarCollapsed,
  onToggleSidebar,
  resetViewTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<CartesianPlane | null>(null);
  const vectorRendererRef = useRef<VectorRenderer | null>(null);
  const kinematicsRendererRef = useRef<KinematicsRenderer | null>(null);

  // Estados de interacción con puntero
  const [isPanning, setIsPanning] = useState(false);
  const [draggedVectorId, setDraggedVectorId] = useState<string | null>(null);
  const [lastPointerPos, setLastPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);

  // Centrado según módulo y método de graficación
  const centerPlaneForModule = (plane: CartesianPlane) => {
    if (activeModule === 'projectile') {
      plane.centerAt(25, 12, 22);
    } else if (activeModule === 'mru' || activeModule === 'mrua') {
      if (motionGraphType === 'x_vs_t') {
        plane.centerAt(5, 20, 22);
      } else if (motionGraphType === 'a_vs_t') {
        plane.centerAt(5, 0, 32);
      } else {
        plane.centerAt(0, 20, 22);
      }
    } else {
      plane.centerAt(0, 0, 36);
    }
  };

  // Inicializar plano y renderizadores con ResizeObserver robusto
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const plane = new CartesianPlane(canvas, isDarkMode);
    plane.resize();

    centerPlaneForModule(plane);

    planeRef.current = plane;
    vectorRendererRef.current = new VectorRenderer(plane);
    kinematicsRendererRef.current = new KinematicsRenderer(plane);

    const handleResize = () => {
      if (planeRef.current) {
        planeRef.current.resize();
        redraw();
      }
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver para responder inmediatamente a cualquier cambio del contenedor (ej. sidebar abierto/cerrado)
    const resizeObserver = new ResizeObserver(() => {
      if (planeRef.current) {
        planeRef.current.resize();
        redraw();
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Redimensionar suavemente tras la transición CSS del sidebar (0.25s)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (planeRef.current) {
        planeRef.current.resize();
        redraw();
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  // Actualizar modo oscuro
  useEffect(() => {
    if (planeRef.current) {
      planeRef.current.isDarkMode = isDarkMode;
      redraw();
    }
  }, [isDarkMode]);

  // Manejar trigger de reinicio de vista
  useEffect(() => {
    if (!planeRef.current) return;
    centerPlaneForModule(planeRef.current);
    redraw();
  }, [resetViewTrigger, activeModule, motionGraphType]);

  // Función principal de redibujado a 60 FPS
  const redraw = useCallback(() => {
    const plane = planeRef.current;
    if (!plane) return;

    // 1. Rejilla cartesiana Desmos
    plane.drawGrid();

    // 2. Contenido según módulo
    if (activeModule === 'vectors') {
      const vr = vectorRendererRef.current;
      if (!vr) return;

      const visibleVectors = vectors.filter(v => v.visible);

      // Si la operación es suma y hay al menos 2 vectores
      if (operation === 'sum' && visibleVectors.length >= 2 && resultVector) {
        const rName = resultantDisplayMode === 'polar'
          ? `R: ${formatNum(resultVector.magnitude)} ∠ ${formatNum(resultVector.angleDeg)}°`
          : `R: (${formatNum(resultVector.x)}, ${formatNum(resultVector.y)})`;

        const vR: Vector2D = {
          id: 'resultant',
          name: rName,
          color: '#eab308', // Dorado
          x: resultVector.x,
          y: resultVector.y,
          originX: 0,
          originY: 0,
          visible: true,
          isResultant: true
        };

        vr.drawTipToTail(visibleVectors, vR, {
          hoveredId: hoveredVectorId,
          draggedId: draggedVectorId
        });
      } else if (operation === 'subtract' && visibleVectors.length >= 2 && resultVector) {
        // Resta A - B
        const vA = visibleVectors[0];
        const vB = visibleVectors[1];
        vr.drawVector(vA, { isHovered: vA.id === hoveredVectorId, isDragging: vA.id === draggedVectorId });
        vr.drawVector(vB, { isHovered: vB.id === hoveredVectorId, isDragging: vB.id === draggedVectorId });

        // Vector opuesto -B
        const vNegB: Vector2D = {
          ...vB,
          name: `-${vB.name}`,
          x: -vB.x,
          y: -vB.y,
          originX: vA.x,
          originY: vA.y,
          color: '#94a3b8'
        };
        vr.drawVector(vNegB, { dashed: true, lineWidth: 1.8 });

        // Vector diferencia
        const dName = resultantDisplayMode === 'polar'
          ? `D: ${formatNum(resultVector.magnitude)} ∠ ${formatNum(resultVector.angleDeg)}°`
          : `D: (${formatNum(resultVector.x)}, ${formatNum(resultVector.y)})`;

        const vDiff: Vector2D = {
          id: 'diff',
          name: dName,
          color: '#ec4899',
          x: resultVector.x,
          y: resultVector.y,
          originX: 0,
          originY: 0,
          visible: true,
          isResultant: true
        };
        vr.drawVector(vDiff);
      } else {
        // Dibujo individual normal
        vectors.forEach(v => {
          if (v.visible) {
            vr.drawVector(v, {
              isHovered: v.id === hoveredVectorId,
              isDragging: v.id === draggedVectorId
            });
          }
        });
      }
    } else if (activeModule === 'projectile') {
      const kr = kinematicsRendererRef.current;
      if (kr) {
        const pList = projectiles && projectiles.length > 0 ? projectiles : [
          { id: 'default', name: 'Tiro 1', color: '#38bdf8', visible: true, params: projectileParams }
        ];
        if (motionGraphType === 'trajectory_2d') {
          kr.drawProjectileSimulation(pList, currentTime, {
            showVectors: showKinematicsVectors,
            showComponents: showKinematicsComponents,
            showTrajectoryTrace: true,
            showCriticalPoints: true
          }, activeProjectileId);
        } else {
          kr.drawMotionGraph('projectile', motionGraphType, mruItems, mruaItems, currentTime, maxTime, pList);
        }
      }
    } else if (activeModule === 'mru') {
      const kr = kinematicsRendererRef.current;
      if (kr) {
        const mList = mruItems && mruItems.length > 0 ? mruItems : [
          { id: 'default', name: 'Móvil 1', color: '#38bdf8', visible: true, params: mruParams }
        ];
        kr.drawMotionGraph('mru', motionGraphType, mList, [], currentTime, maxTime);
      }
    } else if (activeModule === 'mrua') {
      const kr = kinematicsRendererRef.current;
      if (kr) {
        const aList = mruaItems && mruaItems.length > 0 ? mruaItems : [
          { id: 'default', name: 'Móvil 1', color: '#38bdf8', visible: true, params: mruaParams }
        ];
        kr.drawMotionGraph('mrua', motionGraphType, [], aList, currentTime, maxTime);
      }
    }
  }, [
    activeModule,
    motionGraphType,
    vectors,
    operation,
    resultVector,
    resultantDisplayMode,
    projectileParams,
    projectiles,
    activeProjectileId,
    mruParams,
    mruItems,
    mruaParams,
    mruaItems,
    currentTime,
    maxTime,
    showKinematicsVectors,
    showKinematicsComponents,
    hoveredVectorId,
    draggedVectorId
  ]);

  // Re-dibujar ante cualquier cambio de estado
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Manejo de puntero (Ratón y Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !planeRef.current) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    setLastPointerPos({ x: screenX, y: screenY });

    // Si estamos en módulo de vectores, probar hitTest sobre extremos de vectores
    if (activeModule === 'vectors' && vectorRendererRef.current) {
      const hit = vectorRendererRef.current.hitTest(screenX, screenY, vectors);
      if (hit && hit.isTip) {
        setDraggedVectorId(hit.vector.id);
        return;
      }
    }

    // Si no golpeó ningún vector, iniciar paneo
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas || !plane) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (draggedVectorId) {
      // Arrastrando extremo de vector
      const targetVec = vectors.find(v => v.id === draggedVectorId);
      if (targetVec) {
        const originX = targetVec.originX || 0;
        const originY = targetVec.originY || 0;
        const worldPos = plane.screenToWorld(screenX, screenY);
        const newX = Number((worldPos.wx - originX).toFixed(2));
        const newY = Number((worldPos.wy - originY).toFixed(2));

        onUpdateVector({
          ...targetVec,
          x: newX,
          y: newY
        });
      }
    } else if (isPanning) {
      // Paneo del plano
      const dx = screenX - lastPointerPos.x;
      const dy = screenY - lastPointerPos.y;
      plane.pan(dx, dy);
      setLastPointerPos({ x: screenX, y: screenY });
      redraw();
    } else if (activeModule === 'vectors' && vectorRendererRef.current) {
      // Hover test para cambiar cursor y efecto glow
      const hit = vectorRendererRef.current.hitTest(screenX, screenY, vectors);
      if (hit && hit.isTip) {
        setHoveredVectorId(hit.vector.id);
        canvas.style.cursor = 'grab';
      } else {
        setHoveredVectorId(null);
        canvas.style.cursor = 'default';
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignorar si ya se soltó
      }
    }
    setIsPanning(false);
    setDraggedVectorId(null);
  };

  // Zoom suave con rueda del ratón
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas || !plane) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    plane.zoomAt(screenX, screenY, zoomFactor);
    redraw();
  };

  // Controles de zoom con botones
  const handleZoom = (factor: number) => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas || !plane) return;

    const rect = canvas.getBoundingClientRect();
    plane.zoomAt(rect.width / 2, rect.height / 2, factor);
    redraw();
  };

  const handleCenter = () => {
    if (!planeRef.current) return;
    if (activeModule === 'projectile') {
      planeRef.current.centerAt(25, 12, 22);
    } else {
      planeRef.current.centerAt(0, 0, 36);
    }
    redraw();
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas-element"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Botón flotante para abrir sidebar si está colapsado */}
      {isSidebarCollapsed && (
        <button
          className="floating-toggle-sidebar"
          onClick={onToggleSidebar}
          title="Abrir panel de control"
        >
          <Menu size={18} />
          <span>Panel de Expresiones</span>
        </button>
      )}

      {/* Controles Flotantes de Navegación Cartesiana (Zoom, Centrado) */}
      <div className="floating-controls">
        <button className="btn-icon" onClick={() => handleZoom(1.2)} title="Acercar (Zoom +)">
          <ZoomIn size={18} />
        </button>
        <button className="btn-icon" onClick={() => handleZoom(0.8)} title="Alejar (Zoom -)">
          <ZoomOut size={18} />
        </button>
        <button className="btn-icon" onClick={handleCenter} title="Centrar en el Origen">
          <Crosshair size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={() => {
            if (activeModule === 'projectile') {
              planeRef.current?.fitBounds(0, 0, 60, 30);
              redraw();
            } else {
              planeRef.current?.centerAt(0, 0, 36);
              redraw();
            }
          }}
          title="Ajustar vista al contenido"
        >
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
};

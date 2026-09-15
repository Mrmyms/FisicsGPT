import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Sliders, BookOpen, GraduationCap } from 'lucide-react';
import { Navbar, type ActiveModule } from './components/Navbar';
import { CanvasViewport } from './components/CanvasViewport';
import { VectorInputCard } from './components/vectors/VectorInputCard';
import { VectorOperations } from './components/vectors/VectorOperations';
import { ResultantCard } from './components/vectors/ResultantCard';
import { VectorSteps } from './components/vectors/VectorSteps';
import { KinematicsControls } from './components/kinematics/KinematicsControls';
import { CriticalPointsCard } from './components/kinematics/CriticalPointsCard';
import { TimelineControls } from './components/kinematics/TimelineControls';
import { KinematicsSteps } from './components/kinematics/KinematicsSteps';
import { MRUControls } from './components/kinematics/MRUControls';
import { MRUAControls } from './components/kinematics/MRUAControls';
import { TheoryGuide } from './components/TheoryGuide';

import type { Vector2D, VectorOperation } from './types/vectors';
import type {
  ProjectileParams,
  ProjectileItem,
  MRUParams,
  MRUItem,
  MRUAParams,
  MRUAItem,
  MotionGraphType
} from './types/kinematics';
import { KINEMATICS_PALETTE } from './types/kinematics';
import { calculateVectorOperation } from './math/vectorMath';
import {
  calculateProjectileCriticalPoints,
  getProjectilePointAtTime,
  generateProjectileSteps,
  generateMRUSteps,
  generateMRUASteps,
  getMRUTelemetry,
  getMRUATelemetry
} from './math/kinematicsMath';

const INITIAL_VECTORS: Vector2D[] = [
  {
    id: 'vec-1',
    name: 'A',
    color: '#38bdf8', // Celeste
    x: 8,
    y: 6,
    originX: 0,
    originY: 0,
    visible: true,
    showComponents: true,
    showAngle: true
  },
  {
    id: 'vec-2',
    name: 'B',
    color: '#f43f5e', // Rosa
    x: 4,
    y: 9,
    originX: 0,
    originY: 0,
    visible: true,
    showComponents: true,
    showAngle: false
  }
];

const INITIAL_PROJECTILES: ProjectileItem[] = [
  {
    id: 'p-1',
    name: 'Tiro 1',
    color: '#38bdf8', // Cian
    visible: true,
    params: {
      x0: 0,
      y0: 0,
      v0: 25,
      angleDeg: 45,
      g: 9.81
    }
  }
];

const INITIAL_MRU_ITEMS: MRUItem[] = [
  {
    id: 'm-1',
    name: 'Móvil A',
    color: '#38bdf8', // Cian
    visible: true,
    params: { x0: 0, v: 8 }
  }
];

const INITIAL_MRUA_ITEMS: MRUAItem[] = [
  {
    id: 'a-1',
    name: 'Móvil A',
    color: '#38bdf8', // Cian
    visible: true,
    params: { x0: 0, v0: 2, a: 1.5 }
  }
];

export function App() {
  // Configuración general y UI
  const [activeModule, setActiveModule] = useState<ActiveModule>('vectors');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'inputs' | 'steps' | 'theory'>('inputs');
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Módulo de Vectores
  const [vectors, setVectors] = useState<Vector2D[]>(INITIAL_VECTORS);
  const [vectorOp, setVectorOp] = useState<VectorOperation>('sum');
  const [resultantDisplayMode, setResultantDisplayMode] = useState<'polar' | 'cartesian'>('polar');

  // Módulo de Tiro Parabólico (Múltiples tiros)
  const [projectiles, setProjectiles] = useState<ProjectileItem[]>(INITIAL_PROJECTILES);
  const [activeProjectileId, setActiveProjectileId] = useState<string>('p-1');
  const activeProjectile = projectiles.find(p => p.id === activeProjectileId) || projectiles[0] || INITIAL_PROJECTILES[0];
  const projectileParams = activeProjectile.params;

  const [showKinematicsVectors, setShowKinematicsVectors] = useState(true);
  const [showKinematicsComponents, setShowKinematicsComponents] = useState(true);

  // Métodos de graficación independientes por módulo
  const [projectileGraphType, setProjectileGraphType] = useState<MotionGraphType>('trajectory_2d');
  const [mruGraphType, setMruGraphType] = useState<MotionGraphType>('x_vs_t');
  const [mruaGraphType, setMruaGraphType] = useState<MotionGraphType>('x_vs_t');

  // Módulo MRU (Múltiples móviles)
  const [mruItems, setMruItems] = useState<MRUItem[]>(INITIAL_MRU_ITEMS);
  const [activeMruId, setActiveMruId] = useState<string>('m-1');
  const activeMru = mruItems.find(m => m.id === activeMruId) || mruItems[0] || INITIAL_MRU_ITEMS[0];
  const mruParams = activeMru.params;

  // Módulo MRUA (Múltiples móviles acelerados)
  const [mruaItems, setMruaItems] = useState<MRUAItem[]>(INITIAL_MRUA_ITEMS);
  const [activeMruaId, setActiveMruaId] = useState<string>('a-1');
  const activeMrua = mruaItems.find(a => a.id === activeMruaId) || mruaItems[0] || INITIAL_MRUA_ITEMS[0];
  const mruaParams = activeMrua.params;

  // Duraciones de simulación personalizables por módulo (segundos)
  const [simulationDurations, setSimulationDurations] = useState<{
    projectile: number | null;
    mru: number;
    mrua: number;
  }>({
    projectile: null,
    mru: 10,
    mrua: 10,
  });

  // Handlers para Tiro Parabólico
  const handleUpdateProjectileParams = (newParams: ProjectileParams) => {
    setProjectiles(prev => prev.map(p => p.id === activeProjectile.id ? { ...p, params: newParams } : p));
  };

  const handleAddProjectile = () => {
    const nextIdx = projectiles.length;
    const color = KINEMATICS_PALETTE[nextIdx % KINEMATICS_PALETTE.length];
    const newId = `p-${Date.now()}`;
    const newAngle = (30 + (nextIdx * 15)) % 90;
    const newP: ProjectileItem = {
      id: newId,
      name: `Tiro ${nextIdx + 1}`,
      color,
      visible: true,
      params: { ...activeProjectile.params, angleDeg: newAngle > 0 ? newAngle : 45 }
    };
    setProjectiles(prev => [...prev, newP]);
    setActiveProjectileId(newId);
  };

  const handleDeleteProjectile = (id: string) => {
    if (projectiles.length <= 1) return;
    setProjectiles(prev => prev.filter(p => p.id !== id));
    if (activeProjectileId === id) {
      const remaining = projectiles.filter(p => p.id !== id);
      setActiveProjectileId(remaining[0].id);
    }
  };

  const handleToggleProjectileVisibility = (id: string) => {
    setProjectiles(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  };

  // Handlers para MRU
  const handleUpdateMruParams = (newParams: MRUParams) => {
    setMruItems(prev => prev.map(m => m.id === activeMru.id ? { ...m, params: newParams } : m));
  };

  const handleAddMru = () => {
    const nextIdx = mruItems.length;
    const color = KINEMATICS_PALETTE[nextIdx % KINEMATICS_PALETTE.length];
    const newId = `m-${Date.now()}`;
    const newM: MRUItem = {
      id: newId,
      name: `Móvil ${String.fromCharCode(65 + nextIdx)}`,
      color,
      visible: true,
      params: { x0: 15 * nextIdx, v: Math.max(3, 10 - nextIdx * 3) }
    };
    setMruItems(prev => [...prev, newM]);
    setActiveMruId(newId);
  };

  const handleDeleteMru = (id: string) => {
    if (mruItems.length <= 1) return;
    setMruItems(prev => prev.filter(m => m.id !== id));
    if (activeMruId === id) {
      const remaining = mruItems.filter(m => m.id !== id);
      setActiveMruId(remaining[0].id);
    }
  };

  const handleToggleMruVisibility = (id: string) => {
    setMruItems(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  };

  // Handlers para MRUA
  const handleUpdateMruaParams = (newParams: MRUAParams) => {
    setMruaItems(prev => prev.map(a => a.id === activeMrua.id ? { ...a, params: newParams } : a));
  };

  const handleAddMrua = () => {
    const nextIdx = mruaItems.length;
    const color = KINEMATICS_PALETTE[nextIdx % KINEMATICS_PALETTE.length];
    const newId = `a-${Date.now()}`;
    const newA: MRUAItem = {
      id: newId,
      name: `Móvil ${String.fromCharCode(65 + nextIdx)}`,
      color,
      visible: true,
      params: { x0: 0, v0: nextIdx * 4, a: 1 + nextIdx * 0.8 }
    };
    setMruaItems(prev => [...prev, newA]);
    setActiveMruaId(newId);
  };

  const handleDeleteMrua = (id: string) => {
    if (mruaItems.length <= 1) return;
    setMruaItems(prev => prev.filter(a => a.id !== id));
    if (activeMruaId === id) {
      const remaining = mruaItems.filter(a => a.id !== id);
      setActiveMruaId(remaining[0].id);
    }
  };

  const handleToggleMruaVisibility = (id: string) => {
    setMruaItems(prev => prev.map(a => a.id === id ? { ...a, visible: !a.visible } : a));
  };

  const activeMotionGraphType: MotionGraphType = useMemo(() => {
    if (activeModule === 'projectile') return projectileGraphType;
    if (activeModule === 'mru') return mruGraphType;
    if (activeModule === 'mrua') return mruaGraphType;
    return 'x_vs_t';
  }, [activeModule, projectileGraphType, mruGraphType, mruaGraphType]);

  // Simulación temporal y animación a 60 FPS
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Sincronizar tema con elemento HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Cálculos vectoriales analíticos y pasos KaTeX
  const vectorCalcResult = useMemo(() => {
    return calculateVectorOperation(vectors, vectorOp);
  }, [vectors, vectorOp]);

  // Cálculos cinemáticos analíticos y puntos notables del proyectil activo
  const projectileCriticalPoints = useMemo(() => {
    return calculateProjectileCriticalPoints(projectileParams);
  }, [projectileParams]);

  // Tiempo máximo de simulación sincronizado y editable
  const maxSimulationTime = useMemo(() => {
    if (activeModule === 'projectile') {
      if (simulationDurations.projectile !== null && simulationDurations.projectile > 0) {
        return simulationDurations.projectile;
      }
      const visible = projectiles.filter(p => p.visible);
      if (visible.length === 0) return 5;
      const maxFlight = Math.max(...visible.map(p => calculateProjectileCriticalPoints(p.params).tVuelo));
      return Math.max(0.1, maxFlight);
    }
    if (activeModule === 'mru') {
      return simulationDurations.mru || 10;
    }
    if (activeModule === 'mrua') {
      return simulationDurations.mrua || 10;
    }
    return 10;
  }, [activeModule, projectiles, simulationDurations]);

  const handleChangeMaxSimulationTime = (newTime: number) => {
    const clampedTime = Math.max(0.5, Math.min(120, newTime));
    setSimulationDurations(prev => ({
      ...prev,
      [activeModule]: clampedTime
    }));
    setCurrentTime(prev => Math.min(prev, clampedTime));
  };

  const projectileTelemetry = useMemo(() => {
    return getProjectilePointAtTime(projectileParams, currentTime);
  }, [projectileParams, currentTime]);

  const motionTelemetry = useMemo(() => {
    if (activeModule === 'mru') {
      return getMRUTelemetry(mruParams, currentTime);
    }
    if (activeModule === 'mrua') {
      return getMRUATelemetry(mruaParams, currentTime);
    }
    return undefined;
  }, [activeModule, mruParams, mruaParams, currentTime]);

  const kinematicsSteps = useMemo(() => {
    if (activeModule === 'projectile') {
      return generateProjectileSteps(projectileParams, currentTime);
    }
    if (activeModule === 'mru') {
      return generateMRUSteps(mruParams, currentTime, mruGraphType);
    }
    return generateMRUASteps(mruaParams, currentTime, mruaGraphType);
  }, [activeModule, projectileParams, mruParams, mruaParams, currentTime, mruGraphType, mruaGraphType]);

  // Loop de simulación continua fluida
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec * playbackSpeed;
        if (next >= maxSimulationTime) {
          return 0; // Reinicio cíclico suave
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, maxSimulationTime]);

  // Atajo de teclado: Barra espaciadora para Play / Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers para vectores
  const handleUpdateVector = (updated: Vector2D) => {
    setVectors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleDeleteVector = (id: string) => {
    setVectors((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddVector = () => {
    const names = ['C', 'D', 'E', 'F', 'G', 'H', 'U', 'V'];
    const usedNames = new Set(vectors.map((v) => v.name));
    const nextName = names.find((n) => !usedNames.has(n)) || `V_${vectors.length + 1}`;
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'];
    const nextColor = colors[vectors.length % colors.length];

    const newVec: Vector2D = {
      id: `vec-${Date.now()}`,
      name: nextName,
      color: nextColor,
      x: 5,
      y: 5,
      originX: 0,
      originY: 0,
      visible: true,
      showComponents: false,
      showAngle: true
    };
    setVectors([...vectors, newVec]);
  };

  return (
    <div className="app-container">
      <Navbar
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onResetView={() => setResetViewTrigger((t) => t + 1)}
      />

      <div className="main-workspace">
        {/* Barra Lateral estilo Desmos */}
        <aside className={`desmos-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab-btn ${sidebarTab === 'inputs' ? 'active' : ''}`}
                onClick={() => setSidebarTab('inputs')}
                title="Configuración de variables y parámetros"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <Sliders size={14} />
                  <span>Parámetros</span>
                </div>
              </button>

              <button
                className={`sidebar-tab-btn ${sidebarTab === 'steps' ? 'active' : ''}`}
                onClick={() => setSidebarTab('steps')}
                title="Procedimiento y cálculo analítico paso a paso"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <BookOpen size={14} />
                  <span>Cálculos</span>
                </div>
              </button>

              <button
                className={`sidebar-tab-btn ${sidebarTab === 'theory' ? 'active' : ''}`}
                onClick={() => setSidebarTab('theory')}
                title="Explicación teórica: qué es, para qué sirve y fórmulas"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <GraduationCap size={15} />
                  <span>Conceptos</span>
                </div>
              </button>
            </div>

            <button
              className="btn-card-action"
              onClick={() => setIsSidebarCollapsed(true)}
              title="Colapsar panel"
              style={{ marginLeft: '8px' }}
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="sidebar-content">
            {sidebarTab === 'theory' ? (
              <TheoryGuide
                activeModule={activeModule}
                onNavigateModule={(mod) => {
                  setActiveModule(mod);
                  setSidebarTab('inputs');
                }}
              />
            ) : (
              <>
                {activeModule === 'vectors' && (
                  <>
                    {sidebarTab === 'inputs' ? (
                  <>
                    <VectorOperations
                      operation={vectorOp}
                      onSelectOperation={setVectorOp}
                    />

                    <ResultantCard
                      operation={vectorOp}
                      resultVector={vectorCalcResult.resultVector}
                      displayMode={resultantDisplayMode}
                      onToggleDisplayMode={() => setResultantDisplayMode((prev) => (prev === 'polar' ? 'cartesian' : 'polar'))}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span className="input-label">Lista de Vectores ({vectors.length})</span>
                      <button
                        className="pill-btn"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={handleAddVector}
                      >
                        <Plus size={14} />
                        <span>Añadir Vector</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {vectors.map((vec) => (
                        <VectorInputCard
                          key={vec.id}
                          vector={vec}
                          onUpdate={handleUpdateVector}
                          onDelete={handleDeleteVector}
                          canDelete={vectors.length > 1}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <VectorSteps calcResult={vectorCalcResult} />
                )}
              </>
            )}

            {activeModule === 'projectile' && (
              <>
                {sidebarTab === 'inputs' ? (
                  <>
                    <CriticalPointsCard
                      criticalPoints={projectileCriticalPoints}
                      projectileName={activeProjectile.name}
                      projectileColor={activeProjectile.color}
                    />

                    <KinematicsControls
                      params={projectileParams}
                      onChangeParams={(newP) => {
                        handleUpdateProjectileParams(newP);
                        setCurrentTime(0);
                      }}
                      graphType={projectileGraphType}
                      onSelectGraphType={setProjectileGraphType}
                      showVectors={showKinematicsVectors}
                      onToggleVectors={() => setShowKinematicsVectors(!showKinematicsVectors)}
                      showComponents={showKinematicsComponents}
                      onToggleComponents={() => setShowKinematicsComponents(!showKinematicsComponents)}
                      projectiles={projectiles}
                      activeProjectileId={activeProjectileId}
                      onSelectProjectile={setActiveProjectileId}
                      onAddProjectile={handleAddProjectile}
                      onDeleteProjectile={handleDeleteProjectile}
                      onToggleProjectileVisibility={handleToggleProjectileVisibility}
                    />
                  </>
                ) : (
                  <KinematicsSteps steps={kinematicsSteps} />
                )}
              </>
            )}

            {activeModule === 'mru' && (
              <>
                {sidebarTab === 'inputs' ? (
                  <MRUControls
                    params={mruParams}
                    onChangeParams={handleUpdateMruParams}
                    graphType={mruGraphType}
                    onSelectGraphType={setMruGraphType}
                    currentTime={currentTime}
                    onSeekTime={(t) => setCurrentTime(t)}
                    mruItems={mruItems}
                    activeMruId={activeMruId}
                    onSelectMru={setActiveMruId}
                    onAddMru={handleAddMru}
                    onDeleteMru={handleDeleteMru}
                    onToggleMruVisibility={handleToggleMruVisibility}
                  />
                ) : (
                  <KinematicsSteps steps={kinematicsSteps} />
                )}
              </>
            )}

            {activeModule === 'mrua' && (
              <>
                {sidebarTab === 'inputs' ? (
                  <MRUAControls
                    params={mruaParams}
                    onChangeParams={handleUpdateMruaParams}
                    graphType={mruaGraphType}
                    onSelectGraphType={setMruaGraphType}
                    currentTime={currentTime}
                    onSeekTime={(t) => setCurrentTime(t)}
                    mruaItems={mruaItems}
                    activeMruaId={activeMruaId}
                    onSelectMrua={setActiveMruaId}
                    onAddMrua={handleAddMrua}
                    onDeleteMrua={handleDeleteMrua}
                    onToggleMruaVisibility={handleToggleMruaVisibility}
                  />
                ) : (
                  <KinematicsSteps steps={kinematicsSteps} />
                )}
              </>
            )}
              </>
            )}
          </div>
        </aside>

        {/* Viewport Principal de Canvas */}
        <CanvasViewport
          activeModule={activeModule}
          motionGraphType={activeMotionGraphType}
          isDarkMode={isDarkMode}
          vectors={vectors}
          onUpdateVector={handleUpdateVector}
          operation={vectorOp}
          resultVector={vectorCalcResult.resultVector}
          resultantDisplayMode={resultantDisplayMode}
          projectileParams={projectileParams}
          projectiles={projectiles}
          activeProjectileId={activeProjectileId}
          mruParams={mruParams}
          mruItems={mruItems}
          mruaParams={mruaParams}
          mruaItems={mruaItems}
          currentTime={currentTime}
          maxTime={maxSimulationTime}
          showKinematicsVectors={showKinematicsVectors}
          showKinematicsComponents={showKinematicsComponents}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
          resetViewTrigger={resetViewTrigger}
        />

        {/* Botón flotante para expandir sidebar cuando está cerrado */}
        {isSidebarCollapsed && (
          <button
            className="btn-icon"
            style={{ position: 'absolute', top: 18, left: 18, zIndex: 35 }}
            onClick={() => setIsSidebarCollapsed(false)}
            title="Expandir panel"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Barra de Tiempo Flotante para Cinemática */}
        {(activeModule === 'projectile' || activeModule === 'mru' || activeModule === 'mrua') && (
          <TimelineControls
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onReset={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            currentTime={currentTime}
            maxTime={maxSimulationTime}
            onChangeMaxTime={handleChangeMaxSimulationTime}
            onSeek={(t) => setCurrentTime(t)}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={(s) => setPlaybackSpeed(s)}
            mode={activeModule === 'projectile' ? 'projectile' : activeModule === 'mru' ? 'mru' : 'mrua'}
            telemetry={projectileTelemetry}
            motionTelemetry={motionTelemetry}
          />
        )}
      </div>
    </div>
  );
}

export default App;

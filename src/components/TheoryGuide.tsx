import React, { useState, useEffect } from 'react';
import { Compass, Rocket, Activity, Zap, Lightbulb, BookOpen, CheckCircle2, Globe, Sparkles, HelpCircle } from 'lucide-react';
import type { ActiveModule } from './Navbar';
import { Latex } from './Latex';

interface TheoryGuideProps {
  activeModule: ActiveModule;
  onNavigateModule?: (module: ActiveModule) => void;
}

interface TopicData {
  id: ActiveModule;
  title: string;
  tagline: string;
  color: string;
  badgeBg: string;
  icon: React.ElementType;
  whatIsIt: {
    summary: string;
    details: string[];
  };
  whatIsItFor: {
    intro: string;
    examples: { title: string; desc: string }[];
  };
  keyFormulas: {
    title: string;
    formula: string;
    desc: string;
  }[];
  variablesGlossary: {
    symbol: string;
    name: string;
    unit: string;
    meaning: string;
  }[];
  graphTips: {
    graph: string;
    meaning: string;
  }[];
  didYouKnow: string;
}

const TOPICS: Record<ActiveModule, TopicData> = {
  vectors: {
    id: 'vectors',
    title: 'Vectores en 2D',
    tagline: 'Magnitudes con magnitud, dirección y sentido en el plano',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    icon: Compass,
    whatIsIt: {
      summary:
        'Un vector es una entidad matemática y física que describe magnitudes que no pueden expresarse únicamente con un número (como la masa o la temperatura). Requiere de magnitud (qué tan grande es), dirección (hacia qué ángulo apunta) y sentido.',
      details: [
        'Diferencia con los escalares: Una masa de 5 kg es un escalar (no tiene dirección). Una fuerza de 5 N empujando hacia el este es un vector.',
        'Componentes rectangulares: Cualquier vector en 2D se descompone en dos ejes ortogonales: horizontal (X) y vertical (Y).',
        'Suma vectorial: Si aplicas dos fuerzas a un objeto, el resultado no es la suma aritmética simple, sino la resultante geométrica (regla del paralelogramo o cola con punta).'
      ]
    },
    whatIsItFor: {
      intro: 'Los vectores son el lenguaje universal de la física, la ingeniería y los gráficos por computadora:',
      examples: [
        {
          title: 'Navegación Aérea y Marítima',
          desc: 'Un avión vuela hacia el norte a 800 km/h, pero un viento cruzado sopla del este a 100 km/h. La suma vectorial determina la velocidad y rumbo real sobre el suelo.'
        },
        {
          title: 'Ingeniería Civil y Estructuras',
          desc: 'Para calcular las tensiones en los cables de un puente colgante o vigas de un edificio, los ingenieros suman vectores de fuerzas para asegurar el equilibrio estático (ΣF = 0).'
        },
        {
          title: 'Videojuegos y Gráficos 3D',
          desc: 'Los motores físicos (Unreal, Unity) usan vectores para calcular la velocidad de personajes, trayectorias de balas, reflejos de luz y detección de colisiones.'
        }
      ]
    },
    keyFormulas: [
      {
        title: 'Módulo o Magnitud (Pitágoras)',
        formula: '|\\vec{A}| = \\sqrt{A_x^2 + A_y^2}',
        desc: 'Calcula la longitud física total del vector a partir de sus componentes rectangulares.'
      },
      {
        title: 'Ángulo o Dirección',
        formula: '\\theta = \\arctan\\left(\\frac{A_y}{A_x}\\right)',
        desc: 'Ángulo medido en sentido antihorario respecto al eje horizontal positivo (+X).'
      },
      {
        title: 'Componentes Cartesiana a partir de Polares',
        formula: 'A_x = |\\vec{A}|\\cos\\theta, \\quad A_y = |\\vec{A}|\\sin\\theta',
        desc: 'Proyección del vector sobre los ejes cartesianos coordenados.'
      },
      {
        title: 'Suma Vectorial Analítica',
        formula: '\\vec{R} = \\vec{A} + \\vec{B} = (A_x + B_x)\\hat{i} + (A_y + B_y)\\hat{j}',
        desc: 'Para sumar vectores, se suman directamente sus componentes horizontales y verticales.'
      }
    ],
    variablesGlossary: [
      { symbol: '\\vec{A}', name: 'Vector', unit: 'N, m/s, m, etc.', meaning: 'Entidad con magnitud y orientación espacial.' },
      { symbol: 'A_x, A_y', name: 'Componentes', unit: 'mismas que |A|', meaning: 'Proyecciones sobre los ejes X e Y.' },
      { symbol: '|\\vec{A}|', name: 'Magnitud / Módulo', unit: 'Número positivo', meaning: 'Longitud o tamaño del vector.' },
      { symbol: '\\theta', name: 'Ángulo de dirección', unit: 'grados (°)', meaning: 'Inclinación angular respecto al eje +X.' }
    ],
    graphTips: [
      {
        graph: 'Método de la Cabeza con Cola (Head-to-Tail)',
        meaning: 'Colocar la base del segundo vector en la punta del primero; el vector resultante va desde el origen inicial hasta la punta final.'
      },
      {
        graph: 'Componentes Punteadas',
        meaning: 'Forman un triángulo rectángulo con el vector como hipotenusa, demostrando visualmente el Teorema de Pitágoras.'
      }
    ],
    didYouKnow:
      'La palabra "vector" proviene del latín vehere, que significa "el que transporta o lleva". Fue introducido por William Rowan Hamilton en 1843 al desarrollar los cuaterniones.'
  },

  mru: {
    id: 'mru',
    title: 'Movimiento Rectilíneo Uniforme (MRU)',
    tagline: 'Velocidad constante y aceleración cero en línea recta',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    icon: Activity,
    whatIsIt: {
      summary:
        'El MRU describe el movimiento más simple del universo: un cuerpo que avanza en línea recta recorriendo distancias iguales en tiempos iguales. Su velocidad permanece inalterable en el tiempo y su aceleración es estrictamente cero.',
      details: [
        'Rapidez constante: El velocímetro del vehículo marca siempre el mismo valor numérico.',
        'Dirección invariable: No hay curvas ni cambios de trayectoria, el trayecto es 100% lineal.',
        'Aceleración nula (a = 0): No existen fuerzas netas desbalanceadas actuando sobre el cuerpo (Primera Ley de Newton).'
      ]
    },
    whatIsItFor: {
      intro: 'Aunque en la vida diaria hay roces, el MRU es fundamental para modelar sistemas de transporte y telecomunicaciones:',
      examples: [
        {
          title: 'Control de Crucero en Autopistas',
          desc: 'Al fijar la velocidad del automóvil a 100 km/h en una autopista recta, el vehículo opera en régimen MRU, permitiendo calcular con precisión la hora exacta de arribo.'
        },
        {
          title: 'Cintas Transportadoras y Escaleras Mecánicas',
          desc: 'En aeropuertos y fábricas de ensamblaje, las piezas se mueven a velocidad constante fija para sincronizar los brazos robóticos.'
        },
        {
          title: 'Propagación de la Luz y Señales GPS',
          desc: 'Las ondas electromagnéticas viajan en el vacío en MRU a la velocidad de la luz (c ≈ 300,000 km/s), base de la triangulación satelital.'
        }
      ]
    },
    keyFormulas: [
      {
        title: 'Ecuación Horaria de Posición',
        formula: 'x(t) = x_0 + v \\cdot t',
        desc: 'Permite predecir la posición exacta del móvil en cualquier instante de tiempo t.'
      },
      {
        title: 'Velocidad Constante',
        formula: 'v = \\frac{\\Delta x}{\\Delta t} = \\frac{x - x_0}{t - t_0} = \\text{cte}',
        desc: 'Razón constante entre la distancia recorrida y el tiempo transcurrido.'
      },
      {
        title: 'Aceleración',
        formula: 'a = 0 \\; \\text{m/s}^2',
        desc: 'Al no haber variación de velocidad, la aceleración es nula.'
      },
      {
        title: 'Punto de Encuentro entre 2 Móviles',
        formula: 't_{\\text{encuentro}} = \\frac{x_{02} - x_{01}}{v_1 - v_2}',
        desc: 'Instante exacto en que dos vehículos que viajan a distintas velocidades se cruzan o uno alcanza al otro.'
      }
    ],
    variablesGlossary: [
      { symbol: 'x(t)', name: 'Posición final', unit: 'metros (m)', meaning: 'Lugar sobre la recta en el instante t.' },
      { symbol: 'x_0', name: 'Posición inicial', unit: 'metros (m)', meaning: 'Punto de partida en t = 0.' },
      { symbol: 'v', name: 'Velocidad constante', unit: 'm/s (o km/h)', meaning: 'Tasa de cambio de posición (con signo).' },
      { symbol: 't', name: 'Tiempo transcurrido', unit: 'segundos (s)', meaning: 'Duración de la observación.' }
    ],
    graphTips: [
      {
        graph: 'Distancia vs Tiempo (x vs t)',
        meaning: 'Es una recta cuya pendiente es la velocidad m = v. Si la recta sube, avanza hacia la derecha (+); si baja, retrocede (-); si es plana, está detenido.'
      },
      {
        graph: 'Rapidez vs Tiempo (v vs t)',
        meaning: 'Es una recta perfectamente horizontal. El área rectangular bajo la línea representa el desplazamiento total: Área = v · t = Δx.'
      }
    ],
    didYouKnow:
      'En el vacío del espacio interestelar, una nave espacial que apaga sus motores continuará viajando en MRU indefinidamente sin gastar una sola gota de combustible gracias a la inercia.'
  },

  mrua: {
    id: 'mrua',
    title: 'Movimiento Uniformemente Acelerado (MRUA)',
    tagline: 'Aceleración constante: aumentos o pérdidas continuas de velocidad',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    icon: Zap,
    whatIsIt: {
      summary:
        'El MRUA es el movimiento rectilíneo en el cual la velocidad varía a un ritmo constante en cada segundo que pasa. El móvil experimenta una aceleración uniforme distinta de cero, lo que produce desplazamientos cada vez mayores (si acelera) o menores (si frena).',
      details: [
        'Aceleración constante: Cada segundo transcurrido, la velocidad aumenta (o disminuye) exactamente en la misma cantidad.',
        'Aceleración vs Frenado: Si la velocidad y la aceleración tienen el mismo signo, el móvil acelera. Si tienen signos opuestos (ej. v > 0 y a < 0), el móvil frena.',
        'Curvatura cuadrática: La posición ya no es una línea recta, sino una parábola matemática respecto al tiempo.'
      ]
    },
    whatIsItFor: {
      intro: 'El MRUA rige casi todos los mecanismos con motores, pistones y sistemas de seguridad:',
      examples: [
        {
          title: 'Distancia de Frenado de Automóviles',
          desc: 'Los ingenieros automotrices calculan la distancia necesaria para que un vehículo frene de 100 a 0 km/h en pavimento mojado o seco para evitar colisiones.'
        },
        {
          title: 'Pistas de Despegue en Aeropuertos',
          desc: 'Un avión comercial (como un Boeing 737) necesita acelerar a ritmo constante hasta alcanzar la velocidad de sustentación (V_r ≈ 260 km/h) antes de que termine la pista.'
        },
        {
          title: 'Caída Libre Vertical',
          desc: 'Cualquier objeto soltado en el vacío cae con aceleración constante impuesta por la gravedad terrestre (g ≈ 9.8 m/s²), ganando 9.8 m/s de rapidez cada segundo.'
        }
      ]
    },
    keyFormulas: [
      {
        title: 'Ecuación Horaria de Posición',
        formula: 'x(t) = x_0 + v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2',
        desc: 'Ecuación parabólica que relaciona la posición con el cuadrado del tiempo transcurrido.'
      },
      {
        title: 'Ecuación de Velocidad',
        formula: 'v(t) = v_0 + a \\cdot t',
        desc: 'Relación lineal entre la velocidad instantánea y el tiempo transcurrido.'
      },
      {
        title: 'Ecuación de Torricelli (Sin Tiempo)',
        formula: 'v_f^2 = v_0^2 + 2a \\cdot \\Delta x',
        desc: 'Permite calcular la velocidad final o la distancia de frenado sin conocer el tiempo invertido.'
      },
      {
        title: 'Desplazamiento por Velocidad Promedio',
        formula: '\\Delta x = \\left(\\frac{v_0 + v_f}{2}\\right) t',
        desc: 'Equivalente al área del trapecio formado en la gráfica v vs t.'
      }
    ],
    variablesGlossary: [
      { symbol: 'a', name: 'Aceleración constante', unit: 'm/s²', meaning: 'Ritmo al que cambia la velocidad en cada segundo.' },
      { symbol: 'v_0', name: 'Velocidad inicial', unit: 'm/s', meaning: 'Rapidez del móvil en el instante t = 0.' },
      { symbol: 'v(t)', name: 'Velocidad instantánea', unit: 'm/s', meaning: 'Rapidez del móvil al cabo de t segundos.' },
      { symbol: '\\Delta x', name: 'Desplazamiento', unit: 'metros (m)', meaning: 'Distancia neta recorrida por el móvil.' }
    ],
    graphTips: [
      {
        graph: 'Distancia vs Tiempo (x vs t)',
        meaning: 'Es una parábola. Si a > 0 es cóncava hacia arriba (aceleración positiva). Si a < 0 es cóncava hacia abajo (frenado).'
      },
      {
        graph: 'Rapidez vs Tiempo (v vs t)',
        meaning: 'Es una recta con pendiente m = a. El área bajo la recta (triángulo o trapecio) representa el desplazamiento Δx.'
      },
      {
        graph: 'Aceleración vs Tiempo (a vs t)',
        meaning: 'Es una línea horizontal en el valor constante de a. El área bajo ella representa el cambio de velocidad Δv = a · t.'
      }
    ],
    didYouKnow:
      'Galileo Galilei descubrió la relación x ∝ t² haciendo rodar esferas de bronce por planos inclinados de madera diluyendo la gravedad, usando un reloj de agua para medir el tiempo.'
  },

  projectile: {
    id: 'projectile',
    title: 'Tiro Parabólico (Cinemática 2D)',
    tagline: 'Composición simultánea de MRU horizontal y caída libre vertical',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    icon: Rocket,
    whatIsIt: {
      summary:
        'El tiro parabólico es el movimiento bidimensional que describe un proyectil lanzado con una velocidad inicial y un ángulo de inclinación, moviéndose únicamente bajo la influencia de la gravedad terrestre (asumiendo que la resistencia del aire es despreciable).',
      details: [
        'Principio de Independencia de Galileo: El movimiento horizontal y el movimiento vertical ocurren simultáneamente pero no se afectan entre sí.',
        'Eje X (Horizontal): Se comporta como un MRU perfecto a velocidad constante (vx = v0 · cos θ) porque no hay gravedad horizontal.',
        'Eje Y (Vertical): Se comporta como un MRUA con aceleración hacia abajo (ay = -g), frenando en la subida y acelerando en la bajada.'
      ]
    },
    whatIsItFor: {
      intro: 'El tiro parabólico es la base de la balística, la astronáutica y los deportes de alto rendimiento:',
      examples: [
        {
          title: 'Deportes de Precisión (Fútbol, Baloncesto, Golf)',
          desc: 'Un jugador de baloncesto ajusta intuitivamente el ángulo a ~48°-52° y la velocidad inicial para que la parábola del balón entre limpia al aro.'
        },
        {
          title: 'Lanzamiento de Paquetes de Ayuda Humanitaria',
          desc: 'Un avión que vuela a 500 km/h debe soltar un cargamento de suministros varios kilómetros ANTES de la zona de destino debido a la inercia horizontal.'
        },
        {
          title: 'Diseño de Fuentes y Sistemas de Riego',
          desc: 'Los chorros de agua de las fuentes monumentales y aspersores agrícolas siguen parábolas exactas; los ingenieros calculan el ángulo óptimo (45°) para maximizar el alcance.'
        }
      ]
    },
    keyFormulas: [
      {
        title: 'Componentes de la Velocidad Inicial',
        formula: 'v_{0x} = v_0 \\cos\\theta, \\quad v_{0y} = v_0 \\sin\\theta',
        desc: 'Descomposición trigonométrica de la velocidad de lanzamiento en los ejes X e Y.'
      },
      {
        title: 'Ecuaciones Horarias de Trayectoria',
        formula: 'x(t) = v_{0x} \\cdot t, \\quad y(t) = y_0 + v_{0y} \\cdot t - \\frac{1}{2} g \\cdot t^2',
        desc: 'Posición simultánea en el plano en cualquier segundo del vuelo.'
      },
      {
        title: 'Tiempo de Subida y Altura Máxima',
        formula: 't_{\\text{subida}} = \\frac{v_{0y}}{g}, \\quad H_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g}',
        desc: 'En el punto más alto de la parábola, la velocidad vertical se anula instantáneamente (vy = 0).'
      },
      {
        title: 'Alcance Horizontal Máximo (para y0 = 0)',
        formula: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}',
        desc: 'Distancia horizontal total recorrida. El alcance teórico máximo se logra exactamente a 45°.'
      }
    ],
    variablesGlossary: [
      { symbol: 'v_0', name: 'Velocidad de disparo', unit: 'm/s', meaning: 'Rapidez con la que sale impulsado el proyectil.' },
      { symbol: '\\theta', name: 'Ángulo de elevación', unit: 'grados (°)', meaning: 'Inclinación del cañón o lanzamiento respecto al suelo.' },
      { symbol: 'g', name: 'Aceleración de gravedad', unit: '9.8 m/s²', meaning: 'Atracción gravitatoria hacia el centro de la Tierra.' },
      { symbol: 'H_{\\text{max}}', name: 'Altura máxima (Apogeo)', unit: 'metros (m)', meaning: 'Cota vertical más alta alcanzada.' },
      { symbol: 't_{\\text{vuelo}}', name: 'Tiempo de vuelo total', unit: 'segundos (s)', meaning: 'Tiempo total desde el disparo hasta impactar el suelo.' }
    ],
    graphTips: [
      {
        graph: 'Trayectoria en el Espacio Real (Y vs X)',
        meaning: 'Es una parábola simétrica (si y0 = 0). En la cúspide, el proyectil no se detiene; sigue avanzando horizontalmente a velocidad vx.'
      },
      {
        graph: 'Velocidad Vertical vs Tiempo (vy vs t)',
        meaning: 'Es una recta decreciente con pendiente -g. Pasa de ser positiva (sube) a cero (apogeo) y luego negativa (cae).'
      },
      {
        graph: 'Velocidad Horizontal vs Tiempo (vx vs t)',
        meaning: 'Permanece constante como una recta horizontal, demostrando que la gravedad solo afecta al eje vertical.'
      }
    ],
    didYouKnow:
      'Dos ángulos de lanzamiento complementarios que sumen 90° (por ejemplo 30° y 60°, o 20° y 70°) con la misma velocidad inicial alcanzarán exactamente la misma distancia horizontal, aunque con diferentes alturas y tiempos de vuelo.'
  }
};

export const TheoryGuide: React.FC<TheoryGuideProps> = ({ activeModule, onNavigateModule }) => {
  const [selectedTopic, setSelectedTopic] = useState<ActiveModule>(activeModule);

  // Sincronizar tema seleccionado cuando el usuario cambia de módulo en la barra superior
  useEffect(() => {
    setSelectedTopic(activeModule);
  }, [activeModule]);

  const topic = TOPICS[selectedTopic] || TOPICS.vectors;
  const IconComponent = topic.icon;

  return (
    <div className="theory-guide-container">
      {/* Selector de Temas Físicos */}
      <div className="theory-topic-nav">
        {(['vectors', 'mru', 'mrua', 'projectile'] as ActiveModule[]).map((modKey) => {
          const t = TOPICS[modKey];
          const isSelected = selectedTopic === modKey;
          const ModIcon = t.icon;
          return (
            <button
              key={modKey}
              onClick={() => setSelectedTopic(modKey)}
              className={`theory-nav-pill ${isSelected ? 'active' : ''}`}
              style={{
                borderColor: isSelected ? t.color : 'transparent',
                backgroundColor: isSelected ? t.badgeBg : 'transparent',
                color: isSelected ? t.color : 'var(--text-muted)'
              }}
              title={`Ver conceptos de ${t.title}`}
            >
              <ModIcon size={14} />
              <span>{t.id === 'vectors' ? 'Vectores' : t.id.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Banner de Cabecera del Tema */}
      <div
        className="theory-hero-card"
        style={{
          borderColor: `${topic.color}40`,
          background: `linear-gradient(135deg, ${topic.badgeBg} 0%, rgba(15, 23, 42, 0.4) 100%)`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: topic.badgeBg,
              border: `1px solid ${topic.color}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: topic.color
            }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {topic.title}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {topic.tagline}
            </p>
          </div>
        </div>

        {onNavigateModule && selectedTopic !== activeModule && (
          <button
            className="pill-btn"
            style={{
              marginTop: '10px',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderColor: topic.color,
              color: topic.color
            }}
            onClick={() => onNavigateModule(selectedTopic)}
          >
            <Sparkles size={13} />
            <span>Ir al Simulador de {topic.title}</span>
          </button>
        )}
      </div>

      {/* Sección: ¿Qué es? */}
      <div className="theory-section-card">
        <div className="theory-section-header">
          <HelpCircle size={16} style={{ color: topic.color }} />
          <span>¿Qué es y cómo funciona?</span>
        </div>
        <p className="theory-summary-text">{topic.whatIsIt.summary}</p>
        <div className="theory-bullet-list">
          {topic.whatIsIt.details.map((detail, idx) => (
            <div key={idx} className="theory-bullet-item">
              <CheckCircle2 size={14} style={{ color: topic.color, flexShrink: 0, marginTop: '2px' }} />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: ¿Para qué sirve? (Aplicaciones en el mundo real) */}
      <div className="theory-section-card">
        <div className="theory-section-header">
          <Globe size={16} style={{ color: topic.color }} />
          <span>¿Para qué sirve en la vida real?</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
          {topic.whatIsItFor.intro}
        </p>
        <div className="theory-examples-grid">
          {topic.whatIsItFor.examples.map((ex, idx) => (
            <div key={idx} className="theory-example-card">
              <span className="theory-example-title" style={{ color: topic.color }}>
                {ex.title}
              </span>
              <p className="theory-example-desc">{ex.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Ecuaciones Fundamentales */}
      <div className="theory-section-card">
        <div className="theory-section-header">
          <BookOpen size={16} style={{ color: topic.color }} />
          <span>Ecuaciones Fundamentales</span>
        </div>
        <div className="theory-formulas-list">
          {topic.keyFormulas.map((f, idx) => (
            <div key={idx} className="theory-formula-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="theory-formula-name">{f.title}</span>
              </div>
              <div className="theory-formula-katex">
                <Latex math={f.formula} block={true} />
              </div>
              <span className="theory-formula-explanation">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Glosario de Variables y Unidades */}
      <div className="theory-section-card">
        <div className="theory-section-header">
          <Sparkles size={16} style={{ color: topic.color }} />
          <span>Variables y Unidades del Sistema Internacional</span>
        </div>
        <div className="theory-table-wrapper">
          <table className="theory-variables-table">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Nombre</th>
                <th>Unidad</th>
                <th>Significado Físico</th>
              </tr>
            </thead>
            <tbody>
              {topic.variablesGlossary.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: topic.color }}>
                    <Latex math={row.symbol} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{row.name}</td>
                  <td>
                    <span className="unit-badge">{row.unit}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección: Cómo interpretar las Gráficas del Simulador */}
      <div className="theory-section-card">
        <div className="theory-section-header">
          <Activity size={16} style={{ color: topic.color }} />
          <span>Cómo Interpretar las Gráficas del Simulador</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topic.graphTips.map((tip, idx) => (
            <div key={idx} className="theory-graph-tip">
              <span className="theory-graph-title">{tip.graph}</span>
              <p className="theory-graph-desc">{tip.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Sabías que... (Curiosidad física) */}
      <div
        className="theory-curiosity-card"
        style={{
          borderLeft: `4px solid ${topic.color}`,
          backgroundColor: topic.badgeBg
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: topic.color, fontWeight: 700, fontSize: '0.85rem' }}>
          <Lightbulb size={16} />
          <span>¿Sabías que...?</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
          {topic.didYouKnow}
        </p>
      </div>
    </div>
  );
};

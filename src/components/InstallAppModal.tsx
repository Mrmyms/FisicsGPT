import React, { useState } from 'react';
import { Download, Monitor, Laptop, Terminal, X, CheckCircle2, Sparkles } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'windows' | 'mac' | 'terminal'>('pwa');

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstalled();
        onClose();
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="install-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="install-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="install-icon-badge">
              <Download size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Instalar FisicsGPT como App
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Úsala como aplicación de escritorio nativa en Windows y Mac
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {deferredPrompt && (
          <div className="install-native-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#38bdf8" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#fff' }}>
                  ¡Instalación directa disponible!
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
                  Tu navegador permite instalar FisicsGPT con un solo clic.
                </span>
              </div>
            </div>
            <button className="btn-primary" onClick={handleNativeInstall} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Download size={15} />
              <span>Instalar Ahora</span>
            </button>
          </div>
        )}

        <div className="install-tabs">
          <button
            className={`install-tab-btn ${activeTab === 'pwa' ? 'active' : ''}`}
            onClick={() => setActiveTab('pwa')}
          >
            <Download size={14} />
            <span>Navegador (1 Clic)</span>
          </button>
          <button
            className={`install-tab-btn ${activeTab === 'windows' ? 'active' : ''}`}
            onClick={() => setActiveTab('windows')}
          >
            <Monitor size={14} />
            <span>Windows (PC)</span>
          </button>
          <button
            className={`install-tab-btn ${activeTab === 'mac' ? 'active' : ''}`}
            onClick={() => setActiveTab('mac')}
          >
            <Laptop size={14} />
            <span>Mac (macOS)</span>
          </button>
          <button
            className={`install-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <Terminal size={14} />
            <span>Terminal (1 Comando)</span>
          </button>
        </div>

        <div className="install-tab-body">
          {activeTab === 'pwa' && (
            <div className="install-guide-list">
              <div className="install-step-item">
                <div className="step-number">1</div>
                <div className="step-text">
                  <strong>En Chrome o Edge (Windows / Mac)</strong>
                  <p>
                    Observa la barra de direcciones en la parte superior derecha. Haz clic en el icono <strong>⨁ (Instalar FisicsGPT)</strong>.
                  </p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">2</div>
                <div className="step-text">
                  <strong>Confirmar instalación</strong>
                  <p>
                    Presiona <strong>"Instalar"</strong> en la ventana emergente. La aplicación se abrirá en una ventana propia sin barras ni pestañas.
                  </p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">3</div>
                <div className="step-text">
                  <strong>¡Listo! Acceso inmediato</strong>
                  <p>
                    En Windows aparecerá en tu <strong>Escritorio y Barra de tareas</strong>. En Mac estará en tu <strong>Launchpad y Dock</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="install-guide-list">
              <div className="install-step-item">
                <div className="step-number">1</div>
                <div className="step-text">
                  <strong>En Microsoft Edge o Google Chrome</strong>
                  <p>Abre el enlace de FisicsGPT.</p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">2</div>
                <div className="step-text">
                  <strong>Menú de aplicaciones</strong>
                  <p>
                    Haz clic en los tres puntos <strong>(⋮)</strong> arriba a la derecha &gt; <strong>Aplicaciones</strong> &gt; <strong>"Instalar este sitio como una aplicación"</strong>.
                  </p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">3</div>
                <div className="step-text">
                  <strong>Fijar en el sistema</strong>
                  <p>
                    Marca las casillas <em>"Crear acceso directo en el escritorio"</em> y <em>"Anclar a la barra de tareas"</em>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mac' && (
            <div className="install-guide-list">
              <div className="install-step-item">
                <div className="step-number">1</div>
                <div className="step-text">
                  <strong>En Safari (macOS Sonoma o posterior)</strong>
                  <p>
                    En la barra de menús superior de Safari, haz clic en <strong>Archivo</strong> &gt; <strong>"Agregar al Dock..."</strong>.
                  </p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">2</div>
                <div className="step-text">
                  <strong>En Google Chrome o Edge para Mac</strong>
                  <p>
                    Haz clic en el icono <strong>⨁</strong> en la barra de URL o en <strong>⋮</strong> &gt; <strong>Guardar y compartir</strong> &gt; <strong>"Instalar FisicsGPT"</strong>.
                  </p>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">3</div>
                <div className="step-text">
                  <strong>Disponible en Launchpad</strong>
                  <p>
                    FisicsGPT quedará guardada en tu carpeta de <code>/Aplicaciones</code> con su propio icono de alta resolución.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="install-guide-list">
              <div className="install-step-item">
                <div className="step-number">1</div>
                <div className="step-text">
                  <strong>Ejecutar en modo App nativa</strong>
                  <p>Abre la terminal en la carpeta del proyecto y ejecuta:</p>
                  <div className="code-box-inline">
                    <code>npm run app</code>
                  </div>
                </div>
              </div>
              <div className="install-step-item">
                <div className="step-number">2</div>
                <div className="step-text">
                  <strong>¿Qué hace este comando?</strong>
                  <p>
                    Levanta el simulador e inicia Chrome/Edge automáticamente en <strong>Modo Aplicación de Escritorio independiente</strong> (sin URL bar, sin pestañas, con ventana propia para Windows y Mac).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="install-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>100% Gratuito • Sin suscripciones • Compatible con Windows y Mac</span>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

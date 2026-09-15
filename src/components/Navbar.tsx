import React, { useState, useEffect } from 'react';
import { Compass, Rocket, Activity, Zap, Sun, Moon, RotateCcw, Download, QrCode } from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';
import { ShareModal } from './ShareModal';

export type ActiveModule = 'vectors' | 'projectile' | 'mru' | 'mrua';

interface NavbarProps {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onResetView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  isDarkMode,
  onToggleTheme,
  onResetView
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-brand" onClick={() => onSelectModule('vectors')}>
        <Compass size={24} color="#38bdf8" />
        <span>FisicsGPT</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeModule === 'vectors' ? 'active' : ''}`}
          onClick={() => onSelectModule('vectors')}
        >
          <Compass size={16} />
          <span>Vectores 2D</span>
        </button>

        <button
          className={`nav-tab-btn ${activeModule === 'projectile' ? 'active' : ''}`}
          onClick={() => onSelectModule('projectile')}
        >
          <Rocket size={16} />
          <span>Tiro Parabólico</span>
        </button>

        <button
          className={`nav-tab-btn ${activeModule === 'mru' ? 'active' : ''}`}
          onClick={() => onSelectModule('mru')}
        >
          <Activity size={16} />
          <span>MRU</span>
        </button>

        <button
          className={`nav-tab-btn ${activeModule === 'mrua' ? 'active' : ''}`}
          onClick={() => onSelectModule('mrua')}
        >
          <Zap size={16} />
          <span>MRUA</span>
        </button>
      </nav>

      <div className="nav-actions">
        <button
          className="btn-install-app"
          onClick={() => setIsInstallModalOpen(true)}
          title="Instalar FisicsGPT en Windows o Mac"
        >
          <Download size={15} />
          <span>{isInstalled ? 'App Instalada' : 'Instalar App'}</span>
        </button>

        <button className="btn-icon" onClick={onResetView} title="Centrar y reajustar vista">
          <RotateCcw size={18} />
        </button>

        <button className="btn-icon" onClick={handleShare} title="Compartir y ver Código QR">
          <QrCode size={18} />
        </button>

        <button className="btn-icon" onClick={onToggleTheme} title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>

    <InstallAppModal
      isOpen={isInstallModalOpen}
      onClose={() => setIsInstallModalOpen(false)}
      deferredPrompt={deferredPrompt}
      onInstalled={() => setIsInstalled(true)}
    />

    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      url="https://fisics-gpt.vercel.app"
    />
  </>
  );
};

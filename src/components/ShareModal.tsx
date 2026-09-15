import React, { useState } from 'react';
import { QrCode, Copy, Check, X, ExternalLink, Download, Smartphone } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url = 'https://fisics-gpt.vercel.app'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = './qr-code.png';
    link.download = 'QR_FisicsGPT.png';
    link.click();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="install-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="install-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="install-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <QrCode size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Código QR de FisicsGPT
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Escanea con tu celular o comparte el enlace
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Contenedor del QR en fondo blanco para lectura óptica perfecta */}
          <div
            style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src="./qr-code.png"
              alt="Código QR de FisicsGPT"
              style={{
                width: '240px',
                height: '240px',
                display: 'block',
                imageRendering: 'pixelated'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <Smartphone size={16} color="#38bdf8" />
            <span>Apunta con la cámara de tu teléfono para abrir la app</span>
          </div>

          {/* Caja para copiar URL */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 8px 6px 12px',
              gap: '8px'
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace'
              }}
            >
              {url}
            </span>
            <button
              className="btn-primary"
              onClick={handleCopy}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                gap: '5px',
                flexShrink: 0
              }}
            >
              {copied ? <Check size={14} color="#fff" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <div className="install-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn-secondary"
            onClick={handleDownloadQr}
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
          >
            <Download size={14} />
            <span>Descargar Imagen PNG</span>
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            <span>Abrir Enlace</span>
          </a>
        </div>
      </div>
    </div>
  );
};

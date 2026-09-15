#!/usr/bin/env node
/**
 * FisicsGPT Desktop App Launcher
 * Inicia la aplicación y la abre en una ventana independiente tipo App nativa
 * compatible con Windows, macOS y Linux.
 */

import { spawn, exec } from 'node:child_process';
import http from 'node:http';

const PORT = 5174;
const URL = `http://localhost:${PORT}`;

console.log('🚀 Iniciando FisicsGPT en Modo Aplicación de Escritorio...');

// Verificar si el servidor ya está activo
function checkServer(url, callback) {
  const req = http.get(url, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(1000, () => {
    req.abort();
    callback(false);
  });
}

function openAppWindow(targetUrl) {
  const platform = process.platform;
  console.log(`📱 Abriendo ventana de aplicación en ${platform}...`);

  if (platform === 'darwin') {
    // macOS: Intentar abrir en modo --app con Chrome, Edge o Brave, o fallback con open
    const cmd = `open -a "Google Chrome" --args --app="${targetUrl}" || open -a "Microsoft Edge" --args --app="${targetUrl}" || open -a "Brave Browser" --args --app="${targetUrl}" || open "${targetUrl}"`;
    exec(cmd, (err) => {
      if (err) exec(`open "${targetUrl}"`);
    });
  } else if (platform === 'win32') {
    // Windows: Intentar abrir con Edge o Chrome en modo --app
    const cmd = `start msedge --app="${targetUrl}" || start chrome --app="${targetUrl}" || start "" "${targetUrl}"`;
    exec(cmd, (err) => {
      if (err) exec(`start "" "${targetUrl}"`);
    });
  } else {
    // Linux
    const cmd = `google-chrome --app="${targetUrl}" || chromium --app="${targetUrl}" || xdg-open "${targetUrl}"`;
    exec(cmd, (err) => {
      if (err) exec(`xdg-open "${targetUrl}"`);
    });
  }
  console.log(`✨ ¡FisicsGPT listo! Ventana de aplicación abierta.`);
}

checkServer(URL, (isRunning) => {
  if (isRunning) {
    openAppWindow(URL);
  } else {
    console.log('⏳ Levantando servidor local...');
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Esperar a que el servidor esté listo
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      checkServer(URL, (ready) => {
        if (ready) {
          clearInterval(interval);
          openAppWindow(URL);
        } else if (attempts > 30) {
          clearInterval(interval);
          console.error('❌ Tiempo de espera agotado al iniciar el servidor.');
        }
      });
    }, 500);

    process.on('SIGINT', () => {
      server.kill();
      process.exit();
    });
  }
});

# Guía de Publicación y Distribución Gratuita (Cero Servidores)

**FisicsGPT** es una aplicación web moderna construida con **React + Vite + TypeScript**. Todos los cálculos matemáticos, simulaciones físicas, animaciones a 60 FPS y renderizado de KaTeX ocurren **100% en el navegador del usuario**.

> **Ventajas clave:**
> - **Costo $0 de por vida:** No requiere rentar servidores ni pagar hosting.
> - **Cero descargas para los usuarios:** Cualquier persona (alumnos, profesores, amigos) solo abre un enlace web en su celular, tablet o PC y funciona de inmediato sin instalar nada.
> - **Despliegue en 1 solo comando.**

---

## Opción 1: Vercel (Recomendada - 1 solo comando)

Vercel ofrece hosting global ultrarrápido gratuito para proyectos frontend.

### Pasos:
1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   npx vercel
   ```
3. Si es tu primera vez, te pedirá autenticarte (puedes elegir GitHub, GitLab o tu correo electrónico).
4. Presiona **Enter** para aceptar todas las opciones por defecto (`Link to existing project? [N]`, `Project name? [fisicsgpt]`, etc.).
5. **¡Listo!** En unos 30 segundos recibirás un enlace público seguro como:
   `https://fisicsgpt.vercel.app`

---

## Opción 2: GitHub Pages (100% Gratis en tu GitHub)

Ya dejamos configurado el comando `npm run deploy` y la ruta relativa (`base: './'`) en el proyecto.

### Pasos:
1. Inicializa tu repositorio Git y súbelo a GitHub:
   ```bash
   git init
   git add .
   git commit -m "FisicsGPT v1.0"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/FisicsGPT.git
   git push -u origin main
   ```
2. Ejecuta el comando de despliegue:
   ```bash
   npm run deploy
   ```
3. En tu repositorio de GitHub, ve a **Settings** > **Pages** y asegúrate de que la fuente esté en la rama `gh-pages`.
4. Tu simulador estará disponible públicamente en:
   `https://TU_USUARIO.github.io/FisicsGPT`

---

## Opción 3: Netlify (Arrastrar y Soltar o por Terminal)

- **Vía Terminal (1 comando):**
  ```bash
  npx netlify deploy --prod --dir=dist
  ```
- **Vía Web (Sin comandos):**
  1. Ejecuta `npm run build` en tu computadora (genera la carpeta `dist`).
  2. Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
  3. Arrastra y suelta la carpeta `dist` en la ventana del navegador.
  4. Te generará un enlace público inmediato.

---

## ¿Y si alguien quiere correrlo en su computadora con 1 solo comando?

Si algún compañero o profesor con Node.js quiere ejecutarlo localmente sin clonar manualmente:
```bash
git clone https://github.com/TU_USUARIO/FisicsGPT.git && cd FisicsGPT && npm install && npm run dev
```

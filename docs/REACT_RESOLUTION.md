Resumen de la corrección de resolución de React

Qué pasó

- Se detectó una instalación de `react` y `react-dom` fuera del workspace en
  `C:\Users\Usuario\ECONEURA-\node_modules` (versión 19.1.1). Esto provocaba
  errores en las pruebas UI por múltiples instancias de React (mismatch de
  identidad de elementos).

Qué hice

- Creé shims y ajustes en la configuración de Vite/Vitest para normalizar el
  runtime de JSX.
- Apliqué `pnpm.overrides` para fijar `react` y `react-dom` a la versión 18.3.1.
- Eliminé copias locales duplicadas en `apps/*/node_modules` y forcé la
  resolución hacia la copia del workspace.
- Temporalmente renombré las carpetas externas conflictivas:
  - `C:\Users\Usuario\ECONEURA-\node_modules\react` -> `react.bak`
  - `C:\Users\Usuario\ECONEURA-\node_modules\react-dom` -> `react-dom.bak`
  - `C:\Users\Usuario\ECONEURA-\node_modules\react-is` -> `react-is.bak`
- Para garantizar resolución local, creé junctions (`mklink /J`) en
  `node_modules\\react` y `node_modules\\react-dom` del workspace apuntando a
  las copias en `.pnpm`.

Estado actual

- La suite de pruebas local (Vitest) pasa completamente en la rama
  `fix/cockpit-20250930-125729`.
- Las carpetas externas fueron renombradas a `.bak` (seguras y reversibles).

Cómo revertir / limpiar

- Para restaurar el estado anterior (si fuera necesario):
  - mover `react.bak` -> `react` y `react-dom.bak` -> `react-dom` en
    `C:\Users\Usuario\ECONEURA-\node_modules`.
  - eliminar las junctions dentro del repo: `rmdir node_modules\\react` y
    `rmdir node_modules\\react-dom` (si son junctions).

Recomendaciones

- Borrar permanentemente las instalaciones fuera del workspace si no son
  necesarias. Mantener estas instalaciones fuera del árbol de usuario ayuda a
  evitar conflictos.
- Ejecutar la CI en un runner limpio (GitHub Actions) para validar que la
  solución funciona en entornos limpios.
- (Opcional) Añadir un script de pretest que verifique
  `require.resolve('react')` apunta al workspace.

Contacto

- Si quieres que restaure o elimine los backups (`.bak`), dime y lo hago.

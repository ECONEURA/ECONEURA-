# Cockpit Local Preview

Pasos rápidos para desarrollar y ver la vista previa del Cockpit en `apps/web`:

1. Desde la raíz del monorepo inicia el mock AI:

   node dev/mock-ai.js

2. En otra terminal inicia la app web en modo dev (puedes pasar
   `?ai=/dev/mock-ai` en la URL):

   pnpm --filter ./apps/web dev

3. Abre http://127.0.0.1:8080 and navega a /src/pages/CockpitPreviewPage.tsx si
   tu router lo soporta, o importa el componente en `App.tsx` temporalmente.

Notas:

- El mock AI escucha por defecto en http://localhost:8787 y responde a POST con
  un JSON simulado.
- Para probar con el mock añade `?ai=http://localhost:8787` a la URL.

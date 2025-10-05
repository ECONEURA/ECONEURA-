## Resumen

Breve descripción del cambio y por qué es necesario.

## Checklist de PR (obligatorio antes de solicitar revisión)
- [ ] He ejecutado `./scripts/check_env.sh` y verifiqué mi entorno
- [ ] `pnpm install --frozen-lockfile` y `pnpm run bootstrap` funcionan sin errores
- [ ] `pnpm -w run lint` — sin errores importantes
- [ ] `pnpm -w run typecheck` — sin errores
- [ ] `pnpm -w run test:fast` — pruebas rápidas pasan
- [ ] Documenté cualquier cambio que requiere migración o actualización de infra

Nota: Actualmente la política de cobertura está en staging; revisa los comentarios automáticos en el PR para ver el estado de cobertura agregada.

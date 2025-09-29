# ECONEURA-IA - Reset Nuclear

Repositorio limpio con solo código funcional (GO=true en TECH-MAX V9).

## Lo que incluye:
- [packages/shared](packages/shared ): 144 tests pasan, cobertura >80%, sin fugas de seguridad, wiring completo

## Lo que NO incluye (para rebuild):
- [pps/api](apps/api ): necesita endpoint /api/invoke/:id y wiring MSAL
- [pps/web](apps/web ): necesita headers Authorization y MSAL completo
- CI/CD: necesita DEPLOY_ENABLED: false en workflows
- Secrets: migrar a Azure Key Vault

## Verificar GO=true:
`ash
pnpm i
pnpm test  # Debería pasar con cobertura >80%
node .artifacts/tech-max-v9.mjs  # GO=true
` 

## Roadmap para producción:
1. Rebuild apps/api con Express + wiring correcto
2. Rebuild apps/web con Next.js + MSAL
3. Agregar CI/CD seguro
4. Migrar secrets a Key Vault
5. Deploy a Azure

**Tiempo estimado para rebuild completo: 1-2 semanas**

import { describe, it, expect } from 'vitest'

const modulesToCheck = [
  '../ai/cost-utils',
  '../clients/admin-client',
  '../clients/ai-client',
  '../clients/flows-client',
  '../clients/integrations-client',
  '../graph/env.guard',
  '../otel/index',
  '../schemas/ai',
  '../schemas/base',
  '../schemas/flows',
  '../schemas/integrations',
  '../schemas/org',
  '../types/index',
  '../types/api',
  '../types/models',
  '../types/system',
  '../validation/crm',
  '../validation/erp',
]

describe('coverage smoke 2', () => {
  for (const modPath of modulesToCheck) {
    it(`imports ${modPath}`, async () => {
      // @ts-ignore - algunos módulos son placeholders o pueden no exportar nada
      const mod = await import(modPath)
      expect(mod).toBeTruthy()
    })
  }
})

import { describe, it, expect } from 'vitest'

import { estimateAICost, formatCostEur } from '../ai/cost-utils'
import { createAdminClient, adminHealth } from '../clients/admin-client'
import { createAIClient, parseAIResponse } from '../clients/ai-client'
import { createFlowsClient, isFlowId } from '../clients/flows-client'
import { createIntegrationsClient, hasIntegrations } from '../clients/integrations-client'
import { ensureGraphEnv, requireGraphEnvOrThrow } from '../graph/env.guard'
import { initTracer, shutdownTracer } from '../otel'
import { validateCompany, validateContact } from '../validation/crm'
import { validateInvoice, validateCustomer } from '../validation/erp'

describe('placeholder modules smoke', () => {
  it('invokes placeholder functions', async () => {
    expect(estimateAICost(100)).toBeGreaterThan(0)
    expect(formatCostEur(123)).toContain('€')

    const admin = createAdminClient('http://x')
    expect(await admin.ping()).toHaveProperty('ok')
    expect(await adminHealth()).toHaveProperty('healthy')

    const ai = createAIClient()
    const resp = await ai.generate('hi')
    expect(parseAIResponse(resp)).toContain('echo:')

    const flows = createFlowsClient()
    expect((await flows.startFlow('f1')).started).toBe(true)
    expect(isFlowId('f1')).toBe(true)

    const ints = createIntegrationsClient()
    expect(Array.isArray(await ints.listIntegrations())).toBe(true)
    expect(hasIntegrations([])).toBe(false)

    expect(typeof ensureGraphEnv({})).toBe('boolean')
    try {
      requireGraphEnvOrThrow({})
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }

    const t = initTracer('t')
    expect(t).toHaveProperty('started')
    expect(await shutdownTracer()).toBe(true)

    expect(validateCompany({ name: 'x' })).toBe(true)
    expect(validateContact({ email: 'a@b' })).toBe(true)
    expect(validateInvoice({ total: 10 })).toBe(true)
    expect(validateCustomer({ name: 'c' })).toBe(true)
  })
})

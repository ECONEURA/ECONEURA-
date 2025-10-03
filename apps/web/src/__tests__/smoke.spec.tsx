import App from '../App.tsx'
import EconeuraCockpit from '../EconeuraCockpit.tsx'

describe('smoke', () => {
  it('exports App and EconeuraCockpit', async () => {
    const modA = await import('../App')
    const modB = await import('../EconeuraCockpit')
    expect(modA.default).toBeDefined()
    expect(modB.default).toBeDefined()
  })
})

import { vi } from 'vitest'

vi.mock('../version.ts', async () => ({
  ...(await vi.importActual('../version.ts')),
  getIntegrationVersion: vi.fn().mockResolvedValue('0.0.0'),
}))

import { describe, expect, it } from 'vitest'
import { IntegrationError } from './IntegrationError'

describe('check integration error result', () => {
  it('check if error return valid body', () => {
    const json = {
      vendor: 'Fingerprint Pro Azure Function',
      message: 'Download failed',
      path: 'fpjs/agent',
    }

    const message: IntegrationError = new IntegrationError(json.message, json.path)
    const body = message.toBody()

    expect(body).toBe(JSON.stringify(json))
  })
})

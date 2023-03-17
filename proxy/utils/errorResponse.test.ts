import { generateErrorResponse } from './errorResponse'

describe('generateErrorResponse', () => {
  it('request id "id" part should be exactly 6 characters long', () => {
    const response = generateErrorResponse(new Error('test'))

    const [, id] = response.requestId.split('.')

    expect(id.length).toBe(6)
  })

  it('contains correct error message', () => {
    const response = generateErrorResponse(new Error('test'))

    expect(response.error.message).toBe('An error occured with Fingerprint Pro Azure function. Reason: test')
  })
})

import { HttpResponse } from '@azure/functions'
import { IntegrationError } from '../errors/IntegrationError'

export class HttpResponse404 extends HttpResponse {
  constructor(path: string) {
    super({
      status: 404,
      body: new IntegrationError('Invalid route', path).toBody(),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

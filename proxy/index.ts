import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { downloadAgent } from './agent'
import { handleIngress } from './ingress'

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  const path = req.params?.restOfPath

  switch (path) {
    case 'client': {
      context.res = await downloadAgent(req)

      break
    }

    case 'visitorId':
      context.res = await handleIngress(req)

      break

    default:
      context.res = {
        status: 404,
        body: JSON.stringify({
          req,
          message: 'Invalid route',
          restOfPath: path,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
  }
}

export default httpTrigger

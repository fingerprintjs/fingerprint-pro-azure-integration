import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { downloadAgent } from './handlers/agent'
import { handleIngress } from './handlers/ingress'

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  context.log.verbose('Handling request', {
    req,
    context,
  })

  const path = req.params?.restOfPath

  // TODO Resolve paths using customer variables
  switch (path) {
    case 'client': {
      context.res = await downloadAgent({ httpRequest: req, logger: context.log })

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

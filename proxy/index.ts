import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { handleIngress } from './handlers/ingress.ts'
import { CustomerVariables } from '../shared/customer-variables/CustomerVariables.ts'
import { EnvCustomerVariables } from '../shared/customer-variables/EnvCustomerVariables.ts'
import { handleStatus } from './handlers/status.ts'
import { removeTrailingSlashes } from '../shared/routing.ts'
import {
  getAgentDownloadUri,
  getPreSharedSecret,
  getResultUri,
  getRoutePrefix,
  getStatusUri,
} from '../shared/customer-variables/selectors.ts'
import { stripRoutePrefix } from './utils/paths.ts'
import { generateErrorResponse } from './utils/errorResponse.ts'
import { isTruthy } from '../shared/assert.ts'
import { toError } from './utils/error.ts'

async function withErrorHandling(callback: () => Promise<HttpResponse>, context: InvocationContext) {
  try {
    return await callback()
  } catch (error) {
    context.error('Error handling request', { error })

    return new HttpResponse({
      status: 500,
      body: JSON.stringify(generateErrorResponse(toError(error))),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

export const proxyFn = async (req: HttpRequest, context: InvocationContext): Promise<HttpResponse> => {
  context.debug(`Handling ${req.method} request`, {
    req,
    context,
  })

  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], context)

  const restOfPath = req.params.restOfPath

  if (!restOfPath) {
    return new HttpResponse({
      status: 200,
      body: 'OK',
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return withErrorHandling(async () => {
    const path = removeTrailingSlashes(restOfPath)

    context.debug(`Handling path: ${path}`)

    const resultUri = await getResultUri(customerVariables)
    const resultUriRegex = new RegExp(`^${resultUri}(/.*)?$`)
    const resultPathMatches = path.match(resultUriRegex)

    const agentDownloadUri = await getAgentDownloadUri(customerVariables)
    context.debug(`Agent download URI: ${agentDownloadUri}`)

    if (path === agentDownloadUri) {
      context.debug('Handling agent download')
      return await handleIngress({
        httpRequest: req,
        logger: context,
        preSharedSecret: await getPreSharedSecret(customerVariables),
        suffix: path,
        requestType: 'agentV3',
      })
    } else if (isTruthy(resultPathMatches) && resultPathMatches.length > 0) {
      let suffix = ''
      if (isTruthy(resultPathMatches[1])) {
        suffix = resultPathMatches[1]
      }

      context.debug(`Handling result path: ${suffix}`, { resultPathMatches })
      return await handleIngress({
        httpRequest: req,
        logger: context,
        preSharedSecret: await getPreSharedSecret(customerVariables),
        suffix,
        requestType: 'ingressV3',
      })
    } else {
      const statusUri = await getStatusUri(customerVariables)
      context.debug(`Status URI: ${statusUri}`)
      if (path === statusUri) {
        context.debug('Handling status path')
        return await handleStatus({
          httpRequest: req,
          customerVariables,
        })
      } else {
        context.debug(`Handling path: ${path} via ingress`)
        return await handleIngress({
          httpRequest: req,
          logger: context,
          preSharedSecret: await getPreSharedSecret(customerVariables),
          suffix: stripRoutePrefix(path, await getRoutePrefix(customerVariables)),
          requestType: 'v4',
        })
      }
    }
  }, context)
}
export default proxyFn

import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { handleIngress } from './handlers/ingress'
import { CustomerVariables } from '../shared/customer-variables/CustomerVariables'
import { EnvCustomerVariables } from '../shared/customer-variables/EnvCustomerVariables'
import { handleStatus } from './handlers/status'
import { removeTrailingSlashes } from '../shared/routing'
import {
  getAgentDownloadUri,
  getPreSharedSecret,
  getResultUri,
  getRoutePrefix,
  getStatusUri,
} from '../shared/customer-variables/selectors'
import { stripRoutePrefix } from './utils/paths'
import { generateErrorResponse } from './utils/errorResponse'
import { toError } from './utils/error'

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
  context.debug('Handling request', {
    req,
    context,
  })

  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], context)

  const restOfPath = req.params?.restOfPath

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

    const resultUri = await getResultUri(customerVariables)
    const resultUriRegex = new RegExp(`^${resultUri}(/.*)?$`)
    const resultPathMatches = path.match(resultUriRegex)

    if (path === (await getAgentDownloadUri(customerVariables))) {
      return await handleIngress({
        httpRequest: req,
        logger: context,
        preSharedSecret: await getPreSharedSecret(customerVariables),
        suffix: path,
        requestType: 'agentV3',
      })
    } else if (resultPathMatches?.length) {
      let suffix = ''
      if (resultPathMatches && resultPathMatches.length >= 1) {
        suffix = resultPathMatches[1] ?? ''
      }
      return await handleIngress({
        httpRequest: req,
        logger: context,
        preSharedSecret: await getPreSharedSecret(customerVariables),
        suffix,
        requestType: 'ingressV3',
      })
    } else if (path === (await getStatusUri(customerVariables))) {
      return await handleStatus({
        httpRequest: req,
        customerVariables,
      })
    } else {
      return await handleIngress({
        httpRequest: req,
        logger: context,
        preSharedSecret: await getPreSharedSecret(customerVariables),
        suffix: stripRoutePrefix(path, await getRoutePrefix(customerVariables)),
        requestType: 'v4',
      })
    }
  }, context)
}
export default proxyFn

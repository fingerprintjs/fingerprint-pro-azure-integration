import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { downloadAgent } from './handlers/agent'
import { _handleIngress, handleIngress } from './handlers/ingress'
import { CustomerVariables } from '../shared/customer-variables/CustomerVariables'
import { EnvCustomerVariables } from '../shared/customer-variables/EnvCustomerVariables'
import { CustomerVariableType } from '../shared/customer-variables/types'
import { handleStatus } from './handlers/status'
import { removeTrailingSlashes } from '../shared/routing'
import { getAgentDownloadUri, getResultUri, getStatusUri } from '../shared/customer-variables/selectors'
import { HttpResponse404 } from './http/responses'

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

  const path = removeTrailingSlashes(restOfPath)

  const resultUri = await getResultUri(customerVariables)
  const resultUriRegex = new RegExp(`^${resultUri}(/.*)?$`)
  const resultPathMatches = path.match(resultUriRegex)

  if (path === (await getAgentDownloadUri(customerVariables))) {
    return await downloadAgent({ httpRequest: req, logger: context, path })
  } else if (resultPathMatches?.length) {
    let suffix = ''
    if (resultPathMatches && resultPathMatches.length >= 1) {
      suffix = resultPathMatches[1] ?? ''
    }
    return await handleIngress({
      httpRequest: req,
      logger: context,
      preSharedSecret: await customerVariables
        .getVariable(CustomerVariableType.PreSharedSecret)
        .then((v) => v.value ?? undefined),
      suffix,
      requestType: 'ingressV3',
    })
  } else if (path === (await getStatusUri(customerVariables))) {
    return await handleStatus({
      httpRequest: req,
      customerVariables,
    })
  } else {
    return new HttpResponse404(path)
  }
}
export default proxyFn

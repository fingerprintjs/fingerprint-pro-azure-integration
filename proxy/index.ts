import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { downloadAgent } from './handlers/agent'
import { handleIngress } from './handlers/ingress'
import { CustomerVariables } from './customer-variables/CustomerVariables'
import { EnvCustomerVariables } from './customer-variables/EnvCustomerVariables'
import { CustomerVariableType } from './customer-variables/types'
import { handleStatus } from './handlers/status'
import { removeTrailingSlashes } from './utils/routing'
import { getAgentDownloadUri, getResultUri, getStatusUri } from './customer-variables/selectors'

const proxy: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  context.log.verbose('Handling request', {
    req,
    context,
  })

  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], context.log)

  const path = removeTrailingSlashes(req.params?.restOfPath)

  const get404 = () => ({
    status: 404,
    body: JSON.stringify({
      message: 'Invalid route',
      path,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (path === (await getAgentDownloadUri(customerVariables))) {
    context.res = await downloadAgent({ httpRequest: req, logger: context.log })
  } else if (path === (await getResultUri(customerVariables))) {
    context.res = await handleIngress({
      httpRequest: req,
      logger: context.log,
      preSharedSecret: await customerVariables
        .getVariable(CustomerVariableType.PreSharedSecret)
        .then((v) => v.value ?? undefined),
    })
  } else if (path === (await getStatusUri(customerVariables))) {
    context.res = await handleStatus({
      httpRequest: req,
      customerVariables,
    })
  } else {
    context.res = get404()
  }
}

export default proxy

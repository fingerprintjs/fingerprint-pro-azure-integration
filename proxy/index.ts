import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { downloadAgent } from './handlers/agent'
import { handleIngress } from './handlers/ingress'
import { CustomerVariables } from '../shared/customer-variables/CustomerVariables'
import { EnvCustomerVariables } from '../shared/customer-variables/EnvCustomerVariables'
import { CustomerVariableType } from '../shared/customer-variables/types'
import { handleStatus } from './handlers/status'
import { removeTrailingSlashes } from '../shared/routing'
import { getAgentDownloadUri, getResultUri, getStatusUri } from '../shared/customer-variables/selectors'
import { IntegrationError } from './errors/IntegrationError'
import { HttpResponseSimple } from '@azure/functions/types/http'

const proxy: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  context.log.verbose('Handling request', {
    req,
    context,
  })

  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], context.log)

  const restOfPath = req.params?.restOfPath

  if (!restOfPath) {
    context.res = {
      status: 200,
      body: 'OK',
      headers: {
        'Content-Type': 'text/plain',
      },
    }

    return
  }

  const path = removeTrailingSlashes(restOfPath)

  const resultUri = await getResultUri(customerVariables)
  const resultUriRegex = new RegExp(`^${resultUri}(/.*)?$`)
  const resultPathMatches = path.match(resultUriRegex)

  const get404 = () =>
    ({
      status: 404,
      body: new IntegrationError('Invalid route', path).toBody(),
      headers: {
        'Content-Type': 'application/json',
      },
    }) satisfies HttpResponseSimple

  if (path === (await getAgentDownloadUri(customerVariables))) {
    context.res = await downloadAgent({ httpRequest: req, logger: context.log, path })
  } else if (resultPathMatches?.length) {
    let suffix = ''
    if (resultPathMatches && resultPathMatches.length >= 1) {
      suffix = resultPathMatches[1] ?? ''
    }
    context.res = await handleIngress({
      httpRequest: req,
      logger: context.log,
      preSharedSecret: await customerVariables
        .getVariable(CustomerVariableType.PreSharedSecret)
        .then((v) => v.value ?? undefined),
      suffix,
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

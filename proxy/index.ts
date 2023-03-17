import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { downloadAgent } from './handlers/agent'
import { handleIngress } from './handlers/ingress'
import { CustomerVariables } from './customer-variables/CustomerVariables'
import { EnvCustomerVariables } from './customer-variables/EnvCustomerVariables'
import { CustomerVariableType } from './customer-variables/types'

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  context.log.verbose('Handling request', {
    req,
    context,
  })

  const customerVariables = new CustomerVariables([new EnvCustomerVariables()], context.log)

  const [clientPath, resultPath] = await Promise.all([
    customerVariables.getVariable(CustomerVariableType.AgentDownloadPath),
    customerVariables.getVariable(CustomerVariableType.GetResultPath),
    customerVariables.getVariable(CustomerVariableType.GetResultPath),
  ])

  const path = req.params?.restOfPath

  const get404 = () => ({
    status: 404,
    body: JSON.stringify({
      req,
      message: 'Invalid route',
      path,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!path || !clientPath.value || !resultPath.value) {
    context.res = get404()

    return
  }

  switch (path) {
    case clientPath.value: {
      context.res = await downloadAgent({ httpRequest: req, logger: context.log })

      break
    }

    case resultPath.value:
      context.res = await handleIngress({ httpRequest: req, logger: context.log })

      break

    default:
      context.res = get404()

      break
  }
}

export default httpTrigger

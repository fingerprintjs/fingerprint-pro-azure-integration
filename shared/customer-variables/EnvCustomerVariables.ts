import { CustomerVariableProvider, CustomerVariableName } from './types'

export class EnvCustomerVariables implements CustomerVariableProvider {
  readonly name = 'EnvCustomerVariables'

  constructor(private readonly env = process.env) {}

  getVariable(variable: CustomerVariableName): Promise<string | null> {
    return Promise.resolve(this.env[variable] ?? null)
  }
}

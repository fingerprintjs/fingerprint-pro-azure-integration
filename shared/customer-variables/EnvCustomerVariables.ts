import { CustomerVariableProvider, CustomerVariableName } from './types'

export class EnvCustomerVariables implements CustomerVariableProvider {
  readonly name = 'EnvCustomerVariables'

  constructor(private readonly env = process.env) {}

  async getVariable(variable: CustomerVariableName): Promise<string | null> {
    return this.env[variable] ?? null
  }
}

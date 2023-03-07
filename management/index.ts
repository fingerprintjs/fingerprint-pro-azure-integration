import { AzureFunction, Context } from '@azure/functions'

const storageBlobTrigger: AzureFunction = async (context: Context, blob: any): Promise<void> => {
  context.log(typeof blob)
  context.log(blob)
  context.log(context)
}

export default storageBlobTrigger

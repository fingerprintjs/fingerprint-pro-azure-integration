export function generateErrorResponse(err: Error): string {
  const body = {
    v: '2',
    error: {
      code: 'Failed',
      message: `An error occured with Fingerprint Pro Azure function. Reason ${err}`,
    },
    requestId: generateRequestId,
    products: {},
  }

  return JSON.stringify(body)
}

function generateRequestId(): string {
  const uniqueId = generateRequestUniqueId()
  const now = new Date().getTime()
  return `${now}.azure-${uniqueId}`
}

function generateRequestUniqueId(): string {
  return generateRandomString(2)
}

function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

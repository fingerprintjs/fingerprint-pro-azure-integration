export function generateErrorResponse(err: Error) {
  return {
    v: '2',
    error: {
      code: 'Failed',
      message: `An error occured with Fingerprint Pro Azure function. Reason: ${err.message}`,
    },
    requestId: generateRequestId(),
    products: {},
  }
}

function generateRequestId(): string {
  const uniqueId = generateRequestUniqueId()
  const now = new Date().getTime()
  return `${now}.${uniqueId}`
}

function generateRequestUniqueId(): string {
  return generateRandomString(6)
}

function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

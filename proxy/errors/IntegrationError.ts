export class IntegrationError extends Error {
  constructor(
    message: string,
    readonly path: string
  ) {
    super(message)
  }

  toBody() {
    return JSON.stringify({
      vendor: 'Fingerprint Pro Azure Function',
      message: this.message,
      path: this.path,
    })
  }
}

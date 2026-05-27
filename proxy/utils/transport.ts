import https, { RequestOptions } from 'https'
import { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { HttpRequest, HttpResponse, InvocationContext } from '@azure/functions'
import { generateErrorResponse } from './errorResponse'
import { toError } from './error'
import { updateResponseHeaders } from './headers'

type SendHttpRequestResult = {
  response: IncomingMessage
  data: Buffer | Uint8Array
}

/**
 * Sends an HTTP request to the specified URL with the given options and data.
 *
 * @param {URL} url - The URL to send the request to.
 * @param {Object} options - The request options.
 * @param {string | undefined} options.data - The base64 encoded string to be sent as the request body.
 * @param {Object} [options.headers] - Additional HTTP headers for the request.
 * @param {string} [options.method] - The HTTP method to use (e.g., "GET", "POST").
 * @return {Promise<SendHttpRequestResult>} A promise that resolves with the result of the HTTP request, including the response and the response data.
 */
function sendHttpRequest(
  url: URL,
  { data, ...options }: RequestOptions & { data: Buffer | undefined }
): Promise<SendHttpRequestResult> {
  return new Promise<SendHttpRequestResult>((resolve, reject) => {
    const request = https.request(url.toString(), options, (response) => {
      const chunks: Buffer[] = []

      response.setEncoding('binary')
      response.on('data', (data) => {
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data, 'binary')

        chunks.push(chunk)
      })

      response.on('error', reject)

      response.on('end', () => {
        const payload = Buffer.concat(chunks)

        // Buffer must be wrapped in Uint8Array for binary responses — Azure's HttpResponse
        // serializes Buffer via toString(), which corrupts compressed data (e.g. gzip'd JS)
        // and results in an empty 200. Plain Uint8Array bypasses that path and keeps raw bytes intact.
        resolve({
          response,
          data: new Uint8Array(payload),
        })
      })
    })

    request.on('error', reject)

    if (data) {
      request.write(data)
    }
    request.end()
  })
}

/**
 * Sends an ingress request to the specified URL with the provided request details and headers,
 * processes the response, and returns a formatted Azure result.
 *
 * @param {HttpRequest} httpRequest - The original HTTP Request object containing method, headers, and body.
 * @param {OutgoingHttpHeaders} requestHeaders - The headers to be sent with the HTTP request.
 * @param {URL} requestUrl - The URL endpoint where the request will be sent.
 * @param {InvocationContext} context - The Azure Function invocation context for logging and debugging.
 * @return {Promise<HttpResponse>} A promise that resolves to HTTP Response object containing the response status,
 *                                            headers, body, and encoding.
 */
export async function sendIngressRequest(
  httpRequest: HttpRequest,
  requestHeaders: OutgoingHttpHeaders,
  requestUrl: URL,
  context: InvocationContext
): Promise<HttpResponse> {
  try {
    context.debug('Sending request to Ingress API', {
      method: httpRequest.method,
      url: requestUrl.toString(),
    })

    let requestBody: Buffer | undefined = undefined

    if (httpRequest.body) {
      try {
        requestBody = Buffer.from(await httpRequest.arrayBuffer())
      } catch (e) {
        context.error('unable to handle request body', { error: e })

        return new HttpResponse({
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generateErrorResponse(toError(e))),
        })
      }
    }

    const { response, data } = await sendHttpRequest(requestUrl, {
      method: httpRequest.method,
      data: requestBody,
      headers: requestHeaders,
    })
    const isJavascript = response.headers['content-type']?.includes('text/javascript')

    const dataString = data.toString('utf-8')

    context.debug('Response from Ingress API', {
      statusCode: response.statusCode,
      payload: dataString,
      isJavascript,
    })

    return new HttpResponse({
      status: response.statusCode ?? 500,
      body: data,
      headers: updateResponseHeaders(response.headers, isJavascript),
    })
  } catch (error) {
    return new HttpResponse({
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateErrorResponse(toError(error))),
    })
  }
}

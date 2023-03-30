import { LoadOptions } from '@fingerprintjs/fingerprintjs-pro'
import { getVisitorData } from './fingerprint'

type Text = string | { html: string }

export function handleVisitorData(options: LoadOptions) {
  const button = document.querySelector<HTMLButtonElement>('#getData')

  if (!button) {
    return
  }

  button.disabled = false

  button.addEventListener('click', () => getAndPrintData(options))
}

async function getAndPrintData(options: LoadOptions) {
  const output = document.querySelector('.output')
  if (!output) {
    throw new Error("The output element isn't found in the HTML code")
  }

  const startTime = Date.now()

  try {
    const { response, responseLoadTime, agentLoadTime } = await getVisitorData(options)
    const { confidence } = response

    console.log('Got response', response)

    output.innerHTML = ''
    addOutputSection({
      output,
      header: 'Response',
      content: JSON.stringify(response, null, ' '),
      size: 'big',
      id: 'response',
    })
    addOutputSection({
      output,
      header: 'Time took to get the identifier:',
      content: `${responseLoadTime}ms`,
      size: 'big',
      id: 'time',
    })
    addOutputSection({
      output,
      header: 'Time took to get the agent:',
      content: `${agentLoadTime}ms`,
      size: 'big',
      id: 'time',
    })
    addOutputSection({
      output,
      header: 'Confidence score:',
      content: String(confidence.score),
      id: 'confidence',
      comment: confidence.comment
        ? {
            html: confidence.comment.replace(
              /(upgrade\s+to\s+)?pro(\s+version)?(:\s+(https?:\/\/\S+))?/gi,
              '<a href="$4" target="_blank">$&</a>',
            ),
          }
        : '',
      size: 'big',
    })
    addOutputSection({ output, header: 'User agent:', content: navigator.userAgent, id: 'userAgent' })
  } catch (error) {
    const totalTime = Date.now() - startTime
    const errorData = error instanceof Error ? error.message : JSON.stringify(error)
    output.innerHTML = ''
    addOutputSection({ output, header: 'Unexpected error:', content: JSON.stringify(errorData, null, 2), id: 'error' })
    addOutputSection({
      output,
      header: 'Time passed before the error:',
      content: `${totalTime}ms`,
      size: 'big',
      id: 'error_time',
    })
    addOutputSection({ output, header: 'User agent:', content: navigator.userAgent, id: 'userAgent' })

    throw error
  }
}

function addOutputSection({
  output,
  header,
  content,
  comment,
  size,
  id,
}: {
  output: Node
  header: Text
  id: string
  content: Text
  comment?: Text
  size?: 'big' | 'giant'
}) {
  const container = document.createElement('div')
  container.classList.add('outputSection')
  container.id = id

  const headerElement = document.createElement('div')
  headerElement.appendChild(textToDOM(header))
  headerElement.classList.add('heading')
  container.appendChild(headerElement)

  const contentElement = document.createElement('pre')
  contentElement.appendChild(textToDOM(content))
  if (size) {
    contentElement.classList.add(size)
  }
  container.appendChild(contentElement)

  if (comment) {
    const commentElement = document.createElement('div')
    commentElement.appendChild(textToDOM(comment))
    commentElement.classList.add('comment')
    container.appendChild(commentElement)
  }

  output.appendChild(container)
}

function textToDOM(text: Text): Node {
  if (typeof text === 'string') {
    return document.createTextNode(text)
  }

  const container = document.createElement('div')
  container.innerHTML = text.html

  const fragment = document.createDocumentFragment()

  while (container.firstChild) {
    fragment.appendChild(container.firstChild)
  }

  return fragment
}

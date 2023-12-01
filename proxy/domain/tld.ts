import domainSuffixListReversed from './domain-suffix-list-reversed.json'
import * as Punycode from 'punycode'

type Rule = {
  rule: string
  suffix: string
  wildcard: boolean
  exception: boolean
}

type ParsedResult = {
  input: string
  tld: string | null
  sld: string | null
  domain: string | null
  subdomain: string | null
  listed: boolean
}

type TrieNode = {
  key: string
  parent: TrieNode | null
  children: Map<string, TrieNode>
  suffix: string
  end: boolean
  excluded: boolean
}

const rootNode = createTrie()
const cache = new Map<string, Rule>()

function createTrie(): TrieNode {
  const root: TrieNode = {
    key: '',
    parent: null,
    children: new Map(),
    suffix: '',
    end: false,
    excluded: false,
  }
  for (const rule of domainSuffixListReversed) {
    const word = rule.reversed + '.'
    let node = root
    for (let i = 0; i < word.length; i++) {
      if (!node.children.has(word[i])) {
        node.children.set(word[i], {
          key: word[i],
          suffix: '',
          parent: node,
          children: new Map(),
          end: false,
          excluded: false,
        })
      }

      node = node.children.get(word[i])!

      if (i === word.length - 1 || i === word.length - 2 || word[i] == '.') {
        node.suffix = Punycode.toASCII(rule.suffix)
        node.end = true
        node.excluded = rule.excluded ? rule.excluded : false
      }
    }
  }
  return root
}

function search(domain: string): string | null {
  let node = rootNode

  let i
  for (i = 0; i < domain.length; i++) {
    if (node.children.has(domain[i])) {
      node = node.children.get(domain[i])!
    } else if (node.children.has('*')) {
      node = node.children.get('*')!
    } else {
      break
    }
  }

  // PSL has rules like *.kobe.jp which covers all third-level domains,
  // but also has a rule !city.kobe.jp which means exclusion from the previous one
  if (node.excluded) {
    let currNode = node
    while (currNode.parent != null) {
      currNode = currNode.parent
      if (currNode.end) {
        return currNode.suffix
      }
    }
    return null
  }

  // whole domain string processed
  if (i == domain.length) {
    if (node.end) {
      if (!node.excluded) {
        return node.suffix
      } else if (node.parent) {
        return node.parent.suffix
      }
      return node.suffix
    } else {
      return null
    }
  }

  // part of domain string was processed, but some rule found
  // so need to find previous matching rule
  // for example, the loop find node `ar.com` for `fdsaar.com`,
  // so need to proceed with `.com` here
  let j
  for (j = i; j > 0; j--) {
    if (domain[j] == '.') {
      break
    }
  }
  const sub = reverse(domain.substring(0, j))
  let currNode = node
  while (currNode.parent != null) {
    if (compare(currNode.suffix, sub)) {
      return currNode.suffix
    } else {
      currNode = currNode.parent
    }
  }

  return currNode.suffix
}

function compare(value1: string, value2: string): boolean {
  const v1 = reverse(value1)
  const v2 = reverse(value2)

  let i
  for (i = 0; i < Math.min(v1.length, v2.length); i++) {
    if (v1[i] !== v2[i]) {
      break
    }
  }

  if (v1.length === v2.length && v1.length === i) {
    return true
  }

  const s1 = v1.substring(i)
  const s2 = v2.substring(i)

  return s1 === '.*' || s1 === '*' || s2 === '.*' || s2 === '*'
}

function reverse(str: string): string {
  let newStr = ''
  for (let i = str.length - 1; i >= 0; i--) {
    newStr += str[i]
  }
  return newStr
}

function findRule(domain: string): Rule | null {
  if (cache.has(domain)) {
    return cache.get(domain)!
  }
  const punyDomain = Punycode.toASCII(domain)
  let foundRule: Rule | null = null

  const domainReversed = reverse(punyDomain)
  const rule = search(domainReversed)
  if (!rule) {
    return null
  }
  const suffix = rule.replace(/^(\*\.|!)/, '')
  const wildcard = rule.charAt(0) === '*'
  const exception = rule.charAt(0) === '!'
  foundRule = { rule, suffix, wildcard, exception }
  cache.set(domain, foundRule)
  return foundRule
}

const errorCodes: { [key: string]: string } = {
  DOMAIN_TOO_SHORT: 'Domain name too short.',
  DOMAIN_TOO_LONG: 'Domain name too long. It should be no more than 255 chars.',
  LABEL_STARTS_WITH_DASH: 'Domain name label can not start with a dash.',
  LABEL_ENDS_WITH_DASH: 'Domain name label can not end with a dash.',
  LABEL_TOO_LONG: 'Domain name label should be at most 63 chars long.',
  LABEL_TOO_SHORT: 'Domain name label should be at least 1 character long.',
  LABEL_INVALID_CHARS: 'Domain name label can only contain alphanumeric characters or dashes.',
}

function validate(input: string): string | null {
  const ascii = Punycode.toASCII(input)

  const labels = ascii.split('.')
  let label

  for (let i = 0; i < labels.length; ++i) {
    label = labels[i]
    if (!label.length) {
      return 'LABEL_TOO_SHORT'
    }
  }

  return null
}

function parsePunycode(domain: string, parsed: ParsedResult): ParsedResult {
  if (!/xn--/.test(domain)) {
    return parsed
  }
  if (parsed.domain) {
    parsed.domain = Punycode.toASCII(parsed.domain)
  }
  if (parsed.subdomain) {
    parsed.subdomain = Punycode.toASCII(parsed.subdomain)
  }
  return parsed
}

function parse(domain: string): ParsedResult {
  const domainSanitized = domain.toLowerCase()
  const validationErrorCode = validate(domain)
  if (validationErrorCode) {
    throw new Error(
      JSON.stringify({
        input: domain,
        error: {
          message: errorCodes[validationErrorCode],
          code: validationErrorCode,
        },
      }),
    )
  }

  const parsed: ParsedResult = {
    input: domain,
    tld: null,
    sld: null,
    domain: null,
    subdomain: null,
    listed: false,
  }

  const domainParts = domainSanitized.split('.')
  const rule = findRule(domainSanitized)
  if (!rule) {
    if (domainParts.length < 2) {
      return parsed
    }
    parsed.tld = domainParts.pop()!!
    parsed.sld = domainParts.pop()!!
    parsed.domain = `${parsed.sld}.${parsed.tld}`
    if (domainParts.length) {
      parsed.subdomain = domainParts.pop()!!
    }
    return parsePunycode(domain, parsed)
  }
  parsed.listed = true

  const tldParts = rule.suffix.split('.')
  const privateParts = domainParts.slice(0, domainParts.length - tldParts.length)

  if (rule.exception) {
    privateParts.push(tldParts.shift()!!)
  }

  parsed.tld = tldParts.join('.')

  if (!privateParts.length) {
    return parsePunycode(domainSanitized, parsed)
  }

  if (rule.wildcard) {
    parsed.tld = `${privateParts.pop()!!}.${parsed.tld}`
  }

  if (!privateParts.length) {
    return parsePunycode(domainSanitized, parsed)
  }

  parsed.sld = privateParts.pop()!!
  parsed.domain = `${parsed.sld}.${parsed.tld}`

  if (privateParts.length) {
    parsed.subdomain = privateParts.join('.')
  }

  return parsePunycode(domainSanitized, parsed)
}

function get(domain: string): string | null {
  if (!domain) {
    return null
  }

  return parse(domain).domain
}

export function getEffectiveTLDPlusOne(hostname: string) {
  try {
    return get(hostname) || ''
  } catch {
    return ''
  }
}
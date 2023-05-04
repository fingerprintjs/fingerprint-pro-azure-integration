import { cdnClient } from './clients'
import {
  KnownAFDEndpointProtocols,
  KnownAfdQueryStringCachingBehavior,
  KnownForwardingProtocol,
  KnownHttpsRedirect,
  KnownLinkToDefaultDomain,
  KnownSkuName,
} from '@azure/arm-cdn'
import { KnownSessionAffinityEnabledState } from '@azure/arm-frontdoor'
import invariant from 'tiny-invariant'
import { ExponentialBackoff, handleAll, retry } from 'cockatiel'

export interface ProvisionFrontDoorParams {
  resourceGroup: string
  functionAppHost: string
  websiteHost: string
  functionHealthStatusPath: string
  functionAppRoutePrefix: string
}

export async function provisionFrontDoor({
  functionAppHost,
  websiteHost,
  resourceGroup,
  functionHealthStatusPath,
  functionAppRoutePrefix,
}: ProvisionFrontDoorParams) {
  const profileName = `e2e-frontdoor-${Date.now()}`

  console.info(`Creating front door profile`, profileName)

  const profile = await cdnClient.profiles.beginCreateAndWait(resourceGroup, profileName, {
    sku: {
      name: KnownSkuName.StandardAzureFrontDoor,
    },
    kind: 'frontdoor',
    location: 'Global',
    originResponseTimeoutSeconds: 60,
  })

  console.info(`Created front door profile`)

  console.info('Creating origin groups...')

  const [functionAppOriginGroup, websiteOriginGroup] = await Promise.all([
    cdnClient.afdOriginGroups.beginCreateAndWait(resourceGroup, profileName, 'function-app', {
      loadBalancingSettings: {
        sampleSize: 4,
        successfulSamplesRequired: 3,
        additionalLatencyInMilliseconds: 50,
      },
      healthProbeSettings: {
        probePath: functionHealthStatusPath,
        probeRequestType: 'GET',
        probeProtocol: 'Https',
        probeIntervalInSeconds: 100,
      },
      sessionAffinityState: KnownSessionAffinityEnabledState.Disabled,
    }),
    cdnClient.afdOriginGroups.beginCreateAndWait(resourceGroup, profileName, 'website', {
      loadBalancingSettings: {
        sampleSize: 4,
        successfulSamplesRequired: 3,
        additionalLatencyInMilliseconds: 50,
      },
      healthProbeSettings: {
        probePath: '/',
        probeRequestType: 'HEAD',
        probeProtocol: 'Https',
        probeIntervalInSeconds: 100,
      },
      sessionAffinityState: KnownSessionAffinityEnabledState.Disabled,
    }),
  ])

  console.info('Created origin groups')
  invariant(functionAppOriginGroup.name, 'functionAppOriginGroup.name is required')
  invariant(websiteOriginGroup.name, 'websiteOriginGroup.name is required')
  console.info('Creating origins...')

  await Promise.all([
    cdnClient.afdOrigins.beginCreateAndWait(resourceGroup, profileName, functionAppOriginGroup.name, 'function-app', {
      hostName: functionAppHost,
      originHostHeader: functionAppHost,
      httpPort: 80,
      httpsPort: 443,
      priority: 1,
      weight: 1000,
      enforceCertificateNameCheck: true,
    }),
    cdnClient.afdOrigins.beginCreateAndWait(resourceGroup, profileName, websiteOriginGroup.name, 'website', {
      hostName: websiteHost,
      originHostHeader: websiteHost,
      httpPort: 80,
      httpsPort: 443,
      priority: 1,
      weight: 1000,
      enforceCertificateNameCheck: true,
    }),
  ])

  console.info('Created origins')
  console.info('Creating endpoints...')

  const endpoint = await cdnClient.afdEndpoints.beginCreateAndWait(
    resourceGroup,
    profileName,
    `fpjs-e2e-proxy-${Date.now()}`,
    {
      location: 'Global',
    },
  )
  invariant(endpoint.name, 'endpoint.name is required')
  invariant(endpoint.hostName, 'endpoint.hostName is required')

  console.info('Created endpoints')
  console.info('Creating route...')

  await Promise.all([
    cdnClient.routes.beginCreateAndWait(resourceGroup, profileName, endpoint.name, 'function-app', {
      originGroup: {
        id: functionAppOriginGroup.id,
      },
      supportedProtocols: [KnownAFDEndpointProtocols.Http, KnownAFDEndpointProtocols.Https],
      patternsToMatch: [`/${functionAppRoutePrefix}/*`],
      cacheConfiguration: {
        queryStringCachingBehavior: KnownAfdQueryStringCachingBehavior.UseQueryString,
      },
      forwardingProtocol: KnownForwardingProtocol.MatchRequest,
      linkToDefaultDomain: KnownLinkToDefaultDomain.Enabled,
      httpsRedirect: KnownHttpsRedirect.Enabled,
    }),
    cdnClient.routes.beginCreateAndWait(resourceGroup, profileName, endpoint.name, 'proxy', {
      originGroup: {
        id: websiteOriginGroup.id,
      },
      supportedProtocols: [KnownAFDEndpointProtocols.Http, KnownAFDEndpointProtocols.Https],
      patternsToMatch: ['/*'],
      cacheConfiguration: {
        queryStringCachingBehavior: KnownAfdQueryStringCachingBehavior.UseQueryString,
      },
      forwardingProtocol: KnownForwardingProtocol.MatchRequest,
      linkToDefaultDomain: KnownLinkToDefaultDomain.Enabled,
      httpsRedirect: KnownHttpsRedirect.Enabled,
    }),
  ])

  const url = `https://${endpoint.hostName}`

  return {
    profile,
    url,
    waitForFrontDoor: () => waitForFrontDoor(url),
  }
}

async function waitForFrontDoor(url: string) {
  console.info('Waiting for front door to be ready...', url)

  const policy = retry(handleAll, {
    backoff: new ExponentialBackoff({
      // 5 minutes
      maxDelay: 1000 * 60 * 5,
    }),
    maxAttempts: 40,
  })

  return policy.execute(async ({ attempt }) => {
    if (attempt > 1) {
      console.info(`Attempt ${attempt}...`)
    }

    const response = await fetch(url)
    const text = await response.text()

    if (response.status !== 200) {
      throw new Error(`Response not ok: ${response.status}`)
    }

    if (text.includes('Page not found')) {
      throw new Error('Page not found')
    }

    console.log('Frontdoor is ready!')
  })
}

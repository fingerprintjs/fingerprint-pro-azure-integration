import { app } from '@azure/functions'
import managementFn from './management/index.ts'
import proxyFn from './proxy/index.ts'

app.timer('management', {
  schedule: '*/30 * * * *',
  handler: managementFn,
  runOnStartup: false,
})

app.http('proxy', {
  authLevel: 'anonymous',
  handler: proxyFn,
  route: '{*restOfPath}',
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'PUT'],
})

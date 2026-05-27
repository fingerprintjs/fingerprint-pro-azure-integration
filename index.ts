import { app } from '@azure/functions'
import managementFn from './management'
import proxyFn from './proxy'

app.timer('management', {
  schedule: '*/30 * * * *',
  handler: managementFn,
  runOnStartup: false,
})

app.http('proxy', {
  authLevel: 'anonymous',
  handler: proxyFn,
  route: '{*restOfPath}',
  methods: ['GET', 'POST'],
})

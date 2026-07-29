export async function getIntegrationVersion() {
  return import('../package.json').then(({ version }) => version)
}

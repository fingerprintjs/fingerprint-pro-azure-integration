export enum Region {
  us = 'us',
  eu = 'eu',
  ap = 'ap',
}

export function getValidRegion(region: string) {
  if (region in Region) {
    return region
  }

  return Region.us
}

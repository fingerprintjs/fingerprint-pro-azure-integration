export enum Region {
  us = 'us',
  eu = 'eu',
  ap = 'ap',
}

export function getValidRegion(region: string): Region {
  if (region in Region) {
    // `region` is guaranteed to be a valid `Region` value by the `in` check above.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return region as Region
  }

  return Region.us
}

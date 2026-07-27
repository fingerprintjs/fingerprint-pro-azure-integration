## 2.2.0-test.0

### Minor Changes

- Support remaining HTTP methods in proxy function ([35f8642](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/35f864239927e0515db0dcefe4893c0b5b55bee6))

## 2.1.0

### Minor Changes

- Introduce `maximumInstanceCount` parameter for managing the maximum instace count and set the default value to `100`. ([03aa4cf](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/03aa4cfcea36a23538d8637bc759110bd4788e96))

## 2.0.0

### Major Changes

- Migrate to a **Flex Consumption** plan and **runtime 4.x**.

  Microsoft is retiring the Consumption plan. [Learn more about the consumption plan change](https://learn.microsoft.com/en-us/azure/azure-functions/migration/migrate-plan-consumption-to-flex?tabs=azure-cli%2Ccopilot-cli%2Csystem-assigned%2Ccontinuous%2Cbicep%2Ctraces-table&pivots=platform-linux#migration-methods).

  To use the new plan, you need to re-deploy the function app using the v2 version. [See the migration guide for details.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2) ([ecfc104](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/ecfc1049ac64d6d197b07bc7ddad049275a53693))

### Minor Changes

- Update management function to support runtime 4.x and Flex Consumption plan ([cf68344](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/cf68344d11510431c0a6d727e05cd5d4ac61757f))
- Update Node.js runtime to 24. ([e685126](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/e685126490199424ec05d3d8993fba2f00293bab))
- Add support for JS Agent V4.

  This change adds support for Fingerprint [JavaScript agent v4](https://docs.fingerprint.com/reference/js-agent-v4). Compatibility with JavaScript agent v3 is maintained, you can upgrade to the latest JavaScript agent at your convenience.

  When upgrading to the JavaScript agent v4, remove the `scriptUrlPattern` and `endpoint` options. Replace them with a single `endpoints` option pointing to your Front Door integration domain:

  ```diff
  - const fpPromise = FingerprintJS.load({
  -   apiKey: PUBLIC_API_KEY,
  -   scriptUrlPattern: "https://yourwebsite.com/ROUTE_PREFIX/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=<apiKey&version=<version&loaderVersion=<loaderVersion",
  -   endpoint: "https://yourwebsite.com/ROUTE_PREFIX/GET_RESULT_PATH?region=eu",
  - });

  + const fpPromise = Fingerprint.start({
  +   apiKey: PUBLIC_API_KEY,
  +   endpoints: "https://yourwebsite.com/ROUTE_PREFIX/?region=eu",
  + });
  ```

  To migrate your v1 integration to v2, [see the migration guide.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2) ([db41124](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/db41124634f10ee3444434984c435072f1981e9e))

- Bump @azure/\* dependencies to the latest version. ([5d20f07](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/5d20f073855cea9f1ae9938fc6de1114d2286813))

## 2.0.0-test.1

### Minor Changes

- Update management function to support runtime 4.x and Flex Consumption plan ([cf68344](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/cf68344d11510431c0a6d727e05cd5d4ac61757f))

## 2.0.0-test.0

### Major Changes

- Migrate to a **Flex Consumption** plan and **runtime 4.x**.

  > [!IMPORTANT] Microsoft is retiring the Consumption plan. [Learn more about the consumption plan change](https://learn.microsoft.com/en-us/azure/azure-functions/migration/migrate-plan-consumption-to-flex?tabs=azure-cli%2Ccopilot-cli%2Csystem-assigned%2Ccontinuous%2Cbicep%2Ctraces-table&pivots=platform-linux#migration-methods).

  > [!TIP] To use the new plan, you need to re-deploy the function app using the v2 version. [See the migration guide for details.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2) ([ecfc104](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/ecfc1049ac64d6d197b07bc7ddad049275a53693))

### Minor Changes

- Update Node.js runtime to 24. ([e685126](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/e685126490199424ec05d3d8993fba2f00293bab))
- Add support for JS Agent V4.

  > [!NOTE] This change adds support for Fingerprint [JavaScript agent v4](https://docs.fingerprint.com/reference/js-agent-v4). Compatibility with JavaScript agent v3 is maintained, you can upgrade to the latest JavaScript agent at your convenience.
  >
  > When upgrading to the JavaScript agent v4, remove the `scriptUrlPattern` and `endpoint` options. Replace them with a single `endpoints` option pointing to your Front Door integration domain:
  >
  > ```diff
  > - const fpPromise = FingerprintJS.load({
  > -   apiKey: PUBLIC_API_KEY,
  > -   scriptUrlPattern: "https://yourwebsite.com/ROUTE_PREFIX/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>",
  > -   endpoint: "https://yourwebsite.com/ROUTE_PREFIX/GET_RESULT_PATH?region=eu",
  > - });
  >
  > + const fpPromise = Fingerprint.start({
  > +   apiKey: PUBLIC_API_KEY,
  > +   endpoints: "https://yourwebsite.com/ROUTE_PREFIX/?region=eu",
  > + });
  > ```

  To migrate your v1 integration to v2, [see the migration guide.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2) ([db41124](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/db41124634f10ee3444434984c435072f1981e9e))

- Bump @azure/\* dependencies to the latest version. ([5d20f07](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/5d20f073855cea9f1ae9938fc6de1114d2286813))

## 1.6.0

### Minor Changes

- Prevent automatic upgrade to next major version. ([f5b841e](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/f5b841eb990402a942aac80a3c5552accad64224))

### Patch Changes

- Handle scoped tag names when comparing release versions ([cf2d0f6](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/cf2d0f675d9d3c1319523e24b74ba581aa687d28))

## 1.6.0-rc.1

### Patch Changes

- Handle scoped tag names when comparing release versions ([cf2d0f6](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/cf2d0f675d9d3c1319523e24b74ba581aa687d28))

## 1.6.0-rc.0

### Minor Changes

- Prevent automatic upgrade to next major version. ([f5b841e](https://github.com/fingerprintjs/azure-frontdoor-proxy/commit/f5b841eb990402a942aac80a3c5552accad64224))

## [1.5.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.5.0...v1.5.1) (2025-03-20)

### Bug Fixes

- send other proxy headers even if proxy secret is undefined ([b6dc485](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/b6dc4857f8c27c77360af283e8d7e4ca668a3cf0))

## [1.5.1-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.5.0...v1.5.1-rc.1) (2025-03-20)

### Bug Fixes

- send other proxy headers even if proxy secret is undefined ([b6dc485](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/b6dc4857f8c27c77360af283e8d7e4ca668a3cf0))

## [1.5.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1...v1.5.0) (2024-07-22)

### Features

- use node 20 in deployment template ([fa9d8af](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/fa9d8afe35f78465792bd27c1b1dd7f236d44cbd))

## [1.5.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1...v1.5.0-rc.1) (2024-07-22)

### Features

- use node 20 in deployment template ([fa9d8af](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/fa9d8afe35f78465792bd27c1b1dd7f236d44cbd))

## [1.4.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.0...v1.4.1) (2024-06-25)

### Bug Fixes

- don't use `host` header for determining request url ([639602e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/639602e06beae4433a06f32357d6ccdd4488486d))
- fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))
- omit cookies when sending request to CDN ([c7f3783](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/c7f3783280ed4c87d33e938bc19446c3c408f14f))
- preserve query parameters for agent request ([49eb9c7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/49eb9c7fd1ed51baae67ac652fc085fbc3c7e7bf))
- provide correct fpjs-proxy-forwarded-host header when using frontdoor ([341094f](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/341094f7b3f8ba3e67b88503b90089ce189b94e2))
- rely only on non-spoofable `x-azure-socketip` for resolving client ip ([7f818ca](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/7f818ca38e9ffd6d6b88e7757be1da66d8c9581b))
- remove cookies for browser cache requests ([4329da6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4329da66fdba1b152f7195b8eaca259c2c34860b))
- set cookies to undefined if \_iidt cookie is not present in ingress request ([554b1e6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/554b1e6876bf0bb8fb1f0fe445fc5875a27126d7))
- simplify cookie parsing ([37852fd](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/37852fd1a27f685413730fa5f6b92d71a8207fd3))
- strip port from client ip ([0ccf5a2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0ccf5a218badba417a704136b521a89f34724c01))
- use x-azure-socketip first for resolving client ip ([4e0db7b](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4e0db7b07530c2542130e87a0cefc78350a5bebf))

### Build System

- **deps:** bump @azure/identity from 4.0.1 to 4.2.1 ([d6bad44](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/d6bad442dfa95af4fc89baca8a636f580daeeed5))

## [1.4.1-rc.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1-rc.1...v1.4.1-rc.2) (2024-06-20)

### Bug Fixes

- fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))

## [1.4.1-rc.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1-rc.1...v1.4.1-rc.2) (2024-06-20)

### Bug Fixes

- fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))

## [1.4.1-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.0...v1.4.1-rc.1) (2024-06-19)

### Bug Fixes

- don't use `host` header for determining request url ([639602e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/639602e06beae4433a06f32357d6ccdd4488486d))
- omit cookies when sending request to CDN ([c7f3783](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/c7f3783280ed4c87d33e938bc19446c3c408f14f))
- preserve query parameters for agent request ([49eb9c7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/49eb9c7fd1ed51baae67ac652fc085fbc3c7e7bf))
- provide correct fpjs-proxy-forwarded-host header when using frontdoor ([341094f](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/341094f7b3f8ba3e67b88503b90089ce189b94e2))
- rely only on non-spoofable `x-azure-socketip` for resolving client ip ([7f818ca](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/7f818ca38e9ffd6d6b88e7757be1da66d8c9581b))
- remove cookies for browser cache requests ([4329da6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4329da66fdba1b152f7195b8eaca259c2c34860b))
- set cookies to undefined if \_iidt cookie is not present in ingress request ([554b1e6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/554b1e6876bf0bb8fb1f0fe445fc5875a27126d7))
- simplify cookie parsing ([37852fd](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/37852fd1a27f685413730fa5f6b92d71a8207fd3))
- strip port from client ip ([0ccf5a2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0ccf5a218badba417a704136b521a89f34724c01))
- use x-azure-socketip first for resolving client ip ([4e0db7b](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4e0db7b07530c2542130e87a0cefc78350a5bebf))

### Build System

- **deps:** bump @azure/identity from 4.0.1 to 4.2.1 ([d6bad44](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/d6bad442dfa95af4fc89baca8a636f580daeeed5))

## [1.4.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0) (2024-04-08)

### Features

- update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-08)

### Features

- update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-08)

### Features

- update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-05)

### Features

- update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.3.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.4...v1.3.0) (2023-12-20)

### Features

- remove public suffix list and add proxy-host-header as replacement ([a7308d4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a7308d47c99ca73d7285a14275f8baf614937781))

## [1.3.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.4...v1.3.0-rc.1) (2023-12-20)

### Features

- remove public suffix list and add proxy-host-header as replacement ([a7308d4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a7308d47c99ca73d7285a14275f8baf614937781))

## [1.2.4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.3...v1.2.4) (2023-12-13)

### Bug Fixes

- improve endpoint creation ([dd84407](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/dd84407f10cb4a010c3cfc73b02ae41e95d086e5))

## [1.2.4-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.3...v1.2.4-rc.1) (2023-12-13)

### Bug Fixes

- improve endpoint creation ([dd84407](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/dd84407f10cb4a010c3cfc73b02ae41e95d086e5))

## [1.2.3](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3) (2023-12-01)

### Bug Fixes

- validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.3-test.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3-test.1) (2023-11-28)

### Bug Fixes

- validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.3-test.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3-test.1) (2023-11-27)

### Bug Fixes

- validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.1...v1.2.2) (2023-11-20)

### Bug Fixes

- add fallback for empty fpcdn and ingress api ([5fefb9d](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/5fefb9d1a69177c81769e3f5bc115b9deead0db5))

## [1.2.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.0...v1.2.1) (2023-11-13)

### Build System

- **deps:** bump semver from 7.5.1 to 7.5.4 ([73c6953](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/73c6953e543e11d0b3742801b792aecd66543bfd))

## [1.2.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.1.2...v1.2.0) (2023-11-09)

### Features

- setup semantic-release for automated releases ([0232b7e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0232b7e416ad1d8e8bf084645838e84db68173ea))

### Build System

- **deps:** bump @babel/traverse from 7.21.2 to 7.23.3 ([529aabb](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/529aabb2fecd49514e1aebb7e839a7c7a2ad1374))
- **deps:** bump postcss from 8.4.23 to 8.4.31 ([f0adb34](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/f0adb34d9a46fcb88138e20eeb4e3e1cf9448ddb))

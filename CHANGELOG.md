## [1.5.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1...v1.5.0) (2024-07-22)


### Features

* use node 20 in deployment template ([fa9d8af](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/fa9d8afe35f78465792bd27c1b1dd7f236d44cbd))

## [1.5.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1...v1.5.0-rc.1) (2024-07-22)


### Features

* use node 20 in deployment template ([fa9d8af](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/fa9d8afe35f78465792bd27c1b1dd7f236d44cbd))

## [1.4.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.0...v1.4.1) (2024-06-25)


### Bug Fixes

* don't use `host` header for determining request url ([639602e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/639602e06beae4433a06f32357d6ccdd4488486d))
* fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))
* omit cookies when sending request to CDN ([c7f3783](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/c7f3783280ed4c87d33e938bc19446c3c408f14f))
* preserve query parameters for agent request ([49eb9c7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/49eb9c7fd1ed51baae67ac652fc085fbc3c7e7bf))
* provide correct fpjs-proxy-forwarded-host header when using frontdoor ([341094f](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/341094f7b3f8ba3e67b88503b90089ce189b94e2))
* rely only on non-spoofable `x-azure-socketip` for resolving client ip ([7f818ca](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/7f818ca38e9ffd6d6b88e7757be1da66d8c9581b))
* remove cookies for browser cache requests ([4329da6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4329da66fdba1b152f7195b8eaca259c2c34860b))
* set cookies to undefined if _iidt cookie is not present in ingress request ([554b1e6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/554b1e6876bf0bb8fb1f0fe445fc5875a27126d7))
* simplify cookie parsing ([37852fd](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/37852fd1a27f685413730fa5f6b92d71a8207fd3))
* strip port from client ip ([0ccf5a2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0ccf5a218badba417a704136b521a89f34724c01))
* use x-azure-socketip first for resolving client ip ([4e0db7b](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4e0db7b07530c2542130e87a0cefc78350a5bebf))


### Build System

* **deps:** bump @azure/identity from 4.0.1 to 4.2.1 ([d6bad44](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/d6bad442dfa95af4fc89baca8a636f580daeeed5))

## [1.4.1-rc.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1-rc.1...v1.4.1-rc.2) (2024-06-20)


### Bug Fixes

* fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))

## [1.4.1-rc.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.1-rc.1...v1.4.1-rc.2) (2024-06-20)


### Bug Fixes

* fix broken mgmt function when using Node20 runtime ([a22e351](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a22e3517dec67dc0b8bbf5c0755560ee23ba3b20))

## [1.4.1-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.4.0...v1.4.1-rc.1) (2024-06-19)


### Bug Fixes

* don't use `host` header for determining request url ([639602e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/639602e06beae4433a06f32357d6ccdd4488486d))
* omit cookies when sending request to CDN ([c7f3783](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/c7f3783280ed4c87d33e938bc19446c3c408f14f))
* preserve query parameters for agent request ([49eb9c7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/49eb9c7fd1ed51baae67ac652fc085fbc3c7e7bf))
* provide correct fpjs-proxy-forwarded-host header when using frontdoor ([341094f](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/341094f7b3f8ba3e67b88503b90089ce189b94e2))
* rely only on non-spoofable `x-azure-socketip` for resolving client ip ([7f818ca](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/7f818ca38e9ffd6d6b88e7757be1da66d8c9581b))
* remove cookies for browser cache requests ([4329da6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4329da66fdba1b152f7195b8eaca259c2c34860b))
* set cookies to undefined if _iidt cookie is not present in ingress request ([554b1e6](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/554b1e6876bf0bb8fb1f0fe445fc5875a27126d7))
* simplify cookie parsing ([37852fd](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/37852fd1a27f685413730fa5f6b92d71a8207fd3))
* strip port from client ip ([0ccf5a2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0ccf5a218badba417a704136b521a89f34724c01))
* use x-azure-socketip first for resolving client ip ([4e0db7b](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/4e0db7b07530c2542130e87a0cefc78350a5bebf))


### Build System

* **deps:** bump @azure/identity from 4.0.1 to 4.2.1 ([d6bad44](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/d6bad442dfa95af4fc89baca8a636f580daeeed5))

## [1.4.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0) (2024-04-08)


### Features

* update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-08)


### Features

* update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-08)


### Features

* update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.4.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.3.0...v1.4.0-rc.1) (2024-04-05)


### Features

* update dependencies ([40fb0a7](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/40fb0a7cfa5cebe7f682ea66083c90b88a11e00c))

## [1.3.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.4...v1.3.0) (2023-12-20)


### Features

* remove public suffix list and add proxy-host-header as replacement ([a7308d4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a7308d47c99ca73d7285a14275f8baf614937781))

## [1.3.0-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.4...v1.3.0-rc.1) (2023-12-20)


### Features

* remove public suffix list and add proxy-host-header as replacement ([a7308d4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/a7308d47c99ca73d7285a14275f8baf614937781))

## [1.2.4](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.3...v1.2.4) (2023-12-13)


### Bug Fixes

* improve endpoint creation ([dd84407](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/dd84407f10cb4a010c3cfc73b02ae41e95d086e5))

## [1.2.4-rc.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.3...v1.2.4-rc.1) (2023-12-13)


### Bug Fixes

* improve endpoint creation ([dd84407](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/dd84407f10cb4a010c3cfc73b02ae41e95d086e5))

## [1.2.3](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3) (2023-12-01)


### Bug Fixes

* validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.3-test.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3-test.1) (2023-11-28)


### Bug Fixes

* validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.3-test.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.2...v1.2.3-test.1) (2023-11-27)


### Bug Fixes

* validate env values on build ([24ce787](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/24ce787358bb2fdca0be9fac9623338912c26b4c))

## [1.2.2](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.1...v1.2.2) (2023-11-20)


### Bug Fixes

* add fallback for empty fpcdn and ingress api ([5fefb9d](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/5fefb9d1a69177c81769e3f5bc115b9deead0db5))

## [1.2.1](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.2.0...v1.2.1) (2023-11-13)


### Build System

* **deps:** bump semver from 7.5.1 to 7.5.4 ([73c6953](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/73c6953e543e11d0b3742801b792aecd66543bfd))

## [1.2.0](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/compare/v1.1.2...v1.2.0) (2023-11-09)


### Features

* setup semantic-release for automated releases ([0232b7e](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/0232b7e416ad1d8e8bf084645838e84db68173ea))


### Build System

* **deps:** bump @babel/traverse from 7.21.2 to 7.23.3 ([529aabb](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/529aabb2fecd49514e1aebb7e839a7c7a2ad1374))
* **deps:** bump postcss from 8.4.23 to 8.4.31 ([f0adb34](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/commit/f0adb34d9a46fcb88138e20eeb4e3e1cf9448ddb))

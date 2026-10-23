---
'@fingerprint/azure-frontdoor-proxy': patch
---

Pass the origin's `Cache-Control` for the agent as it is, without capping `max-age` or adding `s-maxage`. Serve the agent with `Age: 0` and without the upstream `Cache-Tag`. Return upstream `304` responses instead of failing with `500`.

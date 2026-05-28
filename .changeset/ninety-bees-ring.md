---
'@fingerprint/azure-frontdoor-proxy': minor
---

Add support for JS Agent V4.

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

To migrate your v1 integration to v2, [see the migration guide.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2)

---
'@fingerprint/azure-frontdoor-proxy': major
---

Migrate to a **Flex Consumption** plan and **runtime 4.x**.

 Microsoft is retiring the Consumption plan. [Learn more about the consumption plan change](https://learn.microsoft.com/en-us/azure/azure-functions/migration/migrate-plan-consumption-to-flex?tabs=azure-cli%2Ccopilot-cli%2Csystem-assigned%2Ccontinuous%2Cbicep%2Ctraces-table&pivots=platform-linux#migration-methods).

To use the new plan, you need to re-deploy the function app using the v2 version. [See the migration guide for details.](https://docs.fingerprint.com/docs/azure-proxy-integration-migration-from-v1-to-v2)

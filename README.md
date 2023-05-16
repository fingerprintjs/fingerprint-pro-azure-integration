<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="assets/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="assets/logo_dark.svg" />
     <img src="assets/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
<p align="center">
<a href="https://github.com/fingerprintjs/fingerprint-pro-azure-integration">
  <img src="https://img.shields.io/github/v/release/fingerprintjs/fingerprint-pro-azure-integration" alt="Current version">
</a>
<a href="https://fingerprintjs.github.io/fingerprint-pro-azure-integration">
  <img src="https://fingerprintjs.github.io/fingerprint-pro-azure-integration/badges.svg" alt="coverage">
</a>
<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license">
</a>
<a href="https://discord.gg/39EpE2neBg">
  <img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server">
</a>

# Fingerprint Pro Azure Integration

[![Deploy To Azure](https://raw.githubusercontent.com/fingerprintjs/fingerprint-pro-azure-integration/main/assets/azure/deploytoazure.svg?sanitize=true)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Ffingerprintjs%2Ffingerprint-pro-azure-integration%2Fmain%2Fazuredeploy.json)
[![Visualize](https://raw.githubusercontent.com/fingerprintjs/fingerprint-pro-azure-integration/main/assets/azure/visualizebutton.svg?sanitize=true)](http://armviz.io/#/?load=https%3A%2F%2Fraw.githubusercontent.com%2Ffingerprintjs%2Ffingerprint-pro-azure-integration%2Fmain%2Fazuredeploy.json)
  
Fingerprint Pro CloudFront Integration is responsible for:

* Proxying download requests of the latest Fingerprint Pro JS Agent between your site and Fingerprint CDN.
* Proxying identification requests and responses between your site and Fingerprint Pro API.
  
This [improves](https://dev.fingerprint.com/docs/azure-proxy-integration#the-benefits-of-using-the-azure-integration) both accurancy and reliability of visitor identification and bot detection on your site.

## Setup

To set up the Azure integration, you need to:
  
1. Create the required resources in your Azure infrastructure - a deployment template is available.
2. Configure the Fingerprint Pro JS Agent on your site to communicate with your created Azure function using the [endpoint](https://dev.fingerprint.com/docs/js-agent#endpoint) parameter.

See [Azure Proxy Integration guide](https://dev.fingerprint.com/docs/azure-proxy-integration) in our documentation for step-by-step instructions. If you have any questions, reach out to our [support team](https://fingerprint.com/support/). 

## License
This project is licensed under the MIT license. See the [LICENSE](https://github.com/fingerprintjs/fingerprint-pro-azure-integration/blob/main/LICENSE) file for more info.

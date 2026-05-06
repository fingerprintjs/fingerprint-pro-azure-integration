# Contributing to FingerprintJS Pro Azure Integration

## Working with code

We prefer using [pnpm](https://pnpm.io/) for installing dependencies and running scripts.

For proposing changes, use the standard [pull request approach](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request). It's recommended to discuss fixes or new functionality in the Issues, first.

* The `main` branches are locked for the push action.
* Releases are created from the `main` branch. If you have Azure Integration set up, it is running code from the `main` branch.

### How to build
* After cloning the repository, run `pnpm install` to install dependencies.

* Run `pnpm build` to build the project into the `dist` folder. The created `dist/fingerprintjs-pro-azure-function/fingerprintjs-pro-azure-function.js` and `dist/fingerprintjs-pro-azure-function-management/fingerprintjs-pro-azure-function-management.js` are meant to be deployed to Azure Functions.

### How to deploy to Azure Functions

1. Install the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and sign in to Azure account according to the [Sign in with Azure CLI](https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli) guide.

2. Install the [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools).

3. Build the project.

4. Go to the `dist` directory and run
    ```shell
    func azure functionapp publish <AppFunctionName>
    ```
    where `<AppFunctionName>` is a Azure Function App name in the Azure account.


You can invoke the function from your local environment using the [start command](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash#start) in Azure Functions Core Tools.


### How to run the function locally

* Run `pnpm start` to run and debug the function locally via [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-develop-local).
* You can run `pnpm emulate-storage` to locally emulate your Azure Storage account using [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite?tabs=visual-studio). 


### Code style

Consistent code formatting is enforced by [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). To check your code, run:
```shell
pnpm lint
```

You don't need to do this manually, CI runs the check automatically. To fix all auto-fixable issues at once, run:
```shell
pnpm lint:fix
```

### Commit style

You are required to follow [conventional commits](https://www.conventionalcommits.org) rules.

### How to release a new version

We use [changesets](https://github.com/changesets/changesets) for handling release notes. If there are relevant changes, please add them to changeset via `pnpm exec changeset`. You need to run `pnpm install` before doing so.

Every change requires a pre-release first:
```shell
pnpm exec changeset pre enter rc
```

When the PR is merged, the pre-release is created and E2E tests run against it. Once the tests pass, a stable release can be created:
```shell
pnpm exec changeset pre exit
```
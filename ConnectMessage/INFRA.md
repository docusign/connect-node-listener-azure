# Azure Infrastructure

To deploy the infrastructure in your Azure subscription, follow the instructions below.

## Prerequisites

Ensure you have [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/) installed. You will also need the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) for the final setup step. Be sure to first run `npm i` in current directory.

## Steps:
 1) Define the following environment variables:
    - `LOCATION` : The Azure region to deploy the infra to. For example, `East US`. For a full list of regions, see [region list](https://azure.microsoft.com/en-us/global-infrastructure/geographies/#geographies).
    - `SUB_ID`: Your Azure subscription ID.
    - `AUTH_NAME`: Your Connect authentication user name.
    - `BASIC_AUTH_PW`: Your Connection authentication password.
    - `HMAC`: HMAC to use for verification.
2) After the variables are set, you can simply do: `sls deploy` to deploy the infrastructure. Serverless will promopt you to log into your Azure subscription.
3) The Azure plugin for Serverless doesn't currently allow for referencing the Azure resources in `serverless.yml` file and there is a feature request pending on [this](https://github.com/serverless/serverless-azure-functions/issues/531). As a workaround, you'd need to manually run `postSetup.sh` after step 2 is completed.

After step 3 is completed, you'll be presented with a URL that you can use in your Connect configuration. Example: `https://xxxxs-connect-node-listener-azure.azurewebsites.net`


Refer to [Serverless docs](https://serverless.com/framework/docs/providers/azure/guide/intro/) for more information.

# Bicep Template Summary (`infrastructure/main.bicep`)

This document summarizes the Azure resources and configurations defined in the `main.bicep` template for the LogoCraftWeb application.

## Parameters

The template accepts the following parameters:

-   `location`: (string) The Azure region for deployment (defaults to the resource group's location).
-   `functionAppName`: (string) The name for the Azure Function App (defaults to `logocraftfunctions`).
-   `storageAccountName`: (string) The name for the Azure Storage Account (defaults to `logocraftstorage2200`).
-   `webAppName`: (string) The name for the Azure Web App (defaults to `logocraftweb`).
-   `appServicePlanName`: (string) The name for the Azure App Service Plan (defaults to `logocraftASP`).

## Variables

The template defines the following variables for application settings:

-   `functionAppSettings`: An array containing application settings for the Function App.
    -   `AzureWebJobsStorage__accountName`: Set to `storageAccountName`.
    -   `AzureWebJobsStorage__credential`: Set to `managedidentity`.
    -   `STORAGE_ACCOUNT_NAME`: Set to `storageAccountName`.
    -   `FUNCTIONS_EXTENSION_VERSION`: Set to `~4`.
    -   `FUNCTIONS_WORKER_RUNTIME`: Set to `node`.
    -   `NODE_VERSION`: Set to `~20`.
-   `webAppSettings`: An array containing application settings for the Web App.
    -   `FUNCTION_APP_URL`: Dynamically set to the Function App's hostname (`https://${functionAppName}.azurewebsites.net`).
    -   `SCM_DO_BUILD_DURING_DEPLOYMENT`: Set to `false`.
    -   `WEBSITE_NODE_DEFAULT_VERSION`: Set to `~20`.

## Resources

The following Azure resources are defined:

### 1. Storage Account (`storageAccount`)

-   **Type**: `Microsoft.Storage/storageAccounts@2022-09-01`
-   **Name**: Parameter `storageAccountName` (`logocraftstorage2200`)
-   **Location**: Parameter `location`
-   **SKU**: `Standard_LRS`
-   **Kind**: `StorageV2`
-   **Properties**:
    -   `supportsHttpsTrafficOnly`: `true`
    -   `allowBlobPublicAccess`: `false`
    -   `allowSharedKeyAccess`: `false`
    -   `minimumTlsVersion`: `TLS1_2`

### 2. App Service Plan (`appServicePlan`)

-   **Type**: `Microsoft.Web/serverfarms@2022-09-01`
-   **Name**: Parameter `appServicePlanName` (`logocraftASP`)
-   **Location**: Parameter `location`
-   **SKU**: `B1` (Basic tier)
-   **Kind**: `linux`
-   **Properties**:
    -   `reserved`: `true` (Required for Linux)

### 3. Function App (`functionApp`)

-   **Type**: `Microsoft.Web/sites@2022-09-01`
-   **Name**: Parameter `functionAppName` (`logocraftfunctions`)
-   **Location**: Parameter `location`
-   **Kind**: `functionapp`
-   **Identity**: System-Assigned Managed Identity enabled.
-   **Properties**:
    -   `serverFarmId`: Linked to `appServicePlan`.
    -   `httpsOnly`: `true`
    -   `siteConfig`:
        -   `appSettings`: Uses the `functionAppSettings` variable.
        -   `ftpsState`: `FtpsOnly`
-   **Depends On**: `storageAccount`

### 4. Web App (`webApp`)

-   **Type**: `Microsoft.Web/sites@2022-09-01`
-   **Name**: Parameter `webAppName` (`logocraftweb`)
-   **Location**: Parameter `location`
-   **Kind**: `app`
-   **Identity**: System-Assigned Managed Identity enabled.
-   **Properties**:
    -   `serverFarmId`: Linked to `appServicePlan`.
    -   `httpsOnly`: `true`
    -   `siteConfig`:
        -   `linuxFxVersion`: `NODE|20-lts`
        -   `appSettings`: Uses the `webAppSettings` variable.
        -   `ftpsState`: `FtpsOnly`
-   **Depends On**: `functionApp` (Implicit dependency on `appServicePlan` via `serverFarmId`)

## Role Assignments

The template assigns the following Azure RBAC roles to the Function App's Managed Identity on the Storage Account:

1.  **Storage Blob Data Contributor**: Allows the Function App to read and write blob data.
    -   **Resource**: `blobDataContributorRoleAssignment`
    -   **Scope**: `storageAccount`
    -   **Principal ID**: `functionApp.identity.principalId`
    -   **Role Definition ID**: `ba92f5b4-2d11-453d-a403-e96b0029c9fe`
2.  **Storage Blob Delegator**: Allows the Function App to generate user delegation SAS tokens.
    -   **Resource**: `blobDelegatorRoleAssignment`
    -   **Scope**: `storageAccount`
    -   **Principal ID**: `functionApp.identity.principalId`
    -   **Role Definition ID**: `db58b8e5-c6ad-4a2a-8342-4190687cbf4a`

## Outputs

The template provides the following outputs:

-   `functionAppHostname`: (string) The default hostname of the deployed Function App.
-   `webAppHostname`: (string) The default hostname of the deployed Web App.

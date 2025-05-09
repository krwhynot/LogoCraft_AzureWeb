# Changelog

## [2025-05-09] - Azure Infrastructure Refactoring and Deployment

**Objective:** Resolve Azure deployment issues related to "Dynamic SKU, Linux Worker" compatibility, Key Vault naming conflicts, soft-delete/purge protection issues, incorrect Role Definition IDs, and regional SKU quotas. Implement a robust, two-resource-group deployment structure.

**Summary of Changes:**

1.  **Deployment Strategy Overhaul:**
    *   Split resources into two new dedicated resource groups:
        *   `LogoCraft-Web-RG`: Hosts the Web App, its App Service Plan, Storage Account, Application Insights (shared), and Key Vault.
        *   `LogoCraft-Func-RG`: Hosts the Function App and its Linux Consumption Plan.
    *   Changed target deployment region from `eastus` to `centralus` to resolve SKU quota limitations.

2.  **Bicep File Restructuring (`infrastructure/`):**
    *   **`main.bicep` (for `LogoCraft-Web-RG`):**
        *   Defines Web App, Web App Plan, Storage Account, Application Insights, and Key Vault.
        *   Simplified resource naming (e.g., `logocraftweb-insights`, `logocraftwebstore...`, `webvault...`).
        *   Key Vault `enableSoftDelete` and `enablePurgeProtection` set to `true` (reverted from a temporary `false` during debugging, as new names resolve conflicts).
        *   Corrected the Role Definition ID for "Key Vault Secrets User" to the environment-specific ID: `4633458b-17de-408a-b874-0445c86b69e6`.
        *   Outputs essential values like `storageAccountId`, `storageAccountName`, `appInsightsConnectionString`, `webAppName`, `webAppHostName`, `keyVaultName`, `keyVaultUri`.
    *   **`function.bicep` (for `LogoCraft-Func-RG`, formerly `functionApp.bicep`):**
        *   Defines Function App and its Linux Consumption Plan.
        *   Simplified resource naming (e.g., `logocraftfunc-plan`, `logocraftfunc-app`).
        *   Receives `storageAccountName` and `appInsightsConnectionString` as parameters.
        *   Configures `AzureWebJobsStorage` to use Managed Identity.
        *   Sets CORS to allow requests from the Web App (`https://logocraftweb-app.azurewebsites.net`).
        *   Outputs `functionAppHostName` and `functionAppPrincipalId`.
    *   Removed unused parameters and variables from both Bicep files.

3.  **PowerShell Deployment Script (`infrastructure/deploy.ps1`):**
    *   Updated to target `centralus` and the new resource group names (`LogoCraft-Web-RG`, `LogoCraft-Func-RG`).
    *   Ensures both resource groups are created if they don't exist.
    *   Deploys `main.bicep` then `function.bicep`, passing necessary outputs.
    *   Updates the Web App's `FUNCTION_APP_URL` app setting with the deployed Function App's hostname.
    *   Assigns RBAC roles to the Function App's Managed Identity for the Storage Account:
        *   Uses specific Role Definition IDs for all assignments, including the environment-specific ID for "Storage Blob Delegator" (`db58b8e5-c6ad-4a2a-8342-4190687cbf4a`) and standard IDs for other storage roles.
        *   Uses the `-RoleDefinitionId` parameter for `New-AzRoleAssignment`.
    *   Improved error handling with `try...catch` blocks and `$ErrorActionPreference = 'Stop'`.
    *   Added verbose output and debugging lines (which can be removed now post-success).

**Outcome:**
*   The deployment now completes successfully.
*   All resources are provisioned in the `centralus` region across the two specified resource groups.
*   The Web App is configured to communicate with the Function App.
*   The Function App has the necessary permissions on the Storage Account via its Managed Identity.
*   Key Vault naming conflicts and soft-delete/purge issues are resolved by using new resource group names and ensuring correct Key Vault configuration.
*   Role Definition ID issues are resolved by using environment-specific IDs.

**Next Steps (Post-Deployment):**
*   Verify application functionality.
*   Consider removing or commenting out detailed debug `Write-Host` lines from `deploy.ps1` for cleaner future runs.
*   Update `cline_docs/activeContext.md` and `cline_docs/progress.md` to reflect the successful deployment and current state.

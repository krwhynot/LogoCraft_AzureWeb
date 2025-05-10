# Active Context

## What you're working on now
Refactoring LogoCraftWeb for a **Simplified Azure Implementation**. This involves:
- Consolidating backend logic into a single Azure Function.
- Switching to Azure Static Web Apps for frontend hosting with integrated functions.
- Simplifying authentication to use function-generated SAS tokens (via storage account connection string) instead of Managed Identity for the initial deployment.
- Updating Bicep templates and GitHub Actions workflows to support this new architecture.
- Updating all relevant memory bank documentation.

## Recent changes (Current Simplification Task)
1.  **Backend Azure Function (`api/ProcessImage/index.js`):**
    *   Consolidated `GetSasToken` and `ProcessImage` functionalities into a single function.
    *   Modified to use Azure Storage connection string for SAS token generation and blob access.
    *   Removed Managed Identity specific code (e.g., `DefaultAzureCredential`).
    *   Updated `function.json` to accept GET and POST methods.
    *   Deleted the old `api/GetSasToken/` directory.

2.  **Frontend Service (`frontend/src/services/BlobService.js`):**
    *   Updated to interact with the single consolidated backend Azure Function for both SAS token retrieval and image processing requests.
    *   Removed direct calls to a separate `GetSasToken` endpoint.

3.  **Infrastructure as Code (`infrastructure/main.bicep`):**
    *   Rewritten to define an Azure Static Web App resource and the main Application Storage Account.
    *   Configured SWA for integrated functions from the `/api` directory.
    *   Set SWA application settings to include `AZURE_STORAGE_CONNECTION_STRING`.
    *   Configured storage containers (`uploads` private, `downloads` public blob).
    *   Removed definitions for separate App Service, App Service Plan, Key Vault, and standalone Function App.
    *   Deleted the old `infrastructure/function.bicep`.

4.  **GitHub Actions Workflows (`.github/workflows/`):**
    *   Updated `web-app-deploy.yml` to deploy to Azure Static Web Apps (including the API from `/api`).
    *   Updated `infrastructure-deploy.yml` to deploy the simplified `main.bicep` to a single resource group.
    *   Deleted the redundant `function-app-deploy.yml`.

5.  **File Cleanup:**
    *   Deleted `frontend/server.js`.

6.  **Memory Bank Documentation (`cline_docs/`):**
    *   Created `projectbrief.md` for the simplified architecture.
    *   Updated `systemPatterns.md` to reflect SWA, single function, and SAS token auth.
    *   Updated `techContext.md` for simplified auth and deployment.
    *   Updated `progress.md` to reflect current status and goals.
    *   This file (`activeContext.md`) is being updated now.

## Next steps
1.  **Finalize Documentation Updates:**
    *   Review and update `cline_docs/azure-architecture-template.md` to align with the implemented simplified architecture.

2.  **Deployment and Testing:**
    *   Ensure the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret is configured in the GitHub repository for the `web-app-deploy.yml` workflow.
    *   Ensure `AZURE_CREDENTIALS` secret is configured for the `infrastructure-deploy.yml` workflow.
    *   Trigger the `infrastructure-deploy.yml` workflow to provision/update Azure resources.
    *   Trigger the `web-app-deploy.yml` workflow to deploy the application (frontend and API) to Azure Static Web Apps.
    *   Thoroughly test the end-to-end application flow:
        *   Image upload (SAS token generation and use).
        *   Image processing.
        *   Display and download of processed images.
    *   Verify Azure Function logs and SWA configuration in the Azure portal.

3.  **Post-Deployment Review & Iteration:**
    *   Address any issues found during testing.
    *   Consider next enhancements as outlined in the updated `progress.md` (e.g., re-evaluating Managed Identity, UI improvements).

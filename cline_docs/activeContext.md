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
    *   Updated `progress.md` to reflect current status, goals, and successful local testing.
    *   Updated `azure-architecture-template.md` to align with the implemented simplified architecture.
    *   This file (`activeContext.md`) is being updated now.

7.  **Local End-to-End Testing:**
    *   Successfully tested the refactored application (frontend and single backend function) locally using SWA CLI and Azurite. This included SAS generation, file upload, image processing, and result storage.
    *   Resolved CORS issue for Azurite and protocol mismatch for SAS token generation.

## Next steps
1.  **Prepare for Azure Deployment:**
    *   **Verify GitHub Secrets:** Ensure `AZURE_CREDENTIALS` (for infrastructure deployment) and `AZURE_STATIC_WEB_APPS_API_TOKEN` (for SWA application deployment) are correctly configured in the GitHub repository secrets.
    *   **Review Bicep Parameters:** Confirm default parameters in `infrastructure/main.bicep` (like `location`, `namePrefix`) are suitable for the intended Azure deployment, or plan to override them in the `infrastructure-deploy.yml` workflow if needed.

2.  **Deploy Infrastructure to Azure:**
    *   Trigger the `.github/workflows/infrastructure-deploy.yml` workflow (e.g., by pushing a commit to the `main` branch that touches the `infrastructure/` folder, or by manual dispatch if configured).
    *   Monitor the workflow run in GitHub Actions for successful completion.
    *   Verify in the Azure portal that the Resource Group, Storage Account (with `uploads` and `downloads` containers correctly configured), Static Web App, and Application Insights resources are created.

3.  **Deploy Application to Azure Static Web App:**
    *   Trigger the `.github/workflows/web-app-deploy.yml` workflow (e.g., by pushing a commit to `main` that touches `frontend/` or `api/`, or by manual dispatch).
    *   Monitor the workflow run in GitHub Actions. This will build the frontend, package the API, and deploy them to the SWA resource created in the previous step.
    *   Verify SWA application settings (especially `AZURE_STORAGE_CONNECTION_STRING`) are correctly populated in the Azure portal for the SWA resource.

4.  **End-to-End Testing in Azure:**
    *   Access the deployed application using the URL provided by Azure Static Web Apps.
    *   Thoroughly test the complete application flow: image upload, processing, and download.
    *   Check Azure Function logs (via Application Insights or SWA monitoring) for any runtime errors.
    *   Verify files are correctly stored in the Azure Blob Storage containers.

5.  **Post-Deployment Review & Iteration:**
    *   Address any issues found during Azure testing.
    *   Consider next enhancements as outlined in the updated `progress.md` (e.g., re-evaluating Managed Identity, UI improvements).

# Plan for Simplified Azure Implementation (LogoCraft Web)

This plan outlines the steps to refactor LogoCraft Web for a simplified Azure architecture, based on the user-provided "Simplified Azure Implementation" document. The focus is on a single Azure Function, Azure Static Web Apps, basic Blob Storage, and function-managed SAS token authentication.

## Core Goal
Implement the architecture as described in the user's "Simplified Azure Implementation" document, focusing on a single Azure Function, Azure Static Web Apps, basic Blob Storage, and SAS token authentication managed by the function (using storage account connection strings).

## Phase 1: Backend Simplification & Adaptation (Azure Functions)

1.  **Adapt/Create Single Azure Function (e.g., `ProcessImageAndSas`):**
    *   This function will be the *only* backend HTTP endpoint, located in the `api/` folder (e.g., `api/ProcessImageAndSas/index.js`).
    *   **Functionality 1: SAS Token Generation:**
        *   When called (e.g., with a query parameter like `action=getUploadSas`), it will generate a SAS token for uploading to the `uploads` container.
        *   It will use key-based SAS generation logic (e.g., `blobService.generateSharedAccessSignature`), relying on the storage account's connection string.
        *   The storage connection string will be stored in the Function App's application settings.
    *   **Functionality 2: Image Processing:**
        *   When called with image details (e.g., `action=processImage` and the blob name from the `uploads` container), it will:
            *   Download the image from the `uploads` container (using `BlobServiceClient` initialized with a connection string).
            *   Process the image using the Sharp library.
            *   Upload processed images to the `downloads` container.
            *   Return direct URLs to the processed images in the `downloads` container (assuming the container has public read access).
    *   **Action:**
        *   Modify the existing `api/ProcessImage/index.js` to become this single function, or create a new function folder (e.g., `api/ImageProcessor/`) and place the consolidated logic there.
        *   Remove Managed Identity-specific code (`DefaultAzureCredential`, `getUserDelegationKey`) from the function.
        *   Incorporate SAS generation logic using `BlobServiceClient` initialized with a connection string.
        *   The `api/GetSasToken/` directory and its contents will be deleted.

2.  **Update Function Configuration (`function.json`):**
    *   Ensure the bindings in the single function's `function.json` are appropriate for an HTTP trigger that can handle the combined responsibilities (e.g., accepting necessary parameters via query or body for both actions).

## Phase 2: Frontend Adjustments (React App)

1.  **Modify `BlobService.js` (`frontend/src/services/BlobService.js`):**
    *   Update to:
        *   Call the single Azure Function endpoint to get an upload SAS token and URL (e.g., `/api/YourSingleFunction?action=getUploadSas`).
        *   Use this SAS token to upload the file directly to the `uploads` Blob container.
        *   After successful upload, call the *same* Azure Function endpoint to trigger processing (e.g., `/api/YourSingleFunction?action=processImage`, passing the uploaded blob's identifier).
        *   Handle the response containing direct URLs to the processed images in the `downloads` container.

## Phase 3: Infrastructure and Deployment

1.  **Azure Static Web Apps for Frontend:**
    *   Utilize Azure Static Web Apps (SWA) for hosting the React application.
    *   Configure the SWA GitHub Actions workflow (e.g., `.github/workflows/web-app-deploy.yml` or a SWA-specific file) to:
        *   Build and deploy the React app from the `frontend` directory.
        *   Deploy the single Azure Function from the `api` directory as an integrated API for the SWA.

2.  **Azure Function App (deployed with SWA):**
    *   The single function will reside in the `api` folder and be managed/deployed by SWA.
    *   Configure the Function App's application settings (via SWA settings in Azure or Bicep) with the Azure Storage connection string (e.g., `AzureWebJobsStorage` and a custom one like `AZURE_STORAGE_CONNECTION_STRING` for the function code to use).

3.  **Azure Blob Storage:**
    *   Ensure two containers are provisioned:
        *   `uploads` (private, for SAS uploads).
        *   `downloads` (public read access, for direct downloads of processed images).

4.  **Infrastructure as Code (`infrastructure/`):**
    *   Update `infrastructure/main.bicep` (and related files) to define:
        *   One Static Web App resource, configured to use/deploy functions from the `api` folder and include necessary app settings for the functions.
        *   One Storage Account with the two containers (`uploads`, `downloads`) with correct public access settings.
    *   The `infrastructure/deploy.ps1` script (or equivalent manual Azure CLI/PowerShell commands) will be used to deploy this Bicep template.

## Phase 4: Cleanup and Documentation

1.  **Delete Unneeded Files:**
    *   Delete the `api/GetSasToken/` directory.
    *   Delete `frontend/server.js`.
    *   Review `.github/workflows/function-app-deploy.yml`. If functions are successfully deployed as part of the SWA workflow, this separate deployment workflow can be deleted.
    *   Remove any other configuration files or scripts related to the previous, more complex architecture (e.g., App Service specific, or solely Managed Identity focused if not used).

2.  **Update Memory Bank Documentation (`cline_docs/`):**
    *   **Create `projectbrief.md`:** Based on the user's "Simplified Azure Implementation" document.
    *   **Update `systemPatterns.md`:** Reflect the new single-function backend (SAS-based auth, connection strings) and Static Web App frontend.
    *   **Update `techContext.md`:** Note the simplification in authentication (SAS tokens via connection string).
    *   **Update `progress.md`:** Reflect the goals and progress of this simplification task.
    *   **Update `activeContext.md`:** Set the next steps after this refactoring is complete.
    *   Review and update `cline_docs/azure-architecture-template.md` to accurately represent the *final* simplified architecture.

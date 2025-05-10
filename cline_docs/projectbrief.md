# Project Brief: LogoCraft Web - Simplified Azure Implementation

## 1. Project Goal
To refactor the LogoCraft Web application for a simplified Azure architecture, focusing on essential services for a first Azure project while maintaining core image processing functionality. The aim is to achieve a basic but effective and easy-to-manage cloud deployment.

## 2. Streamlined Architecture Overview

### Frontend: Simple Static Web App
-   **Service:** Azure Static Web Apps
-   **Rationale:** Ideal for hosting React applications, includes free SSL, built-in GitHub integration for CI/CD, and avoids complex scaling configurations.
-   **Implementation:** Frontend code from the `frontend/` directory will be deployed.

### Backend: Focused Functions App (Integrated with SWA)
-   **Service:** Azure Functions (integrated with Azure Static Web Apps)
-   **Rationale:** Start with a single HTTP-triggered function to handle all backend logic (SAS token generation and image processing) to minimize complexity.
-   **Implementation:** A single Node.js function in the `api/` directory will handle:
    1.  Generating SAS tokens for client-side uploads to Azure Blob Storage.
    2.  Processing uploaded images using the Sharp library.

### Storage: Basic Blob Container
-   **Service:** Azure Blob Storage
-   **Rationale:** Simple and scalable storage for image files.
-   **Implementation:**
    -   One container for `uploads` (private, accessed via SAS tokens).
    -   One container for `downloads` (public read access for processed image links).

## 3. Key Simplifications from Original/Previous State
-   **Authentication:** Shift from Managed Identity to function-generated SAS tokens (using storage account connection strings) for initial simplicity.
-   **Backend Logic:** Consolidate all backend operations (SAS generation, image processing) into a single Azure Function.
-   **Hosting:** Move from a potential Azure App Service setup to Azure Static Web Apps for the frontend, with integrated Azure Functions for the backend.
-   **Infrastructure:** Simplified Bicep templates focusing on SWA and Storage Account. Key Vault and separate Function App resources (beyond what SWA manages) are deferred.

## 4. Core Functionality to Maintain
-   User ability to upload an image.
-   Selection of desired output formats.
-   Image processing to convert to selected formats.
-   User ability to download processed images.

## 5. Development & Deployment
-   **Development:** VS Code for frontend (React) and backend (Azure Function in Node.js).
-   **Deployment:**
    -   Infrastructure deployed via GitHub Actions using Bicep (`.github/workflows/infrastructure-deploy.yml`).
    -   Application (frontend and API) deployed via GitHub Actions using the Azure Static Web Apps action (`.github/workflows/web-app-deploy.yml`).
-   **Configuration:** Azure Storage connection string stored as an application setting in the Azure Static Web App (accessible by the integrated function).

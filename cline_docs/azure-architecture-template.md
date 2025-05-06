# 🔷 **Azure Static Web App Architecture Template: LogoCraft Web**

---

### 📌 1. **Project Overview**

| Item                | Description |
| ------------------- | ----------- |
| App Name            | LogoCraft Web |
| Purpose / Use Case  | A web application for converting and processing logo images into multiple formats with specific dimensions. Allows users to upload images and convert them to various standardized logo formats including installer images, online images, app icons, and UI elements. |
| Resource Group Name | LogoCraftRG |
| Azure Region        | East US |

---

### 🗂️ 2. **Resource Flow Diagram**

```text
Browser/Client
   ↓
[Azure Static Web App (logocraft-frontend)]
   ↓                                ↘
[API via Azure Functions (logocraftfunctions)]  →  [Blob Storage (logocraftstorage2200)]
   |                                                      ↑
   ↓                                                      |
[GetSasToken] → Return SAS URL to client for direct upload  
   ↓
[ProcessImage] → Process uploaded images and generate new formats
                  using Sharp library (PNG/BMP conversion)
   ↓
[Return processed image URLs to client for download]
   ↓
[Client downloads images and creates ZIP file for user]
```

---

### 🔐 3. **Authentication & Authorization**

| Component             | Method                                                    | Notes |
| --------------------- | --------------------------------------------------------- | ----- |
| Static Web App        | None (Public access)                                      | No user authentication required |
| Azure Functions (API) | Anonymous HTTP Triggers                                   | Public API endpoints |
| Blob Storage          | Dual-Mode Authentication | **Production**: Azure Managed Identity<br>**Development**: Storage Account Key |

> **Checklist:**

* ☑ SWA Auth Providers configured - N/A (public access)
* ☐ Role-based access rules set in `staticwebapp.config.json` - N/A (public access)
* ☑ CORS rules defined for Blob + Functions
* ☑ Blob access (Private/Container/Public) - Private with SAS tokens
* ☑ RBAC roles assigned - Storage Blob Data Contributor & Storage Blob Delegator

---

### 🧠 4. **Environment Variables / App Settings**

| Environment | Static Web App | Azure Functions | Notes |
| ----------- | -------------- | --------------- | ----- |
| Development | N/A | STORAGE_ACCOUNT_NAME=logocraftstorage2200<br>STORAGE_ACCOUNT_KEY=[key-value]<br>AzureWebJobsStorage=[connection-string] | Local development uses storage account key |
| Production  | N/A | STORAGE_ACCOUNT_NAME=logocraftstorage2200<br>AzureWebJobsStorage=[connection-string] | Production uses Managed Identity for app code, but still needs connection string for Functions runtime |

> **Checklist:**

* ☑ Environment secrets configured in SWA and Function App
* ☑ Storage keys / connection strings securely stored (Managed Identity for app code)
* ☑ AzureWebJobsStorage connection string properly configured (required for Functions runtime)

---

### 🔄 5. **Azure Blob Storage Configuration**

| Setting                  | Value / Notes |
| ------------------------ | ------------- |
| Access Level             | Private |
| Containers               | input-images, output-images |
| CORS Rules               | Allow origins from SWA URL and localhost for development |
| Lifecycle Rules (if any) | None specified |
| SAS Tokens Used?         | ☑ Yes ☐ No    |
| Managed Identity Access? | ☑ Yes ☐ No    |
| SAS Token Expiry         | 1-hour validity period |

---

### ⚙️ 6. **Function App (API) Details**

| Item                  | Value / Notes                |
| --------------------- | ---------------------------- |
| Runtime Stack         | Node.js 18+                  |
| Authorization Level   | Anonymous                    |
| Route Prefix          | api                          |
| CORS Enabled?         | ☑ Yes ☐ No                   |
| Blob Access Mechanism | Dual-mode authentication:<br>- Production: Azure SDK with Managed Identity (@azure/storage-blob, @azure/identity)<br>- Development: Storage Account Key |
| Dependencies          | sharp, node-fetch, @azure/storage-blob, @azure/identity |

> **API Endpoints:**
- `/api/GetSasToken` 
  - **Purpose**: Generates SAS tokens for blob storage access
  - **Method**: GET
  - **Parameters**: container (default: input-images), filename (optional), accessType (read/write)
  - **Response**: blobUrlWithSas, sasToken
- `/api/ProcessImage` 
  - **Purpose**: Processes uploaded images into multiple formats
  - **Method**: POST
  - **Body**: sourceUrl, formats (object with format names as keys and boolean values)
  - **Response**: processedImages (array of processed image metadata)

---

### 🔁 7. **GitHub Workflow / CI-CD**

| Stage      | Configured? | Notes |
| ---------- | ----------- | ----- |
| Build      | ☑           | Frontend build with npm run build |
| Test       | ☐           | Not implemented |
| Deploy SWA | ☑           | Azure Static Web Apps deploy action |
| Deploy API | ☑           | Included in SWA deployment |

> **Checklist:**

* ☑ `.github/workflows/azure-static-web-apps-lemon-tree-062b8be10.yml` present
* ☑ Deployment token or GitHub Actions authorized
* ☑ Branch filters (e.g., prod = main, PR deployment)

---

### 🌐 8. **CORS Configuration**

| Resource        | Origins Allowed | Notes              |
| --------------- | --------------- | ------------------ |
| Static Web App  | *               | Public access      |
| Azure Functions | SWA URL, localhost:3000 | Required for API calls during development and production |
| Blob Storage    | SWA URL, localhost:3000 | Required for direct uploads during development and production |

---

### 🧪 9. **Environments & Deployment Slots (Optional)**

| Environment | SWA Environment Name | Branch  | Notes          |
| ----------- | -------------------- | ------- | -------------- |
| Production  | Production           | main    |                |
| Preview     | Staging              | PR      | Auto-generated for PRs |

---

### ✅ 10. **Final Checklist**

| Area                            | Completed? |
| ------------------------------- | ---------- |
| Auth setup                      | ☑          |
| Blob storage configured         | ☑          |
| API tested locally/remotely     | ☑          |
| Environment vars injected       | ☑          |
| GitHub Actions pipeline working | ☑          |
| CORS configured                 | ☑          |
| Secrets secured                 | ☑          |
| Custom domain setup             | ☐          |
| RBAC roles assigned             | ☑          |
| Local development tested        | ☑          |

---

### 📋 **Key Implementation Notes:**

1. **Dual-Mode Authentication** is implemented for the Azure Functions:
   - **Production**: Uses Azure Managed Identity for secure, key-free authentication to Azure Storage
     - System-assigned Managed Identity for Function App
     - RBAC roles assigned: Storage Blob Data Contributor & Storage Blob Delegator
     - User delegation keys for SAS token generation
   - **Development**: Uses Storage Account Key stored in local settings
     - StorageSharedKeyCredential for SAS generation in local environment
     - Connection string approach for creating BlobServiceClient

2. **Storage Access Method**:
   - GetSasToken function generates time-limited (1-hour) SAS tokens for direct client uploads
   - ProcessImage function tries two options for downloading source images:
     - Option 1: Managed Identity to access blobs directly
     - Option 2: Falling back to the provided SAS URL if Option 1 fails

3. **Image Processing Flow**:
   - User uploads image to browser
   - Frontend gets SAS token from Azure Function
   - Frontend directly uploads to Azure Blob Storage
   - Frontend requests image processing via Azure Function
   - Backend processes images using Sharp library and returns URLs
   - Frontend downloads processed images and creates ZIP file for user

4. **Supported Image Formats**:
   - Input: PNG, JPEG, GIF, BMP, TIFF, WebP
   - Output: 
     - PNG formats with configurable dimensions
     - 1-bit monochrome BMP for specialized use cases like thermal printers
     - Support for over 25 different output formats including app icons, splash screens, and UI elements

5. **Error Handling**:
   - Comprehensive error handling in both Azure Functions
   - Detailed error messages with appropriate HTTP status codes
   - Client-side validation and error reporting
   - Fallback mechanisms for authentication methods

6. **Local Development Support**:
   - Local settings with storage account key for development
   - CORS configuration allows localhost during development
   - Azure Functions Core Tools for local function execution
   - Vite development server with API proxy

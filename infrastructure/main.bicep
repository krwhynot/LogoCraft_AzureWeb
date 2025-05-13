@description('Location for all resources.')
param location string = resourceGroup().location

@description('Prefix for resource names.')
param namePrefix string = 'logocraft' // Simplified prefix

@description('Name of the Static Web App.')
param staticWebAppName string = '${namePrefix}swa${uniqueString(resourceGroup().id)}'

@description('SKU for the Static Web App. Standard includes managed functions.')
param staticWebAppSkuName string = 'Standard' // or 'Free' if no managed functions initially, but 'Standard' is better for integrated APIs.

@description('Name of the main storage account for application data.')
param storageAccountName string = '${namePrefix}st${uniqueString(resourceGroup().id)}'


// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// Main Storage Account for application data (uploads and downloads)
resource mainStorageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true // Required for the 'downloads' container to have public blobs
    allowSharedKeyAccess: true   // Required for functions to use connection string
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: mainStorageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'uploads' // As per simplified plan
  properties: {
    publicAccess: 'None' // Private, accessed via SAS
  }
}

resource downloadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'downloads' // As per simplified plan
  properties: {
    publicAccess: 'Blob' // Public read access for blobs
  }
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: staticWebAppSkuName
    tier: staticWebAppSkuName // For SWA, name and tier are often the same (e.g., 'Standard')
  }
  // identity: { // System-assigned identity can be enabled if needed later
  //   type: 'SystemAssigned'
  // }
  properties: {
    // Assuming deployment via GitHub Actions, so these are set in the workflow
    // repositoryUrl: 'YOUR_GITHUB_REPO_URL'
    // branch: 'main'
    // repositoryToken: 'YOUR_GITHUB_PAT_OR_APP_SECRET' // Handled by SWA token in workflow
    buildProperties: {
      appLocation: 'frontend'
      apiLocation: 'api' // Location of the Azure Functions
      appArtifactLocation: 'dist' // Build output from 'frontend/dist'
      // nodeVersion: '20' // Can be specified here or in workflow
    }
  }
}

// App Settings for the Static Web App (and its integrated functions)
// Note: Connection strings are sensitive and should ideally be managed via Key Vault references in a production SWA,
// but for initial simplicity as per the plan, we can set them directly.
// The SWA deployment token in GitHub Actions is the primary secret for deployment.
resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_STORAGE_CONNECTION_STRING: mainStorageAccount.listKeys().keys[0].value
    AzureWebJobsStorage: mainStorageAccount.listKeys().keys[0].value
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
  }
}


output staticWebAppDefaultHostName string = staticWebApp.properties.defaultHostname
output staticWebAppId string = staticWebApp.id
output storageAccount_Name string = mainStorageAccount.name // Renamed for clarity
output appInsights_ConnectionString string = appInsights.properties.ConnectionString // Renamed for clarity










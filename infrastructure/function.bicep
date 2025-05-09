// function.bicep - For the Function App resource group (LogoCraft-Func-RG)
// Parameters
param location string = resourceGroup().location
param namePrefix string = 'logocraftfunc'
param functionAppRuntimeVersion string = '20'
param storageAccountName string // Main app storage in other resource group
param webAppName string = 'logocraftweb-app' // Used for CORS
param appInsightsConnectionString string

// Create a dedicated storage account for Function App internal use
resource functionStorageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  // Fixed: Ensure storage account name is no more than 24 characters
  name: '${take(replace(toLower(namePrefix), '-', ''), 5)}st${take(uniqueString(resourceGroup().id), 16)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true // Must be true for connection string to work
    publicNetworkAccess: 'Enabled'
  }
}

// Standard Consumption Plan (Linux)
resource consumptionPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: {
    name: 'Y1'  // Standard consumption plan
    tier: 'Dynamic'  // Dynamic tier
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux plans
  }
}

// Construct the full connection string securely
var functionStorageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${functionStorageAccount.listKeys().keys[0].value}'

// Create a content share name without referencing functionApp
var contentShareName = toLower('content${uniqueString(resourceGroup().id)}')

// Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-app'
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: consumptionPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${functionAppRuntimeVersion}'
      ftpsState: 'Disabled'
      cors: {
        allowedOrigins: [
          'https://${webAppName}.azurewebsites.net'
        ]
      }
      appSettings: [
        // For application storage access (using managed identity)
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccountName
        }
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
        // Standard Azure Functions settings
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        // Function content storage settings (requires full connection string)
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: contentShareName
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: functionStorageConnectionString
        }
        // For local debugging
        {
          name: 'AzureWebJobsStorage'
          value: functionStorageConnectionString
        }
      ]
    }
  }
}

// Outputs
output functionAppHostName string = functionApp.properties.defaultHostName
output functionAppPrincipalId string = functionApp.identity.principalId

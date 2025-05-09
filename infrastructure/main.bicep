// main.bicep - For the Web App resource group (LogoCraft-Web-RG)
// Parameters
param location string = resourceGroup().location
param namePrefix string = 'logocraftweb'
param functionAppName string = 'logocraftfunc-app'
param webAppRuntimeVersion string = '20'

// Role definition IDs
var keyVaultSecretsUserId = '4633458b-17de-408a-b874-0445c86b69e6' // Environment-Specific ID for Key Vault Secrets User

// App Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// Storage Account + Containers
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${namePrefix}store${take(uniqueString(resourceGroup().id), 5)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource inputContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  parent: blobService
  name: 'input-images'
  properties: {
    publicAccess: 'None'
  }
}

resource outputContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  parent: blobService
  name: 'output-images'
  properties: {
    publicAccess: 'None'
  }
}

// Key Vault with completely new name
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'webvault${take(uniqueString(resourceGroup().id), 8)}'
  location: location
  properties: {
    tenantId: subscription().tenantId
    enableSoftDelete: true
    enablePurgeProtection: true
    enableRbacAuthorization: true
    sku: {
      family: 'A'
      name: 'standard'
    }
  }
}

// App Service Plan for Web App
resource webPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-app'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: webPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${webAppRuntimeVersion}'
      ftpsState: 'Disabled'
      alwaysOn: true
      appSettings: [
        {
          name: 'FUNCTION_APP_URL'
          value: 'https://${functionAppName}.azurewebsites.net'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

// Role Assignment for Web App to access Key Vault
resource webKVRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, 'kv')
  scope: keyVault
  properties: {
    principalId: webApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserId)
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output webAppHostName string = webApp.properties.defaultHostName
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString

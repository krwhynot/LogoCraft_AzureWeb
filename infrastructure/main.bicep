// Parameters
param location string = resourceGroup().location
param namePrefix string = 'logocraft${uniqueString(resourceGroup().id)}'
param functionAppRuntimeVersion string = '20'
param webAppRuntimeVersion string = '20'

// Role definition IDs
var keyVaultSecretsUserId = '4633458b-17de-408a-b874-08cd206e471fa'
var blobContributorId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var blobDelegatorId = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
var queueContributorId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var tableContributorId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

// App Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}appi'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// Storage Account + Containers
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${namePrefix}st'
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
  name: '${storageAccount.name}/default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
  resource inputContainer 'containers' = {
    name: 'input-images'
    properties: {
      publicAccess: 'None'
    }
  }
  resource outputContainer 'containers' = {
    name: 'output-images'
    properties: {
      publicAccess: 'None'
    }
  }
}

// Flex Consumption Plan
resource flexPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}funcplan'
  location: location
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}func'
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: flexPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${functionAppRuntimeVersion}'
      ftpsState: 'Disabled'
      cors: {
        allowedOrigins: [
          'https://${namePrefix}web.azurewebsites.net'
        ]
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccount.name
        }
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

// App Service Plan for Web App
resource webPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}plan'
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
  name: '${namePrefix}web'
  location: location
  kind: 'app'
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
          value: 'https://${functionApp.name}.azurewebsites.net'
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

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${namePrefix}kv'
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

// Role Assignments (Function App)
resource blobRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, 'blob')
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', blobContributorId)
    principalType: 'ServicePrincipal'
  }
}
resource blobDelegatorRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, 'delegator')
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', blobDelegatorId)
    principalType: 'ServicePrincipal'
  }
}
resource queueRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, 'queue')
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', queueContributorId)
    principalType: 'ServicePrincipal'
  }
}
resource tableRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, 'table')
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', tableContributorId)
    principalType: 'ServicePrincipal'
  }
}
resource functionKVRA 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, functionApp.id, 'kv')
  scope: keyVault
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserId)
    principalType: 'ServicePrincipal'
  }
}
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
output functionAppHostName string = functionApp.properties.defaultHostName
output webAppHostName string = webApp.properties.defaultHostName
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri

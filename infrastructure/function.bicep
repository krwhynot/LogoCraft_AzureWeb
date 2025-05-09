// function.bicep - For the Function App resource group (LogoCraft-Func-RG)
// Parameters
param location string = resourceGroup().location
param namePrefix string = 'logocraftfunc'
param functionAppRuntimeVersion string = '20'
param storageAccountName string
// storageAccountId parameter is removed from here
param appInsightsConnectionString string

// Consumption Plan (Linux)
resource consumptionPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

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
          'https://logocraftweb-app.azurewebsites.net'
        ]
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccountName
        }, {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }, {
          name: 'AzureWebJobsStorage' // Base setting, formatted for MI
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=;Credential=managedidentity;'
        }, {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }, {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }, {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }, {
          name: 'WEBSITE_RUN_FROM_PACKAGE' // Explicitly enable run from package
          value: '1'
        }, {
          name: 'WEBSITE_CONTENTSHARE' // Often needed for Linux Consumption for package storage
          value: toLower('${namePrefix}-content')
        }
      ]
    }
  }
}

// Outputs
output functionAppHostName string = functionApp.properties.defaultHostName
output functionAppPrincipalId string = functionApp.identity.principalId

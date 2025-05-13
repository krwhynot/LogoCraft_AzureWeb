# deploy.ps1 - Updated for simplified architecture
$ErrorActionPreference = 'Stop'

# Define a single resource group
$resourceGroupName = "LogoCraftRG"
$deploymentRegion = "centralus"  

Write-Host "Starting deployment of LogoCraft Web infrastructure..."

# Create a single resource group
Write-Host "Ensuring resource group '$resourceGroupName' exists..."
if (-not (Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location $deploymentRegion
    Write-Host "Resource group '$resourceGroupName' created."
} else {
    Write-Host "Resource group '$resourceGroupName' already exists."
}

# Deploy the main resources
Write-Host "Deploying main.bicep to '$resourceGroupName'..."
$mainDeploymentParams = @{
    ResourceGroupName = $resourceGroupName
    TemplateFile      = "./main.bicep"
    Name              = "main-$(Get-Date -Format 'yyyyMMddHHmm')"
    location          = $deploymentRegion
    namePrefix        = "logocraft"
    Verbose           = $true
}

try {
    $mainDeployment = New-AzResourceGroupDeployment @mainDeploymentParams
    Write-Host "Main deployment completed successfully."
} catch {
    Write-Error "Main Bicep deployment failed. Please check the Azure portal for details."
    exit 1
}

Write-Host "Deployment completed successfully!"
Write-Host "Static Web App URL: https://$($mainDeployment.Outputs.staticWebAppDefaultHostName.Value)"
Write-Host "Storage Account Name: $($mainDeployment.Outputs.storageAccount_Name.Value)"
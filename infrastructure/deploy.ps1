# deploy.ps1 - Updated to use centralus region
# Set error action preference to stop on error
$ErrorActionPreference = 'Stop'

# Define the deployment region
$deploymentRegion = "centralus"  # Changed from eastus to centralus

Write-Host "Starting deployment of LogoCraft Web infrastructure..."

# 1. Ensure the Function App resource group exists
Write-Host "Ensuring Function App resource group 'LogoCraft-Func-RG' exists..."
if (-not (Get-AzResourceGroup -Name "LogoCraft-Func-RG" -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name "LogoCraft-Func-RG" -Location $deploymentRegion
    Write-Host "Resource group 'LogoCraft-Func-RG' created."
} else {
    Write-Host "Resource group 'LogoCraft-Func-RG' already exists."
}

# 2. Ensure the Main resource group exists
Write-Host "Ensuring Main resource group 'LogoCraft-Web-RG' exists..."
if (-not (Get-AzResourceGroup -Name "LogoCraft-Web-RG" -ErrorAction SilentlyContinue)) {
    $rg = New-AzResourceGroup -Name "LogoCraft-Web-RG" -Location $deploymentRegion
    $rg
    Write-Host "Resource group 'LogoCraft-Web-RG' created."
} else {
    Write-Host "Resource group 'LogoCraft-Web-RG' already exists."
}

# 3. Deploy the main resources to LogoCraft-Web-RG
Write-Host "Deploying main.bicep to 'LogoCraft-Web-RG'..."
$mainDeploymentParams = @{
    ResourceGroupName = "LogoCraft-Web-RG"
    TemplateFile      = "./main.bicep"
    Name              = "main-$(Get-Date -Format 'yyyyMMddHHmm')"
    location         = $deploymentRegion
    Verbose           = $true
}

try {
    $mainDeployment = New-AzResourceGroupDeployment @mainDeploymentParams
    Write-Host "Main deployment completed successfully."
} catch {
    Write-Error "Main Bicep deployment failed. Please check the Azure portal for details."
    exit 1
}

# 4. Deploy the Function App to LogoCraft-Func-RG
Write-Host "Deploying function.bicep to 'LogoCraft-Func-RG'..."
$funcDeploymentParams = @{
    ResourceGroupName = "LogoCraft-Func-RG"
    TemplateFile      = "./function.bicep"
    Name              = "func-$(Get-Date -Format 'yyyyMMddHHmm')"
    location          = $deploymentRegion
    storageAccountName = $mainDeployment.Outputs.storageAccountName.Value
    # Removed storageAccountId parameter
    appInsightsConnectionString = $mainDeployment.Outputs.appInsightsConnectionString.Value
    Verbose           = $true
}

try {
    $funcDeployment = New-AzResourceGroupDeployment @funcDeploymentParams
    Write-Host "Function App deployment completed successfully."
} catch {
    Write-Error "Function App deployment failed. Please check the Azure portal for details."
    exit 1
}

# 5. Assign RBAC roles for Function App to access Storage Account resources
Write-Host "Assigning RBAC roles for Function App to access Storage Account..."

# Explicitly get the Storage Account ID (Scope) from the main deployment outputs
$storageAccountScope = $mainDeployment.Outputs.storageAccountId.Value
Write-Host "  Using Storage Account Scope for RBAC: $storageAccountScope"

if (-not $storageAccountScope) {
    Write-Error "Failed to retrieve Storage Account ID (Scope) from main deployment outputs. RBAC assignment cannot proceed."
    exit 1
}

# Define the needed role definitions with their environment-specific or standard IDs
$roleDefinitions = @(
    @{ Name = "Storage Blob Data Contributor"; Id = "ba92f5b4-2d11-453d-a403-e96b0029c9fe" }, # Standard ID, matched
    @{ Name = "Storage Blob Delegator"; Id = "db58b8e5-c6ad-4a2a-8342-4190687cbf4a" }, # Environment-Specific ID
    @{ Name = "Storage Queue Data Contributor"; Id = "974c5e8b-45b9-4653-ba55-5f855dd0fb88" }, # Standard ID, matched
    @{ Name = "Storage Table Data Contributor"; Id = "0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3" }  # Standard ID, matched
)

foreach ($role in $roleDefinitions) {
    Write-Host "Assigning role '$($role.Name)' (ID: $($role.Id)) to Function App identity..."
    
    # ---- START DEBUG BLOCK ----
    $DebugPrincipalId = $funcDeployment.Outputs.functionAppPrincipalId.Value
    $DebugRoleDefId = $role.Id
    $DebugScope = $storageAccountScope # Use the variable that should hold the scope

    Write-Host "  DEBUG: Principal ID  = '$($DebugPrincipalId)' (Type: $($DebugPrincipalId.GetType().FullName))"
    Write-Host "  DEBUG: RoleDef ID   = '$($DebugRoleDefId)' (Type: $($DebugRoleDefId.GetType().FullName))"
    Write-Host "  DEBUG: Scope        = '$($DebugScope)' (Type: $($DebugScope.GetType().FullName))"
    # ---- END DEBUG BLOCK ----

    try {
        New-AzRoleAssignment -ObjectId $DebugPrincipalId `
                             -RoleDefinitionId $DebugRoleDefId `
                             -Scope $DebugScope # Using the debug variable for clarity
    } catch {
        Write-Warning "Role assignment for '$($role.Name)' failed. This may be a transient error or the role may already be assigned."
        Write-Warning $_.Exception.Message
    }
}

Write-Host "Deployment completed successfully!"
Write-Host "Web App URL: https://$($mainDeployment.Outputs.webAppHostName.Value)"
Write-Host "Function App URL: https://$($funcDeployment.Outputs.functionAppHostName.Value)"
Write-Host "Web Key Vault Name: $($mainDeployment.Outputs.keyVaultName.Value)"
# Function Key Vault output was removed from function.bicep, so it's no longer available here.
# Write-Host "Function Key Vault Name: $($funcDeployment.Outputs.keyVaultName.Value)"

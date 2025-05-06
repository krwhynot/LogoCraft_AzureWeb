# Verify-ManagedIdentitySetup.ps1
# This script checks the Azure Managed Identity configuration for LogoCraft Web

# Parameters - customize these values for your environment
param(
    [string]$ResourceGroupName = "YourResourceGroup",
    [string]$StaticWebAppName = "logocraft-frontend",
    [string]$StorageAccountName = "logocraftstorage2200",
    [string]$RequiredContainers = @("input-images", "output-images"),
    [string]$RequiredRoles = @("Storage Blob Data Contributor", "Storage Blob Delegator")
)

# Function to display section headers
function Show-Header {
    param([string]$Title)
    Write-Host "`n===== $Title =====" -ForegroundColor Cyan
}

# Function to display success message
function Show-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

# Function to display warning message
function Show-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Function to display error message
function Show-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Function to check if Azure CLI is logged in
function Test-AzureLogin {
    try {
        $account = az account show | ConvertFrom-Json
        Show-Success "Logged in to Azure as $($account.user.name)"
        return $true
    }
    catch {
        Show-Error "Not logged in to Azure. Please run 'az login' first."
        return $false
    }
}

# Main script execution
Show-Header "Azure Managed Identity Configuration Verification"

# Check Azure login
if (-not (Test-AzureLogin)) {
    exit 1
}

# Step 1: Verify Static Web App exists
Show-Header "Static Web App Verification"
try {
    $staticWebApp = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json
    Show-Success "Static Web App '$StaticWebAppName' found"
    
    # Show Static Web App details
    Write-Host "Name: $($staticWebApp.name)"
    Write-Host "Location: $($staticWebApp.location)"
    Write-Host "Default URL: $($staticWebApp.defaultHostname)"
    Write-Host "Resource ID: $($staticWebApp.id)"
}
catch {
    Show-Error "Static Web App '$StaticWebAppName' not found in resource group '$ResourceGroupName'"
    Write-Host "Error details: $_"
    exit 1
}

# Step 2: Verify System-Assigned Managed Identity is enabled
Show-Header "Managed Identity Verification"
try {
    $identity = az staticwebapp identity show --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json
    
    if ($identity.principalId) {
        Show-Success "System-Assigned Managed Identity is enabled"
        Write-Host "Principal ID: $($identity.principalId)"
        Write-Host "Tenant ID: $($identity.tenantId)"
        $principalId = $identity.principalId
    }
    else {
        Show-Warning "System-Assigned Managed Identity is NOT enabled"
        Write-Host "To enable, run: az staticwebapp identity assign --name $StaticWebAppName --resource-group $ResourceGroupName"
        $principalId = $null
    }
}
catch {
    Show-Error "Failed to retrieve Managed Identity information"
    Write-Host "Error details: $_"
    $principalId = $null
}

# Step 3: Verify Storage Account exists
Show-Header "Storage Account Verification"
try {
    $storageAccount = az storage account show --name $StorageAccountName --resource-group $ResourceGroupName | ConvertFrom-Json
    Show-Success "Storage Account '$StorageAccountName' found"
    
    # Show Storage Account details
    Write-Host "Name: $($storageAccount.name)"
    Write-Host "Location: $($storageAccount.location)"
    Write-Host "Resource ID: $($storageAccount.id)"
    $storageId = $storageAccount.id
}
catch {
    Show-Error "Storage Account '$StorageAccountName' not found in resource group '$ResourceGroupName'"
    Write-Host "Error details: $_"
    exit 1
}

# Step 4: Check for required storage containers
Show-Header "Storage Containers Verification"
foreach ($container in $RequiredContainers) {
    try {
        $exists = az storage container exists --account-name $StorageAccountName --name $container --auth-mode login | ConvertFrom-Json
        
        if ($exists.exists) {
            Show-Success "Container '$container' exists"
        }
        else {
            Show-Warning "Container '$container' does NOT exist"
            Write-Host "To create, run: az storage container create --name $container --account-name $StorageAccountName --auth-mode login"
        }
    }
    catch {
        Show-Error "Failed to check container '$container'"
        Write-Host "Error details: $_"
    }
}

# Step 5: Check RBAC role assignments (if Managed Identity is enabled)
if ($principalId) {
    Show-Header "RBAC Role Assignments Verification"
    
    $roleAssignments = az role assignment list --assignee $principalId --scope $storageId | ConvertFrom-Json
    $foundRoles = @()
    
    foreach ($assignment in $roleAssignments) {
        $roleDef = az role definition show --name $assignment.roleDefinitionName | ConvertFrom-Json
        $foundRoles += $roleDef.name
        Write-Host "Found role: $($roleDef.name)"
    }
    
    foreach ($requiredRole in $RequiredRoles) {
        if ($foundRoles -contains $requiredRole) {
            Show-Success "Role '$requiredRole' is assigned"
        }
        else {
            Show-Warning "Role '$requiredRole' is NOT assigned"
            Write-Host "To assign, run: az role assignment create --assignee $principalId --role `"$requiredRole`" --scope $storageId"
        }
    }
}

# Step 6: Check application settings for Static Web App (requires admin access)
Show-Header "Application Settings Verification"
try {
    # This API requires additional privileges, might not work if not authenticated as an owner/contributor
    $appSettings = az staticwebapp appsettings list --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json
    
    $storageAccountNameSetting = $appSettings | Where-Object { $_.name -eq "STORAGE_ACCOUNT_NAME" }
    
    if ($storageAccountNameSetting) {
        Show-Success "STORAGE_ACCOUNT_NAME is set to: $($storageAccountNameSetting.value)"
        
        if ($storageAccountNameSetting.value -ne $StorageAccountName) {
            Show-Warning "STORAGE_ACCOUNT_NAME value ($($storageAccountNameSetting.value)) doesn't match parameter ($StorageAccountName)"
        }
    }
    else {
        Show-Warning "STORAGE_ACCOUNT_NAME application setting is NOT found"
        Write-Host "To set, run: az staticwebapp appsettings set --name $StaticWebAppName --resource-group $ResourceGroupName --setting-names STORAGE_ACCOUNT_NAME=$StorageAccountName"
    }
    
    # Check for presence of STORAGE_ACCOUNT_KEY (should NOT be present for Managed Identity)
    $storageKeySettings = $appSettings | Where-Object { $_.name -like "*STORAGE*KEY*" }
    
    if ($storageKeySettings) {
        foreach ($setting in $storageKeySettings) {
            Show-Warning "Found storage key setting: $($setting.name). For Managed Identity, storage keys should NOT be used."
            Write-Host "Consider removing this setting for security best practices."
        }
    }
    else {
        Show-Success "No storage key settings found (good for Managed Identity pattern)"
    }
}
catch {
    Show-Warning "Failed to retrieve application settings. This may require additional permissions."
    Write-Host "Check application settings in the Azure Portal manually."
    Write-Host "Error details: $_"
}

# Step 7: Verify Function App connectivity/status (limited information available via CLI)
Show-Header "Function App Status"
try {
    $functions = az staticwebapp functions list --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json
    
    if ($functions -and $functions.Count -gt 0) {
        Show-Success "Found $($functions.Count) function(s) in Static Web App"
        foreach ($function in $functions) {
            Write-Host "Function: $($function.name)"
        }
    }
    else {
        Show-Warning "No functions found in Static Web App"
        Write-Host "Check Static Web App ⟶ Functions in Azure Portal for more details."
    }
}
catch {
    Show-Warning "Could not retrieve function information"
    Write-Host "Check Static Web App ⟶ Functions in Azure Portal for more details."
    Write-Host "Error details: $_"
}

# Summary
Show-Header "Verification Summary"
Write-Host "This script has verified the key components for Azure Managed Identity authentication."
Write-Host "Review any warnings (⚠) or errors (✗) above and take appropriate action."
Write-Host "For any components that couldn't be verified automatically, check the Azure Portal."
Write-Host "`nIf any components are missing or misconfigured, follow the suggested commands to fix the issues.`"

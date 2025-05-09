// GetSasToken/index.js
const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    context.log("--- GetSasToken Function Execution Start ---");
    
    try {
        // Get storage account name from environment variable
        const accountName = process.env.STORAGE_ACCOUNT_NAME;
        if (!accountName) {
            throw new Error("Missing STORAGE_ACCOUNT_NAME environment variable.");
        }
        
        // Get query parameters with defaults
        const containerName = (req.query && req.query.container) ? req.query.container : 'input-images';
        const blobName = (req.query && req.query.filename) ? req.query.filename : undefined;
        const accessType = (req.query && req.query.accessType) ? req.query.accessType : 'write';
        
        // Set permissions based on accessType
        let permissions;
        if (accessType === 'read') {
            permissions = BlobSASPermissions.parse("r");
            context.log(`Generating READ SAS token for container: ${containerName}, blob: ${blobName || '(any)'}`);
        } else if (accessType === 'write') {
            // Include create, add, write for uploads
            permissions = BlobSASPermissions.parse("racw");
            context.log(`Generating WRITE SAS token for container: ${containerName}, blob: ${blobName || '(any)'}`);
        } else {
            context.log.error(`Invalid accessType provided: ${accessType}. Must be 'read' or 'write'.`);
            context.res = {
                status: 400,
                body: {
                    error: 'Invalid accessType',
                    details: "Access type must be 'read' or 'write'."
                }
            };
            return;
        }
        
        // Define SAS parameters
        const blobServiceUri = `https://${accountName}.blob.core.windows.net`;
        const startsOn = new Date();
        startsOn.setMinutes(startsOn.getMinutes() - 5); // Account for clock skew
        const expiresOn = new Date(startsOn);
        expiresOn.setHours(startsOn.getHours() + 1); // 1 hour validity
        
        const sasOptions = {
            containerName: containerName,
            permissions: permissions,
            protocol: 'https', // Enforce HTTPS
            startsOn: startsOn,
            expiresOn: expiresOn
        };
        
        // If specific blob name provided, scope the SAS to that blob
        if (blobName) {
            sasOptions.blobName = blobName;
        }
        
        // Use DefaultAzureCredential for managed identity authentication
        try {
            // Create credential using Managed Identity
            const credential = new DefaultAzureCredential();
            
            // Create BlobServiceClient with DefaultAzureCredential
            const blobServiceClient = new BlobServiceClient(blobServiceUri, credential);
            
            // Ensure container exists before getting delegation key
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const containerExists = await containerClient.exists();
            if (!containerExists) {
                context.log(`Container ${containerName} does not exist. Creating it...`);
                await containerClient.create();
            }
            
            // Get user delegation key using Managed Identity
            context.log(`Requesting user delegation key valid from ${startsOn.toISOString()} to ${expiresOn.toISOString()}`);
            const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
            
            // Generate SAS token using delegation key (not account key)
            const sasToken = generateBlobSASQueryParameters(
                sasOptions,
                userDelegationKey,
                accountName
            ).toString();
            
            // Construct the final URL with SAS token
            const baseUrl = `${blobServiceUri}/${containerName}`;
            const resourceUrl = blobName ? `${baseUrl}/${encodeURIComponent(blobName)}` : baseUrl;
            const finalUrlWithSas = `${resourceUrl}?${sasToken}`;
            
            context.log(`Successfully generated SAS URL for ${accessType} access.`);
            
            context.res = {
                status: 200,
                body: {
                    blobUrlWithSas: finalUrlWithSas,
                    sasToken: `?${sasToken}`
                }
            };
        } catch (delegationError) {
            // Specific error handling for delegation errors
            context.log.error(`Error obtaining user delegation key: ${delegationError.message}`, delegationError);
            
            // Check for specific authorization errors
            if (delegationError.statusCode === 403) {
                context.res = {
                    status: 403,
                    body: {
                        error: 'Authorization failed.',
                        details: `The function app's managed identity does not have the required permissions. Ensure it has the 'Storage Blob Delegator' RBAC role on the storage account.`
                    }
                };
            } else {
                context.res = {
                    status: delegationError.statusCode || 500,
                    body: {
                        error: 'Failed to get user delegation key.',
                        details: `Error: ${delegationError.message}`
                    }
                };
            }
        }
    } catch (error) {
        // General error handling
        context.log.error(`Error in GetSasToken: ${error.message}`, error);
        context.res = {
            status: 500,
            body: {
                error: 'Failed to generate SAS token.',
                details: error.message
            }
        };
    } finally {
        context.log("--- GetSasToken Function Execution End ---");
    }
};

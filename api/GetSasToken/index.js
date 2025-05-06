const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
// Import necessary credentials, including ChainedTokenCredential
const { DefaultAzureCredential, AzureCliCredential, VisualStudioCodeCredential, ChainedTokenCredential } = require("@azure/identity");
const sharp = require('sharp'); // This import seems leftover from ProcessImage, but keeping it for now
const fetch = require('node-fetch'); // This import seems leftover from ProcessImage, but keeping it for now


module.exports = async function (context, req) {
    // --- START VERBOSE DEBUG LOGGING ---
    context.log("--- GetSasToken Function Execution Start ---");
    // Check if running locally or in production
    const isLocal = process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development';
    context.log(`Running in ${isLocal ? 'local development' : 'production'} mode`);
    // --- END VERBOSE DEBUG LOGGING ---

    try {
        const accountName = process.env.STORAGE_ACCOUNT_NAME;
        if (!accountName) {
            context.log.error("CRITICAL ERROR: Missing STORAGE_ACCOUNT_NAME environment variable.");
            // It looks like your local.settings.json has STORAGE_ACCOUNT_NAME, so this might not hit
            throw new Error("Missing STORAGE_ACCOUNT_NAME environment variable.");
        }
        context.log(`DEBUG: Using STORAGE_ACCOUNT_NAME: ${accountName}`);

        // Get query parameters
        // Added checks for undefined/null req.query values for safety
        const containerName = (req.query && req.query.container) ? req.query.container : 'input-images';
        const blobName = (req.query && req.query.filename) ? req.query.filename : undefined; // filename is optional for container SAS
        const accessType = (req.query && req.query.accessType) ? req.query.accessType : 'write';

        context.log(`DEBUG: Request params - container='${containerName}', filename='${blobName}', accessType='${accessType}'`);

        let permissions;
        if (accessType === 'read') {
            permissions = BlobSASPermissions.parse("r");
            context.log(`INFO: Generating READ SAS token for container: ${containerName}, blob: ${blobName || '(any)'}`);
        } else if (accessType === 'write') {
             // Corrected permissions to typically include 'create' and 'add' for uploads
             // 'a' (add) is required to append blocks to a block blob.
             // 'c' (create) is required to create a new block blob.
            permissions = BlobSASPermissions.parse("racw");
            context.log(`INFO: Generating WRITE SAS token for container: ${containerName}, blob: ${blobName || '(any)'}`);
        } else {
             context.log.error(`ERROR: Invalid accessType provided: ${accessType}. Must be 'read' or 'write'.`);
             // Using 400 status for client input errors
             context.res = {
                status: 400,
                body: {
                    error: 'Invalid accessType',
                    details: "Access type must be 'read' or 'write'."
                }
             };
             return; // Stop execution
        }

        // --- Authentication Logic (MODIFIED) ---
        let sasToken;
        const blobServiceUri = `https://${accountName}.blob.core.windows.net`;
        const startsOn = new Date();
        // Start a few minutes in the past to account for clock skew
        startsOn.setMinutes(startsOn.getMinutes() - 5);
        const expiresOn = new Date(startsOn);
        // Set expiry time, e.g., 1 hour from now
        expiresOn.setHours(startsOn.getHours() + 1);

        // Define SAS options
        const sasOptions = {
            containerName: containerName,
            permissions: permissions,
            protocol: 'https', // Enforce HTTPS
            startsOn: startsOn,
            expiresOn: expiresOn
        };
        
        // If a specific blob name was provided, scope the SAS to that blob
        if (blobName) {
            sasOptions.blobName = blobName;
        }
        
        // Check if we're running locally with a storage account key
        const storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;
        
        if (isLocal && storageAccountKey) {
            context.log("INFO: Running locally with storage account key.");
            
            // Create a StorageSharedKeyCredential with the account name and account key
            const sharedKeyCredential = new StorageSharedKeyCredential(accountName, storageAccountKey);
            
            // For local development, use the StorageSharedKeyCredential to generate the SAS token
            // This bypasses the need for Azure AD authentication and RBAC roles
            sasToken = generateBlobSASQueryParameters(
                sasOptions,
                sharedKeyCredential
            ).toString();
            
            context.log("INFO: SAS token generated using StorageSharedKeyCredential.");
            
        } else {
            // For production or if no storage account key is available, use Managed Identity
            let credential;
            let credentialTypeUsed = 'Unknown'; // For logging
            
            if (isLocal) {
                context.log("INFO: Attempting local credential acquisition using ChainedTokenCredential...");
                // Explicitly chain the desired local credentials
                // This order prioritizes Azure CLI, then VS Code
                credential = new ChainedTokenCredential(
                    new AzureCliCredential(),
                    new VisualStudioCodeCredential()
                );
                credentialTypeUsed = 'ChainedTokenCredential (Azure CLI, VS Code)';
                // Optional: Test token acquisition immediately to fail fast if local auth fails
                try {
                    context.log("DEBUG: Testing local credential token acquisition...");
                    await credential.getToken("https://storage.azure.com/.default");
                    context.log("INFO: Successfully acquired token with local credentials.");
                } catch (localAuthError) {
                    context.log.error("FATAL: Local authentication failed with ChainedTokenCredential. Ensure you are logged in via Azure CLI (az login) or VS Code and have 'Storage Blob Delegator' RBAC role assigned.", { localAuthError: localAuthError.message });
                    // Use a 401 or 403 status code if authentication/authorization fails
                    context.res = {
                        status: localAuthError.statusCode || 401, // Default to 401 Unauthorized
                        body: {
                            error: 'Local Azure authentication failed.',
                            details: `Please ensure you are logged in via Azure CLI (az login) or Visual Studio Code and your account has the 'Storage Blob Delegator' RBAC role on the storage account. Details: ${localAuthError.message}`
                        }
                    };
                    return; // Stop execution
                }
            } else {
                context.log("INFO: Running in Azure. Using DefaultAzureCredential (expecting Managed Identity).");
                // DefaultAzureCredential will work automatically with system-assigned
                // or user-assigned managed identity when deployed to Azure.
                credential = new DefaultAzureCredential();
                credentialTypeUsed = 'DefaultAzureCredential';
            }
            context.log(`DEBUG: Using credential type: ${credentialTypeUsed}`);
            
            // Instantiate BlobServiceClient with the selected credential
            const blobServiceClient = new BlobServiceClient(blobServiceUri, credential);
            
            // Ensure container exists before trying to get a key or SAS
            const containerClient = blobServiceClient.getContainerClient(containerName);
            context.log(`DEBUG: Checking if container '${containerName}' exists...`);
            const containerExists = await containerClient.exists();
            if (!containerExists) {
                context.log(`INFO: Container ${containerName} does not exist. Creating it...`);
                await containerClient.createIfNotExists();
                context.log(`INFO: Container ${containerName} created successfully or already exists.`);
            } else {
                context.log(`DEBUG: Container '${containerName}' exists.`);
            }
            
            // Get a user delegation key from the Blob Service using the authenticated credential
            context.log(`INFO: Requesting user delegation key valid from ${startsOn.toISOString()} to ${expiresOn.toISOString()}`);
            try {
                // The identity used by 'credential' must have the 'Storage Blob Delegator' role
                const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
                context.log("INFO: User delegation key obtained successfully.");
                
                // Generate the SAS token using the user delegation key
                context.log("DEBUG: Generating SAS query parameters with options:", JSON.stringify(sasOptions));
                sasToken = generateBlobSASQueryParameters(sasOptions, userDelegationKey, accountName).toString();
                
            } catch (delegationError) {
                context.log.error(`ERROR: Error obtaining user delegation key: ${delegationError.message}`, delegationError.stack || delegationError);
                // Checking for specific authorization errors (e.g., 403 Forbidden)
                if (delegationError.statusCode === 403) {
                    context.res = {
                        status: 403, // Forbidden
                        body: {
                            error: 'Authorization failed.',
                            details: `The identity used ('${credentialTypeUsed}') does not have the required permissions to generate a user delegation key. Ensure it has the 'Storage Blob Delegator' RBAC role on the storage account. Details: ${delegationError.message}`
                        }
                    };
                } else {
                    context.res = {
                        status: delegationError.statusCode || 500, // Default to 500 Internal Server Error
                        body: {
                            error: 'Failed to get user delegation key.',
                            details: `An unexpected error occurred while trying to get the user delegation key. Details: ${delegationError.message}`
                        }
                    };
                }
                return; // Stop execution
            }
        }

        // Construct the final URL that includes the SAS token
        const baseUrl = `${blobServiceUri}/${containerName}`;
        // Encode the blob name in the URL, especially if it contains special characters
        const resourceUrl = blobName ? `${baseUrl}/${encodeURIComponent(blobName)}` : baseUrl;
        const finalUrlWithSas = `${resourceUrl}?${sasToken}`;


        context.log(`INFO: Successfully generated SAS URL for ${accessType} access.`);
        // Log a truncated version of the URL for safety
        // context.log(`DEBUG: SAS URL (token truncated): ${finalUrlWithSas.substring(0, finalUrlWithSas.indexOf('?') + 20)}...`);


        // Return the SAS URL and potentially the token string in the response body
        context.res = {
            status: 200,
            body: {
                blobUrlWithSas: finalUrlWithSas,
                // You might not need to return the raw sasToken separately if blobUrlWithSas is used directly
                sasToken: `?${sasToken}`
            }
        };

    } catch (error) {
        // Catch any errors not specifically handled above
        const errorMessage = error.message || "Unknown error";
        context.log.error(`!!! GetSasToken Function Error !!! Message: ${errorMessage}`, error.stack || error);

        // Provide a generic 500 error response for unhandled errors
        context.res = {
            status: 500,
            body: {
                error: 'Failed to generate SAS token due to an internal server error.',
                details: errorMessage // Include the specific error message for debugging
            }
        };
    } finally {
        context.log("--- GetSasToken Function Execution End ---");
    }
};

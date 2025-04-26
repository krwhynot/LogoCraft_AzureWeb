const { app } = require('@azure/functions');
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

app.http('GetSasToken', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Replace with your storage account name
            const accountName = 'logocraftstorage'; // Replace with your actual storage account name
            const accountKey = process.env.STORAGE_ACCOUNT_KEY; // Will be set in Function App settings
            
            // Container for input images (can be overridden by query parameter)
            const containerName = request.query.get('container') || 'input-images';
            
            context.log(`Generating SAS token for container: ${containerName}`);
            
            // Create shared key credentials
            const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
            
            // Get container URL
            const containerUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
            
            // Set permission and expiry for SAS token
            const permissions = new BlobSASPermissions();
            permissions.write = true;
            permissions.read = true;
            permissions.create = true;
            
            // Set expiry time (1 hour from now)
            const expiryTime = new Date();
            expiryTime.setHours(expiryTime.getHours() + 1);
            
            // Generate SAS token
            const sasToken = generateBlobSASQueryParameters({
                containerName,
                permissions,
                expiryTime
            }, sharedKeyCredential).toString();
            
            // Return SAS token and container URL
            return {
                status: 200,
                jsonBody: {
                    sasToken: `?${sasToken}`,
                    containerUrl
                }
            };
            
        } catch (error) {
            context.error('Error generating SAS token:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to generate SAS token' }
            };
        }
    }
});

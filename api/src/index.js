const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        // Replace with your storage account name
        const accountName = 'logocraftstorage'; // Replace with your actual storage account name
        const accountKey = process.env.STORAGE_ACCOUNT_KEY; // Will be set in Function App settings
        
        // Container for input images (can be overridden by query parameter)
        const containerName = req.query.container || 'input-images';
        
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
        context.res = {
            status: 200,
            body: {
                sasToken: `?${sasToken}`,
                containerUrl
            }
        };
        
        context.log('SAS Token generated successfully');
    } catch (error) {
        context.log.error('Error generating SAS token:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to generate SAS token' }
        };
    }
};
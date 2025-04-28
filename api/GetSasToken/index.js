// api/GetSasToken/index.js

const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const accountName = 'logocraftstorage2200'; 
        const accountKey = process.env.STORAGE_ACCOUNT_KEY; 
        
        if (!accountKey) {
             throw new Error("Azure Storage Account Key is not configured in environment variables (STORAGE_ACCOUNT_KEY).");
        }
        const containerName = req.query.container || 'input-images';

        context.log(`Generating SAS token for container: ${containerName}`);

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const containerUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;

        const permissions = new BlobSASPermissions();
        permissions.read = true;  
        permissions.write = true; 
        permissions.create = true;

        const expiresOn = new Date(); 
        expiresOn.setHours(expiresOn.getHours() + 1); 

        const sasToken = generateBlobSASQueryParameters({
            containerName,
            permissions: permissions.toString(), 
            startsOn: new Date(), 
            expiresOn: expiresOn,       
        }, sharedKeyCredential).toString();

        context.res = {
            status: 200,
            body: {
                sasToken: `?${sasToken}`, 
                containerUrl
            }
        };
    } catch (error) {
        context.log.error('Error generating SAS token:', error.message); 
        context.res = {
            status: 500,
            body: { error: 'Failed to generate SAS token', details: error.message } 
        };
    }
};
const {
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions
} = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const accountName = 'logocraftstorage2200';
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;

        const containerName = req.query.container || 'input-images';
        const blobName = req.query.filename;  // Required

        if (!accountKey || !blobName) {
            throw new Error("Missing STORAGE_ACCOUNT_KEY or 'filename' query param.");
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const permissions = new BlobSASPermissions();
        permissions.read = true;
        permissions.write = true;
        permissions.create = true;

        const startsOn = new Date();
        const expiresOn = new Date(startsOn);
        expiresOn.setHours(startsOn.getHours() + 1);

        const sasToken = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions,
            startsOn,
            expiresOn
        }, sharedKeyCredential).toString();

        const blobUrlWithSas = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

        context.res = {
            status: 200,
            body: {
                blobUrlWithSas
            }
        };
    } catch (error) {
        context.log.error('Error generating SAS token:', error.message);
        context.res = {
            status: 500,
            body: {
                error: 'Failed to generate SAS token',
                details: error.message
            }
        };
    }
};

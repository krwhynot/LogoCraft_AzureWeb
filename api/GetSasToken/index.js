const {
    BlobServiceClient,
    BlobSASPermissions
} = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        // Get connection string from environment variables
        const connectionString = process.env.AzureWebJobsStorage;
        if (!connectionString) {
            throw new Error("Missing AzureWebJobsStorage connection string");
        }
        
        // Get container name from query or use default
        const containerName = req.query.container || 'input-images';
        // The filename is required
        const blobName = req.query.filename;
        
        if (!blobName) {
            throw new Error("Missing required 'filename' query parameter.");
        }

        context.log("Generating SAS token for", containerName, blobName);

        // Create the BlobServiceClient using the connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Generate SAS token with appropriate permissions
        const blobClient = containerClient.getBlobClient(blobName);
        
        // Create a SAS token that expires in 1 hour
        const expiresOn = new Date();
        expiresOn.setHours(expiresOn.getHours() + 1);
        
        // Generate SAS URL with permissions
        const sasUrl = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse("racw"),  // read, add, create, write
            expiresOn: expiresOn
        });
        
        context.log("SAS URL generated successfully");
        
        context.res = {
            status: 200,
            body: {
                blobUrlWithSas: sasUrl
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
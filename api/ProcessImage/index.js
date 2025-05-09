// ProcessImage/index.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require("@azure/identity");
const sharp = require('sharp');
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    try {
        // Validate request
        if (!req.body || !req.body.sourceUrl || !req.body.formats) {
            context.res = { status: 400, body: { error: 'Source URL and formats are required' } };
            return;
        }

        const { sourceUrl, formats } = req.body;
        if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('https://')) {
            throw new Error('Invalid source URL format');
        }

        // Get storage account name from environment
        const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
        if (!storageAccountName) {
            throw new Error('STORAGE_ACCOUNT_NAME environment variable is not set.');
        }

        const inputContainerName = 'input-images';
        const outputContainerName = 'output-images';
        
        // Initialize Blob Service Client with Managed Identity via DefaultAzureCredential
        const blobServiceUri = `https://${storageAccountName}.blob.core.windows.net`;
        const credential = new DefaultAzureCredential();
        const blobServiceClient = new BlobServiceClient(blobServiceUri, credential);
        
        // Get container clients
        const outputContainerClient = blobServiceClient.getContainerClient(outputContainerName);
        
        // Ensure output container exists
        const outputContainerExists = await outputContainerClient.exists();
        if (!outputContainerExists) {
            context.log(`Output container ${outputContainerName} does not exist. Creating it...`);
            await outputContainerClient.create();
        }

        // Parse the source URL to extract the blob name
        let inputBlobName;
        try {
            const urlObj = new URL(sourceUrl);
            const pathParts = urlObj.pathname.split('/');
            inputBlobName = pathParts[pathParts.length - 1];
        } catch (error) {
            throw new Error(`Failed to parse source URL: ${error.message}`);
        }

        // Download the source image
        let imageBuffer;
        
        // Try using managed identity to download the blob
        if (inputBlobName) {
            try {
                context.log(`Attempting to download blob ${inputBlobName} using Managed Identity`);
                const inputContainerClient = blobServiceClient.getContainerClient(inputContainerName);
                const blockBlobClient = inputContainerClient.getBlockBlobClient(inputBlobName);
                const downloadResponse = await blockBlobClient.download(0);
                
                // Convert stream to buffer
                const chunks = [];
                const readableStream = downloadResponse.readableStreamBody;
                for await (const chunk of readableStream) {
                    chunks.push(chunk);
                }
                imageBuffer = Buffer.concat(chunks);
                context.log('Source image downloaded successfully using Managed Identity');
            } catch (error) {
                context.log.warn(`Failed to download using Managed Identity: ${error.message}. Falling back to direct URL download.`);
            }
        }
        
        // Fall back to the provided sourceUrl if Managed Identity download failed
        if (!imageBuffer) {
            context.log('Downloading source image using provided URL with SAS token');
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                throw new Error(`Failed to download source image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            context.log('Source image downloaded successfully using provided URL');
        }

        const processedImages = [];

        // Process each selected format
        for (const formatKey of Object.keys(formats)) {
            if (formats[formatKey]) {
                const targetDimensions = getFormatDimensions(formatKey);
                context.log(`Processing format: ${formatKey} (Target: ${targetDimensions.width}x${targetDimensions.height})`);

                let processedBuffer;
                let contentType;
                let finalInfo;

                // Process image based on format
                if (formatKey.endsWith('.bmp')) {
                    processedBuffer = await createMonochromeBmp(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                    contentType = 'image/bmp';
                    finalInfo = { width: targetDimensions.width, height: targetDimensions.height };
                } else {
                    const pngResult = await createPng(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                    processedBuffer = pngResult.buffer;
                    contentType = pngResult.contentType;
                    finalInfo = pngResult.finalInfo;
                }

                // Generate unique blob name and upload to storage
                const uniqueBlobName = `${Date.now()}_${formatKey}`;
                const blockBlobClient = outputContainerClient.getBlockBlobClient(uniqueBlobName);

                context.log(`Uploading processed image: ${uniqueBlobName} as ${contentType}`);
                await blockBlobClient.uploadData(processedBuffer, {
                    blobHTTPHeaders: { blobContentType: contentType }
                });

                // Add to results
                processedImages.push({
                    name: formatKey,
                    blobName: uniqueBlobName,
                    containerName: outputContainerName,
                    url: blockBlobClient.url,
                    size: `${finalInfo.width}×${finalInfo.height}`,
                    dimensions: { width: finalInfo.width, height: finalInfo.height }
                });

                context.log(`Processed and uploaded: ${formatKey} (Actual: ${finalInfo.width}x${finalInfo.height})`);
            }
        }

        // Return results
        context.res = {
            status: 200,
            body: { processedImages }
        };
        context.log('Processing completed successfully', { processedCount: processedImages.length });

    } catch (error) {
        context.log.error('Error processing image:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to process image', details: error.message }
        };
    }
};

// Helper functions for image processing
function getFormatDimensions(format) {
    switch (format) {
        case 'Logo.png': return { width: 300, height: 300 };
        case 'Smalllogo.png': return { width: 136, height: 136 };
        case 'KDlogo.png': return { width: 140, height: 112 };
        case 'RPTlogo.bmp': return { width: 155, height: 110 };
        case 'PRINTLOGO.bmp': return { width: 600, height: 256 };
        case 'Feature Graphic.png': return { width: 1024, height: 500 };
        case 'hpns.png': return { width: 96, height: 96 };
        case 'loginLogo.png': return { width: 600, height: 600 };
        case 'logo.png': return { width: 300, height: 300 };
        // Add more formats as needed
        default: return { width: 300, height: 300 };
    }
}

async function createPng(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Applying PNG processing chain for ${targetWidth}x${targetHeight}`);
    let sharpInstance = sharp(inputBuffer).resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
    });

    const { data: finalBuffer, info } = await sharpInstance
        .png({ compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });

    return { buffer: finalBuffer, contentType: 'image/png', finalInfo: info };
}

async function createMonochromeBmp(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Starting BMP creation for ${targetWidth}x${targetHeight}`);

    let sharpInstance = sharp(inputBuffer)
        .flatten({ background: 'white' })
        .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: 'white'
        })
        .grayscale()
        .threshold(128);

    // For simplicity, we'll use raw output to create our BMP manually
    // This is a simplified version - in production you would implement proper BMP creation
    // For now, we'll just return what sharp gives us
    const bmpBuffer = await sharpInstance
        .toFormat('bmp')
        .toBuffer();

    return bmpBuffer;
}

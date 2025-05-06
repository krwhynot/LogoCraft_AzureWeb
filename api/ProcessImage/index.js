const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require("@azure/identity");
const sharp = require('sharp');
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    try {
        if (!req.body || !req.body.sourceUrl || !req.body.formats) {
            context.res = { status: 400, body: { error: 'Source URL and formats are required' } };
            return;
        }

        const { sourceUrl, formats } = req.body;
        if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('https://')) {
            throw new Error('Invalid source URL format');
        }

        const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
        if (!storageAccountName) {
            throw new Error('STORAGE_ACCOUNT_NAME environment variable is not set.');
        }

        const inputContainerName = 'input-images';
        const outputContainerName = 'output-images';
        context.log('Processing image request', { sourceUrl, formatCount: Object.keys(formats).length });

        // Check if we're running locally with a storage account key
        const storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;
        // Force isLocal to true for local development since AZURE_FUNCTIONS_ENVIRONMENT might not be set correctly
        const isLocal = true;
        context.log(`DEBUG: Forcing isLocal = ${isLocal} for local development`);
        const blobServiceUri = `https://${storageAccountName}.blob.core.windows.net`;
        let blobServiceClient;
        
        if (isLocal && storageAccountKey) {
            context.log("INFO: Running locally with storage account key.");
            try {
                // For local development, use the storage account key
                // This bypasses the need for Azure AD authentication and RBAC roles
                const connectionString = `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey};EndpointSuffix=core.windows.net`;
                blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
                context.log("INFO: Using storage account key for authentication.");
            } catch (error) {
                context.log.error("Error creating BlobServiceClient with connection string:", error.message);
                throw new Error(`Failed to create BlobServiceClient: ${error.message}`);
            }
        } else {
            context.log("INFO: Using DefaultAzureCredential (Managed Identity or Azure CLI).");
            // Use DefaultAzureCredential which works with Managed Identity
            const credential = new DefaultAzureCredential();
            blobServiceClient = new BlobServiceClient(blobServiceUri, credential);
        }

        // Get container clients
        const outputContainerClient = blobServiceClient.getContainerClient(outputContainerName);
        
        // Ensure output container exists
        const outputContainerExists = await outputContainerClient.exists();
        if (!outputContainerExists) {
            context.log(`Output container ${outputContainerName} does not exist. Creating it...`);
            await outputContainerClient.create();
            context.log(`Output container ${outputContainerName} created successfully.`);
        }

        // Parse the source URL to extract the blob name
        // This handles URLs both with and without SAS tokens
        let inputBlobName;
        try {
            const urlObj = new URL(sourceUrl);
            const pathParts = urlObj.pathname.split('/');
            // Last part of the path is the blob name
            inputBlobName = pathParts[pathParts.length - 1];
        } catch (error) {
            throw new Error(`Failed to parse source URL: ${error.message}`);
        }

        // Download the source image - two options:
        let imageBuffer;
        
        // Option 1: Try using managed identity first (if inputBlobName was extracted successfully)
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
                context.log.warn(`Failed to download using Managed Identity: ${error.message}. Falling back to sourceUrl.`);
                // Fall back to Option 2
            }
        }
        
        // Option 2: Fall back to the provided sourceUrl (with SAS token) if Option 1 fails
        if (!imageBuffer) {
            context.log('Downloading source image using provided URL with SAS token:', sourceUrl);
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                throw new Error(`Failed to download source image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            context.log('Source image downloaded successfully using provided URL');
        }

        const processedImages = [];

        for (const formatKey of Object.keys(formats)) {
            if (formats[formatKey]) {
                const targetDimensions = getFormatDimensions(formatKey);
                context.log(`Processing format: ${formatKey} (Target: ${targetDimensions.width}x${targetDimensions.height})`);

                let processedBuffer;
                let contentType;
                let finalInfo;

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

                const uniqueBlobName = `${Date.now()}_${formatKey}`;
                const blockBlobClient = outputContainerClient.getBlockBlobClient(uniqueBlobName);

                context.log(`Uploading processed image: ${uniqueBlobName} as ${contentType}`);
                await blockBlobClient.uploadData(processedBuffer, {
                    blobHTTPHeaders: { blobContentType: contentType }
                });

                // Return blob info without SAS token
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

        context.res = {
            status: 200,
            body: { processedImages }
        };
        context.log('Processing completed successfully', { processedCount: processedImages.length });

    } catch (error) {
        context.log.error('Error processing image:', error.stack || error.message || error);
        context.res = {
            status: 500,
            body: { error: 'Failed to process image', details: error.message }
        };
    }
};

function getFormatDimensions(format) {
    switch (format) {
        case 'Logo.png': return { width: 300, height: 300 };
        case 'Smalllogo.png': return { width: 136, height: 136 };
        case 'KDlogo.png': return { width: 140, height: 112 };
        case 'RPTlogo.bmp': return { width: 155, height: 110 };
        case 'PRINTLOGO.bmp': return { width: 600, height: 256 };
        case 'Feature Graphic.png': return { width: 1024, height: 500 };
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
    context.log(`Starting manual 1-bit BMP creation for ${targetWidth}x${targetHeight}`);

    let sharpInstance = sharp(inputBuffer)
        .flatten({ background: 'white' })
        .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: 'white'
        })
        .grayscale()
        .threshold(128);

    const { data: rawData, info } = await sharpInstance
        .raw()
        .toBuffer({ resolveWithObject: true });

    const bitsPerPixel = 1;
    const rowSizeUnpadded = Math.ceil((targetWidth * bitsPerPixel) / 8);
    const rowSizePadded = Math.ceil(rowSizeUnpadded / 4) * 4;
    const pixelDataSize = rowSizePadded * targetHeight;
    const paletteSize = 8;
    const fileHeaderSize = 14;
    const infoHeaderSize = 40;
    const pixelDataOffset = fileHeaderSize + infoHeaderSize + paletteSize;
    const fileSize = pixelDataOffset + pixelDataSize;

    const bmpBuffer = Buffer.alloc(fileSize);
    bmpBuffer.write('BM', 0);
    bmpBuffer.writeUInt32LE(fileSize, 2);
    bmpBuffer.writeUInt32LE(0, 6);
    bmpBuffer.writeUInt32LE(pixelDataOffset, 10);
    bmpBuffer.writeUInt32LE(infoHeaderSize, 14);
    bmpBuffer.writeInt32LE(targetWidth, 18);
    bmpBuffer.writeInt32LE(targetHeight, 22);
    bmpBuffer.writeUInt16LE(1, 26);
    bmpBuffer.writeUInt16LE(bitsPerPixel, 28);
    bmpBuffer.writeUInt32LE(0, 30);
    bmpBuffer.writeUInt32LE(pixelDataSize, 34);

    const dpi = 203;
    const pixelsPerMeter = Math.round(dpi / 0.0254);
    bmpBuffer.writeInt32LE(pixelsPerMeter, 38);
    bmpBuffer.writeInt32LE(pixelsPerMeter, 42);
    bmpBuffer.writeUInt32LE(2, 46);
    bmpBuffer.writeUInt32LE(0, 50);
    bmpBuffer.writeUInt32LE(0x00000000, fileHeaderSize + infoHeaderSize); // Black
    bmpBuffer.writeUInt32LE(0x00FFFFFF, fileHeaderSize + infoHeaderSize + 4); // White

    let bmpBufferWriteIndex = pixelDataOffset;
    for (let y = targetHeight - 1; y >= 0; y--) {
        let currentByte = 0;
        let bitPosition = 0;
        let bytesWrittenInRow = 0;

        for (let x = 0; x < targetWidth; x++) {
            const rawDataIndex = y * targetWidth + x;
            const pixelValue = rawData[rawDataIndex];
            const bit = pixelValue < 128 ? 0 : 1;
            currentByte |= (bit << (7 - bitPosition));
            bitPosition++;

            if (bitPosition === 8) {
                bmpBuffer[bmpBufferWriteIndex++] = currentByte;
                currentByte = 0;
                bitPosition = 0;
                bytesWrittenInRow++;
            }
        }

        if (bitPosition > 0) {
            bmpBuffer[bmpBufferWriteIndex++] = currentByte;
            bytesWrittenInRow++;
        }

        while (bytesWrittenInRow < rowSizePadded) {
            bmpBuffer[bmpBufferWriteIndex++] = 0x00;
            bytesWrittenInRow++;
        }
    }

    return bmpBuffer;
}

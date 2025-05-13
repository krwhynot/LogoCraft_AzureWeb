// ProcessImage/index.js (Consolidated Function)
const { BlobServiceClient, BlobSASPermissions, SASProtocol } = require('@azure/storage-blob');
const sharp = require('sharp');
const fetch = require('node-fetch'); // For downloading source image if needed

module.exports = async function (context, req) {
    context.log("--- Image Processing Function Execution Start ---");

    const action = req.query.action;
    const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!storageConnectionString) {
        context.log.error("Missing AZURE_STORAGE_CONNECTION_STRING environment variable.");
        context.res = { status: 500, body: { error: "Server configuration error: Missing storage connection string." } };
        return;
    }

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);

        if (action === 'getUploadSas') {
            context.log("Action: getUploadSas");
            const blobName = req.query.filename || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.tmp`; // Generate a unique name if not provided
            const containerName = 'uploads'; // As per simplified plan

            const containerClient = blobServiceClient.getContainerClient(containerName);
            // Ensure container exists (optional, but good practice)
            await containerClient.createIfNotExists();

            const permissions = new BlobSASPermissions();
            permissions.write = true;
            permissions.create = true;
            permissions.add = true; // Required for some upload scenarios

            const startsOn = new Date();
            const expiresOn = new Date(startsOn);
            expiresOn.setHours(startsOn.getHours() + 1); // 1 hour validity

            // Generate SAS URL for the specific blob
            // This allows the client to upload directly to this blob name
            const blobClient = containerClient.getBlobClient(blobName);
            const sasUrl = await blobClient.generateSasUrl({
                permissions: permissions,
                startsOn: startsOn, // Optional: Starts immediately by default
                expiresOn: expiresOn,
                protocol: SASProtocol.HttpHttps // Allow both HTTP and HTTPS for local Azurite flexibility
            });

            context.log(`Successfully generated SAS URL (HTTP/HTTPS) for upload to ${containerName}/${blobName}`);
            context.res = {
                status: 200,
                body: {
                    uploadUrl: sasUrl, // URL client should PUT to
                    blobName: blobName // Blob name client should use (or confirm)
                }
            };

        } else if (action === 'processImage') {
            context.log("Action: processImage");
            if (!req.body || !req.body.sourceBlobName || !req.body.formats) {
                context.res = { status: 400, body: { error: 'sourceBlobName and formats are required in the request body.' } };
                return;
            }

            const { sourceBlobName, formats } = req.body;
            const inputContainerName = 'uploads';
            const outputContainerName = 'downloads'; // As per simplified plan

            const inputContainerClient = blobServiceClient.getContainerClient(inputContainerName);
            const outputContainerClient = blobServiceClient.getContainerClient(outputContainerName);
            await outputContainerClient.createIfNotExists({ access: 'blob' }); // Ensure public read for downloads

            // Download the source image from 'uploads' container
            context.log(`Downloading source image: ${inputContainerName}/${sourceBlobName}`);
            const sourceBlobClient = inputContainerClient.getBlobClient(sourceBlobName);
            
            let imageBuffer;
            try {
                const downloadResponse = await sourceBlobClient.downloadToBuffer();
                imageBuffer = downloadResponse; // downloadToBuffer directly returns the buffer
                context.log('Source image downloaded successfully from uploads container.');
            } catch (downloadError) {
                context.log.error(`Failed to download source image ${sourceBlobName} from ${inputContainerName}: ${downloadError.message}`);
                // Check if the sourceUrl was provided as a fallback (e.g., if client uploaded elsewhere)
                if (req.body.sourceUrl && typeof req.body.sourceUrl === 'string' && req.body.sourceUrl.startsWith('https://')) {
                    context.log.warn(`Attempting to download from provided sourceUrl: ${req.body.sourceUrl}`);
                     const response = await fetch(req.body.sourceUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to download source image from provided URL: ${response.statusText}`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                    context.log('Source image downloaded successfully using provided sourceUrl.');
                } else {
                    throw new Error(`Failed to download source image and no valid fallback sourceUrl provided. Error: ${downloadError.message}`);
                }
            }


            const processedImages = [];
            for (const formatKey of Object.keys(formats)) {
                if (formats[formatKey]) { // Check if this format is requested
                    const targetDimensions = getFormatDimensions(formatKey, context); // Pass context for logging
                    context.log(`Processing format: ${formatKey} (Target: ${targetDimensions.width}x${targetDimensions.height})`);

                    let processedBuffer;
                    let contentType;
                    let finalInfo;

                    if (formatKey.endsWith('.bmp')) {
                        processedBuffer = await createMonochromeBmp(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                        contentType = 'image/bmp';
                        finalInfo = { width: targetDimensions.width, height: targetDimensions.height }; // Assuming target is met
                    } else { // Assuming PNG otherwise
                        const pngResult = await createPng(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                        processedBuffer = pngResult.buffer;
                        contentType = pngResult.contentType;
                        finalInfo = pngResult.finalInfo;
                    }

                    const outputBlobName = `${Date.now()}_${formatKey.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize name
                    const outputBlobClient = outputContainerClient.getBlockBlobClient(outputBlobName);

                    context.log(`Uploading processed image: ${outputBlobName} as ${contentType}`);
                    await outputBlobClient.uploadData(processedBuffer, {
                        blobHTTPHeaders: { blobContentType: contentType }
                    });

                    processedImages.push({
                        name: formatKey,
                        url: outputBlobClient.url, // Direct public URL
                        size: `${finalInfo.width}×${finalInfo.height}`,
                        dimensions: { width: finalInfo.width, height: finalInfo.height }
                    });
                    context.log(`Processed and uploaded: ${formatKey} (Actual: ${finalInfo.width}x${finalInfo.height}) to ${outputBlobClient.url}`);
                }
            }

            context.res = {
                status: 200,
                body: { processedImages }
            };
            context.log('Processing completed successfully.', { processedCount: processedImages.length });

        } else {
            context.log.warn(`Invalid action provided: ${action}`);
            context.res = {
                status: 400,
                body: { error: "Invalid action. Must be 'getUploadSas' or 'processImage'." }
            };
        }
    } catch (error) {
        context.log.error(`Error in Image Processing Function: ${error.message}`, error.stack);
        context.res = {
            status: 500,
            body: { error: 'Failed to process request.', details: error.message }
        };
    } finally {
        context.log("--- Image Processing Function Execution End ---");
    }
};

// Helper functions for image processing (can be moved to a separate file if large)
function getFormatDimensions(format, context) {
    // It's good practice to log if a format is not found, or handle it gracefully.
    const dimensions = {
        'Logo.png': { width: 300, height: 300 },
        'Smalllogo.png': { width: 136, height: 136 },
        'KDlogo.png': { width: 140, height: 112 },
        'RPTlogo.bmp': { width: 155, height: 110 },
        'PRINTLOGO.bmp': { width: 600, height: 256 },
        'Feature Graphic.png': { width: 1024, height: 500 },
        'hpns.png': { width: 96, height: 96 },
        'loginLogo.png': { width: 600, height: 600 },
        // 'logo.png' is duplicated, assuming one is a typo or specific context. Keeping one.
    };
    if (dimensions[format]) {
        return dimensions[format];
    }
    context.log.warn(`Dimensions not found for format: ${format}. Using default 300x300.`);
    return { width: 300, height: 300 }; // Default dimensions
}

async function createPng(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Applying PNG processing: target ${targetWidth}x${targetHeight}`);
    let sharpInstance = sharp(inputBuffer).resize(targetWidth, targetHeight, {
        fit: 'inside', // Preserves aspect ratio, fits within dimensions
        withoutEnlargement: true // Don't enlarge if source is smaller
    });

    const { data: finalBuffer, info } = await sharpInstance
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer({ resolveWithObject: true });
    
    context.log(`PNG processing complete. Output info: ${info.width}x${info.height}, size: ${info.size}`);
    return { buffer: finalBuffer, contentType: 'image/png', finalInfo: info };
}

async function createMonochromeBmp(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Applying Monochrome BMP processing: target ${targetWidth}x${targetHeight}`);
    // For monochrome BMP, 'contain' with a background color is often desired to ensure
    // the entire image content is visible within the target dimensions without cropping,
    // and the remaining space is filled with the background color.
    let sharpInstance = sharp(inputBuffer)
        .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        })
        .flatten({ background: '#FFFFFF' }) // Ensure no alpha channel for BMP
        .grayscale() // Convert to grayscale first
        .threshold(128); // Dither to monochrome (black and white)

    const { data: finalBuffer, info } = await sharpInstance
        .bmp() // Specify BMP output
        .toBuffer({ resolveWithObject: true });

    context.log(`Monochrome BMP processing complete. Output info: ${info.width}x${info.height}, size: ${info.size}`);
    return finalBuffer; // Sharp handles BMP header correctly
}

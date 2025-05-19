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

                    // Use the same simple approach for all formats
                    const processedBuffer = await sharp(imageBuffer)
                        .resize({
                            width: targetDimensions.width,
                            height: targetDimensions.height,
                            fit: 'contain',
                            position: 'center',
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        })
                        .flatten({ background: { r: 255, g: 255, b: 255 } })
                        // Only apply grayscale and threshold to BMP formats
                        .grayscale(formatKey.endsWith('.bmp'))
                        .threshold(formatKey.endsWith('.bmp') ? 175 : 0)
                        .png()
                        .toBuffer();

                    // Determine content type based on format extension
                    const contentType = formatKey.endsWith('.bmp') ? 'image/bmp' : 'image/png';

                    const outputBlobName = `${Date.now()}_${formatKey.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize name
                    const outputBlobClient = outputContainerClient.getBlockBlobClient(outputBlobName);

                    context.log(`Uploading processed image: ${outputBlobName} as ${contentType}`);
                    await outputBlobClient.uploadData(processedBuffer, {
                        blobHTTPHeaders: { blobContentType: contentType }
                    });

                    processedImages.push({
                        name: formatKey,
                        url: outputBlobClient.url, // Direct public URL
                        size: `${targetDimensions.width}×${targetDimensions.height}`,
                        dimensions: { width: targetDimensions.width, height: targetDimensions.height }
                    });
                    context.log(`Processed and uploaded: ${formatKey} (Actual: ${targetDimensions.width}x${targetDimensions.height}) to ${outputBlobClient.url}`);
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

// Helper functions for image processing
function getFormatDimensions(format, context) {
  const dimensions = {
    'Logo.png': { width: 300, height: 300 },
    'Smalllogo.png': { width: 136, height: 136 },
    'KDlogo.png': { width: 140, height: 112 },
    'RPTlogo.bmp': { width: 155, height: 110 },
    'PRINTLOGO.bmp': { width: 600, height: 256 },
    'Feature Graphic.png': { width: 1024, height: 500 },
    'hpns.png': { width: 96, height: 96 },
    'loginLogo.png': { width: 600, height: 600 },
    'logo.png': { width: 300, height: 300 },
    'logo@2x.png': { width: 300, height: 300 },
    'logo@3x.png': { width: 300, height: 300 },
    'appicon-60.png': { width: 60, height: 60 },
    'appicon-60@2x.png': { width: 120, height: 120 },
    'appicon-60@3x.png': { width: 180, height: 180 },
    'appicon.png': { width: 57, height: 57 },
    'appicon-512.png': { width: 512, height: 512 },
    'appicon@2x.png': { width: 114, height: 114 },
    'default_app_logo.png': { width: 512, height: 512 },
    'DefaultIcon.png': { width: 1024, height: 1024 },
    'default-large.png': { width: 640, height: 1136 },
    'Default-568h@2x.png': { width: 640, height: 1136 },
    'Default-677h@2x.png': { width: 750, height: 1334 },
    'Default-736h@3x.png': { width: 1242, height: 2208 },
    'Default-Portrait-1792h@2x.png': { width: 828, height: 1792 },
    'Default-Portrait-2436h@3x.png': { width: 1125, height: 2436 },
    'Default-Portrait-2688h@3x.png': { width: 1242, height: 2688 },
    'Default.png': { width: 640, height: 980 },
    'Default@2x.png': { width: 1242, height: 1902 },
    'CarryoutBtn.png': { width: 300, height: 300 },
    'DeliveryBtn.png': { width: 300, height: 300 },
    'FutureBtn.png': { width: 300, height: 300 },
    'NowBtn.png': { width: 300, height: 300 }
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
    fit: "inside", // Preserves aspect ratio, fits within dimensions
    withoutEnlargement: true, // Don't enlarge if source is smaller
  });

  const { data: finalBuffer, info } = await sharpInstance
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true });

  context.log(
    `PNG processing complete. Output info: ${info.width}x${info.height}, size: ${info.size}`
  );
  return { buffer: finalBuffer, contentType: "image/png", finalInfo: info };
}

// Function to create a monochrome BMP image
async function createMonochromeBmp(inputBuffer, targetWidth, targetHeight, context) {
  context.log(`Creating monochrome BMP: ${targetWidth}×${targetHeight}`);

  try {
    // Simply use Sharp's built-in processing
    // Focus on getting a visible image first
    const processedBuffer = await sharp(inputBuffer)
      // Resize within a white canvas, centered
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      // Ensure white background for any transparency
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      // Convert to grayscale
      .grayscale()
      // Use higher threshold (175) to ensure we get visible output
      .threshold(175)
      // Output as PNG (since BMP output isn't directly supported)
      .png()
      .toBuffer();

    context.log(`Processed image buffer size: ${processedBuffer.length} bytes`);
    return processedBuffer;
  } catch (error) {
    context.log.error('Error creating monochrome image:', error);
    throw error;
  }
}


// api/ProcessImage/index.js
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const sharp = require('sharp');
const fetch = require('node-fetch');
const fastBmp = require('fast-bmp');

module.exports = async function (context, req) {
    try {
        if (!req.body || !req.body.sourceUrl || !req.body.formats) {
            context.res = { status: 400, body: { error: 'Source URL and formats are required' } };
            return;
        }

        const { sourceUrl, formats } = req.body;
        const accountName = 'logocraftstorage2200';
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;
        const outputContainer = 'output-images';

        if (!accountKey) {
            throw new Error("Azure Storage Account Key is not configured.");
        }

        context.log('Processing image request', { sourceUrl, formatCount: Object.keys(formats).length });

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
        const containerClient = blobServiceClient.getContainerClient(outputContainer);

        context.log('Downloading source image:', sourceUrl);
        const response = await fetch(sourceUrl);
        if (!response.ok) {
            throw new Error(`Failed to download source image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        context.log('Source image downloaded successfully');

        const processedImages = [];

        for (const formatKey of Object.keys(formats)) {
            if (formats[formatKey]) {
                const dimensions = getFormatDimensions(formatKey);
                context.log(`Processing format: ${formatKey} (Target: ${dimensions.width}x${dimensions.height})`);

                const { buffer: processedBuffer, contentType, finalInfo } = await processImage(imageBuffer, dimensions, formatKey, context);

                const uniqueBlobName = `${Date.now()}_${formatKey}`;
                const blockBlobClient = containerClient.getBlockBlobClient(uniqueBlobName);

                context.log(`Uploading processed image: ${uniqueBlobName} as ${contentType}`);
                await blockBlobClient.uploadData(processedBuffer, {
                    blobHTTPHeaders: { blobContentType: contentType }
                });

                processedImages.push({
                    name: formatKey,
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


async function processImage(inputBuffer, targetDimensions, formatKey, context) {
    let isBmpOutput = formatKey.endsWith('.bmp');
    let outputContentType = isBmpOutput ? 'image/bmp' : 'image/png';
    let finalInfo;

    let sharpInstance = sharp(inputBuffer);

    if (isBmpOutput) {
        context.log(`Applying BMP processing chain for ${formatKey}`);
        sharpInstance = sharpInstance.flatten({ background: 'white' });

        sharpInstance = sharpInstance.resize(targetDimensions.width, targetDimensions.height, {
            fit: 'contain',
            background: 'white'
        });

        sharpInstance = sharpInstance.grayscale().threshold(128);

        const { data: rawData, info } = await sharpInstance
            .raw()
            .toBuffer({ resolveWithObject: true });

        finalInfo = info;
        context.log(`Raw data for BMP: ${info.width}x${info.height}, channels: ${info.channels}`);
        if (info.channels !== 1) {
             context.log.warn(`Expected 1 channel after grayscale/threshold, but got ${info.channels}.`);
         }
         if (info.width !== targetDimensions.width || info.height !== targetDimensions.height) {
             context.log.warn(`Dimension mismatch after resize for BMP: Expected ${targetDimensions.width}x${targetDimensions.height}, Got ${info.width}x${info.height}`);
         }

        const binaryPixels = Uint8Array.from(rawData, val => val > 128 ? 1 : 0);

        const dpi = 203;
        const pixelsPerMeter = Math.round(dpi * (1 / 0.0254));

        const bmpEncodeOptions = {
          width: info.width,
          height: info.height,
          data: binaryPixels,
          bitsPerPixel: 1,
          xPixelsPerMeter: pixelsPerMeter,
          yPixelsPerMeter: pixelsPerMeter
        };

        const bmpUint8Array = fastBmp.encode(bmpEncodeOptions);
        const finalBuffer = Buffer.from(bmpUint8Array);

        context.log(`BMP encoding finished for ${formatKey}. Output size: ${finalBuffer.length} bytes`);
        return { buffer: finalBuffer, contentType: outputContentType, finalInfo };

    } else {
        context.log(`Applying PNG processing chain for ${formatKey}`);

        sharpInstance = sharpInstance.resize(targetDimensions.width, targetDimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
        });

        const { data: finalBuffer, info } = await sharpInstance
            .png({ compressionLevel: 9 })
            .toBuffer({ resolveWithObject: true });

        finalInfo = info;
        return { buffer: finalBuffer, contentType: outputContentType, finalInfo };
    }
}


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
        case 'logo@2x.png': return { width: 300, height: 300 };
        case 'logo@3x.png': return { width: 300, height: 300 };
        case 'appicon-60.png': return { width: 60, height: 60 };
        case 'appicon-60@2x.png': return { width: 120, height: 120 };
        case 'appicon-60@3x.png': return { width: 180, height: 180 };
        case 'appicon.png': return { width: 57, height: 57 };
        case 'appicon-512.png': return { width: 512, height: 512 };
        case 'appicon@2x.png': return { width: 114, height: 114 };
        case 'default_app_logo.png': return { width: 512, height: 512 };
        case 'DefaultIcon.png': return { width: 1024, height: 1024 };
        case 'default-large.png': return { width: 640, height: 1136 };
        case 'Default-568h@2x.png': return { width: 640, height: 1136 };
        case 'Default-677h@2x.png': return { width: 750, height: 1334 };
        case 'Default-736h@3x.png': return { width: 1242, height: 2208 };
        case 'Default-Portrait-1792h@2x.png': return { width: 828, height: 1792 };
        case 'Default-Portrait-2436h@3x.png': return { width: 1125, height: 2436 };
        case 'Default-Portrait-2688h@3x.png': return { width: 1242, height: 2688 };
        case 'Default.png': return { width: 640, height: 980 };
        case 'Default@2x.png': return { width: 1242, height: 1902 };
        case 'CarryoutBtn.png': return { width: 300, height: 300 };
        case 'DeliveryBtn.png': return { width: 300, height: 300 };
        case 'FutureBtn.png': return { width: 300, height: 300 };
        case 'NowBtn.png': return { width: 300, height: 300 };
        default: return { width: 300, height: 300 };
    }
}
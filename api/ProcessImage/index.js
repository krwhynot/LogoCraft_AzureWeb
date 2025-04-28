const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const sharp = require('sharp');
const fetch = require('node-fetch');
// No fast-bmp require needed

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
                const targetDimensions = getFormatDimensions(formatKey);
                context.log(`Processing format: ${formatKey} (Target: ${targetDimensions.width}x${targetDimensions.height})`);

                let processedBuffer;
                let contentType;
                let finalInfo;

                if (formatKey.endsWith('.bmp')) {
                    // Use the manual BMP creation function
                    processedBuffer = await createMonochromeBmp(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                    contentType = 'image/bmp';
                    // Manual BMP doesn't easily return sharp 'info', use target dimensions
                    finalInfo = { width: targetDimensions.width, height: targetDimensions.height };
                } else {
                    // Use sharp for PNGs
                    const pngResult = await createPng(imageBuffer, targetDimensions.width, targetDimensions.height, context);
                    processedBuffer = pngResult.buffer;
                    contentType = pngResult.contentType;
                    finalInfo = pngResult.finalInfo;
                }

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


// --- Manual 1-bit BMP Creation Helper ---
async function createMonochromeBmp(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Starting manual 1-bit BMP creation for ${targetWidth}x${targetHeight}`);

    // Step 1: Process with Sharp (resize, flatten, grayscale, threshold, get raw)
    let sharpInstance = sharp(inputBuffer)
        .flatten({ background: 'white' }) // Ensure opaque before processing
        .resize(targetWidth, targetHeight, {
            fit: 'contain', // Fit within target, padding with white
            background: 'white'
        })
        .grayscale() // Convert to single channel
        .threshold(128); // Binarize (0 or 255)

    const { data: rawData, info } = await sharpInstance
        .raw() // Get raw pixel data (should be 1 channel, 8-bit)
        .toBuffer({ resolveWithObject: true });

    // Double-check dimensions match target after resize contain
    if (info.width !== targetWidth || info.height !== targetHeight) {
        context.log.warn(`Dimension mismatch after sharp processing: Expected ${targetWidth}x${targetHeight}, Got ${info.width}x${info.height}. BMP header will use target dimensions.`);
        // If this happens often, might need composite step instead of relying on resize alone
    }
    if (info.channels !== 1) {
        context.log.warn(`Expected 1 channel after grayscale/threshold, but got ${info.channels}.`)
    }
    context.log(`Raw data ready: ${info.width}x${info.height}, channels: ${info.channels}`);

    // Step 2: Prepare BMP Structure Calculation
    const bitsPerPixel = 1;
    const bytesPerPixel = info.channels; // Data from sharp is 1 byte per pixel (0 or 255)
    const rowSizeUnpadded = Math.ceil((targetWidth * bitsPerPixel) / 8);
    const rowSizePadded = Math.ceil(rowSizeUnpadded / 4) * 4; // Rows padded to 4-byte boundary
    const pixelDataSize = rowSizePadded * targetHeight;
    const paletteSize = 8; // 2 colors * 4 bytes/color (BGRA)
    const fileHeaderSize = 14;
    const infoHeaderSize = 40; // BITMAPINFOHEADER
    const pixelDataOffset = fileHeaderSize + infoHeaderSize + paletteSize;
    const fileSize = pixelDataOffset + pixelDataSize;

    // Step 3: Create Buffer and Write Headers/Palette
    const bmpBuffer = Buffer.alloc(fileSize);

    // File Header
    bmpBuffer.write('BM', 0); // Signature
    bmpBuffer.writeUInt32LE(fileSize, 2);
    bmpBuffer.writeUInt32LE(0, 6); // Reserved
    bmpBuffer.writeUInt32LE(pixelDataOffset, 10);

    // Info Header (BITMAPINFOHEADER)
    bmpBuffer.writeUInt32LE(infoHeaderSize, 14);
    bmpBuffer.writeInt32LE(targetWidth, 18);
    bmpBuffer.writeInt32LE(targetHeight, 22); // Positive for bottom-up rows
    bmpBuffer.writeUInt16LE(1, 26); // Planes
    bmpBuffer.writeUInt16LE(bitsPerPixel, 28); // 1 bpp
    bmpBuffer.writeUInt32LE(0, 30); // Compression (BI_RGB)
    bmpBuffer.writeUInt32LE(pixelDataSize, 34);
    const dpi = 203;
    const pixelsPerMeter = Math.round(dpi / 0.0254);
    bmpBuffer.writeInt32LE(pixelsPerMeter, 38); // X Pixels/Meter
    bmpBuffer.writeInt32LE(pixelsPerMeter, 42); // Y Pixels/Meter
    bmpBuffer.writeUInt32LE(2, 46); // Colors used (2 for 1-bit)
    bmpBuffer.writeUInt32LE(0, 50); // Important colors (0 = all)

    // Color Palette (BGRA order)
    // Color 0: Black (index 0 in pixel data)
    bmpBuffer.writeUInt32LE(0x00000000, fileHeaderSize + infoHeaderSize); // B=0, G=0, R=0, A=0
    // Color 1: White (index 1 in pixel data)
    bmpBuffer.writeUInt32LE(0x00FFFFFF, fileHeaderSize + infoHeaderSize + 4); // B=255, G=255, R=255, A=0

    context.log(`BMP headers written. Pixel data offset: ${pixelDataOffset}, Pixel data size: ${pixelDataSize}`);

    // Step 4: Pack Pixel Data (Bottom-up)
    let bmpBufferWriteIndex = pixelDataOffset;
    for (let y = targetHeight - 1; y >= 0; y--) { // Iterate rows bottom-up for BMP buffer
        let currentByte = 0;
        let bitPosition = 0;
        let bytesWrittenInRow = 0;

        for (let x = 0; x < targetWidth; x++) {
            // Read from rawData (which is top-down)
            const rawDataIndex = y * targetWidth + x; // Index in the 1-channel raw buffer
            const pixelValue = rawData[rawDataIndex]; // 0 or 255
            const bit = pixelValue < 128 ? 0 : 1; // Map: Black=0, White=1

            // Pack bits into byte (MSB first)
            currentByte |= (bit << (7 - bitPosition));
            bitPosition++;

            if (bitPosition === 8) {
                bmpBuffer[bmpBufferWriteIndex++] = currentByte;
                currentByte = 0;
                bitPosition = 0;
                bytesWrittenInRow++;
            }
        }
        // Write partial byte at end of row
        if (bitPosition > 0) {
            bmpBuffer[bmpBufferWriteIndex++] = currentByte;
            bytesWrittenInRow++;
        }
        // Add padding
        while (bytesWrittenInRow < rowSizePadded) {
            bmpBuffer[bmpBufferWriteIndex++] = 0x00;
            bytesWrittenInRow++;
        }
    }
    context.log(`BMP pixel data packed. Bytes written check: ${bmpBufferWriteIndex}`);
    if (bmpBufferWriteIndex !== fileSize) {
        context.log.warn(`Potential BMP buffer size mismatch: Written ${bmpBufferWriteIndex}, Expected ${fileSize}`);
    }

    return bmpBuffer;
}


// --- Standard PNG Creation Helper ---
async function createPng(inputBuffer, targetWidth, targetHeight, context) {
    context.log(`Applying PNG processing chain for ${targetWidth}x${targetHeight}`);
    let sharpInstance = sharp(inputBuffer);

    // Resize PNGs using fit: 'inside' to preserve aspect ratio without padding
    sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
    });

    // Get final buffer and info
    const { data: finalBuffer, info } = await sharpInstance
        .png({ compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });

    return { buffer: finalBuffer, contentType: 'image/png', finalInfo: info };
}


// --- getFormatDimensions Helper Function ---
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
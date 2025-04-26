const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const sharp = require('sharp');
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    try {
        // Check if the request contains required fields
        if (!req.body || !req.body.sourceUrl || !req.body.formats) {
            context.res = {
                status: 400,
                body: { error: 'Source URL and formats are required' }
            };
            return;
        }
        
        // Extract source URL and formats
        const { sourceUrl, formats } = req.body;
        
        // Storage account details
        const accountName = 'logocraftstorage'; // Replace with your actual storage account name
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;
        const outputContainer = 'output-images';
        
        // Log the received data
        context.log('Processing image request', { sourceUrl, formatCount: Object.keys(formats).length });
        
        // Create shared key credentials
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        
        // Create Blob service client
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
        
        // Get container client for output images
        const containerClient = blobServiceClient.getContainerClient(outputContainer);
        
        // Download the source image
        context.log('Downloading source image:', sourceUrl);
        const response = await fetch(sourceUrl);
        if (!response.ok) {
            throw new Error(`Failed to download source image: ${response.statusText}`);
        }
        const imageBuffer = await response.buffer();
        context.log('Source image downloaded successfully');
        
        // Process the image for each format
        const processedImages = [];
        
        for (const formatKey of Object.keys(formats)) {
            if (formats[formatKey]) {
                // Get format dimensions
                const dimensions = getFormatDimensions(formatKey);
                context.log(`Processing format: ${formatKey} (${dimensions.width}x${dimensions.height})`);
                
                // Process image with Sharp
                const processedBuffer = await processImage(imageBuffer, dimensions, formatKey);
                
                // Upload processed image to blob storage
                const blobName = `${Date.now()}_${formatKey}`;
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                
                context.log(`Uploading processed image: ${blobName}`);
                await blockBlobClient.uploadData(processedBuffer, {
                    blobHTTPHeaders: {
                        blobContentType: formatKey.endsWith('.bmp') ? 'image/bmp' : 'image/png'
                    }
                });
                
                // Add to processed images
                processedImages.push({
                    name: formatKey,
                    url: blockBlobClient.url,
                    size: `${dimensions.width}×${dimensions.height}`,
                    dimensions
                });
                
                context.log(`Processed and uploaded: ${formatKey}`);
            }
        }
        
        // Return processed images
        context.res = {
            status: 200,
            body: { processedImages }
        };
        
        context.log('Processing completed successfully', { processedCount: processedImages.length });
    } catch (error) {
        context.log.error('Error processing image:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to process image' }
        };
    }
};

// Helper function to get dimensions for format
function getFormatDimensions(format) {
    switch(format) {
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

// Process image with Sharp
async function processImage(buffer, dimensions, formatKey) {
    let sharpInstance = sharp(buffer);
    
    // Resize to dimensions with white background and maintain aspect ratio
    sharpInstance = sharpInstance.resize({
        width: dimensions.width,
        height: dimensions.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
    });
    
    // Convert to appropriate format
    if (formatKey.endsWith('.bmp')) {
        return sharpInstance.toFormat('bmp').toBuffer();
    } else {
        return sharpInstance.toFormat('png').toBuffer();
    }
}
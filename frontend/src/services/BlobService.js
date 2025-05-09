// frontend/src/services/BlobService.js
import axios from 'axios';

/**
 * Get SAS URL for uploading a specific file
 * @param {string} filename
 * @param {string} containerName - Container name (default: 'input-images')
 * @param {string} accessType - 'read' or 'write' (default: 'write')
 * @returns {Promise<string>} Signed URL to upload blob
 */
const getSasUrl = async (filename, containerName = 'input-images', accessType = 'write') => {
  try {
    // Use local API proxy instead of calling Function App directly
    const response = await fetch(`/api/GetSasToken?container=${encodeURIComponent(containerName)}&filename=${encodeURIComponent(filename)}&accessType=${accessType}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SAS token fetch failed:', errorText);
      throw new Error(`Failed to get SAS token: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`SAS token for ${accessType} access retrieved successfully`);
    return data.blobUrlWithSas;
  } catch (error) {
    console.error('Error getting SAS URL:', error);
    throw error;
  }
};

/**
 * Upload file to Azure Blob Storage using SAS URL
 * @param {File} file - File object
 * @param {string} filename - Name for the blob
 * @returns {Promise<string>} - URL to uploaded blob
 */
export const uploadFileToBlob = async (file, filename) => {
  try {
    console.log(`Starting upload for file: ${filename}`);
    const sasUrl = await getSasUrl(filename, 'input-images', 'write');

    // Upload the file
    await axios.put(sasUrl, file, {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    console.log('File uploaded successfully');
    
    // Return the blob URL without the SAS token
    const blobUrl = sasUrl.split('?')[0];
    return blobUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Trigger backend image processing
 * @param {string} sourceUrl - URL of the uploaded blob
 * @param {object} formats - Object with format names as keys and boolean values
 * @returns {Promise<object>}
 */
export const processImage = async (sourceUrl, formats) => {
  try {
    console.log('Processing image with formats:', Object.keys(formats).filter(key => formats[key]));
    
    // Use local API proxy instead of calling Function App directly
    const response = await fetch('/api/ProcessImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl, formats }) 
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Processing failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Processing completed successfully');
    
    // Add SAS tokens to URLs if needed
    if (result.processedImages && result.processedImages.length > 0) {
      // Get SAS tokens for each processed image
      const processedImagesWithSas = await Promise.all(
        result.processedImages.map(async (image) => {
          try {
            // If url doesn't have SAS token, add one
            if (!image.url.includes('?')) {
              const imgUrlObj = new URL(image.url);
              const pathParts = imgUrlObj.pathname.split('/');
              const blobName = pathParts[pathParts.length - 1];
              const containerName = pathParts[pathParts.length - 2];
              
              const sasUrl = await getSasUrl(blobName, containerName, 'read');
              return {
                ...image,
                url: sasUrl
              };
            }
            return image;
          } catch (error) {
            console.error(`Error getting SAS token for image ${image.name}:`, error);
            return image; // Return original image if failed to get SAS
          }
        })
      );
      result.processedImages = processedImagesWithSas;
    }
    
    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

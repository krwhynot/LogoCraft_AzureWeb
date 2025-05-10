// frontend/src/services/BlobService.js
import axios from 'axios';

const API_BASE_URL = '/api/ProcessImage'; // Consolidated function endpoint

/**
 * Upload file to Azure Blob Storage.
 * This function first gets an upload SAS URL from our backend,
 * then uploads the file directly to Azure Blob Storage.
 * @param {File} file - File object to upload.
 * @param {string} desiredFilename - The desired filename for the blob.
 * @returns {Promise<string>} - The blobName of the uploaded file in the 'uploads' container.
 */
export const uploadFileToBlob = async (file, desiredFilename) => {
  try {
    console.log(`Requesting SAS URL for file: ${desiredFilename}`);
    // Request SAS URL from our consolidated function
    const sasResponse = await fetch(`${API_BASE_URL}?action=getUploadSas&filename=${encodeURIComponent(desiredFilename)}`);
    
    if (!sasResponse.ok) {
      const errorText = await sasResponse.text();
      console.error('Failed to get SAS URL:', errorText);
      throw new Error(`Failed to get SAS URL: ${errorText}`);
    }
    
    const { uploadUrl, blobName } = await sasResponse.json();
    console.log(`SAS URL retrieved. Uploading ${desiredFilename} as ${blobName} to: ${uploadUrl.split('?')[0]}`);

    // Upload the file to the SAS URL
    await axios.put(uploadUrl, file, {
      headers: {
        'x-ms-blob-type': 'BlockBlob', // Required for block blobs
        'Content-Type': file.type
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress for ${blobName}: ${percentCompleted}%`);
        } else {
            console.log(`Upload progress for ${blobName}: ${progressEvent.loaded} bytes`);
        }
      }
    });

    console.log(`File ${blobName} uploaded successfully to uploads container.`);
    return blobName; // Return the actual blob name used (which was confirmed by the SAS generation)
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Trigger backend image processing.
 * @param {string} sourceBlobName - Name of the uploaded blob in the 'uploads' container.
 * @param {object} formats - Object with format names as keys and boolean values (true if selected).
 * @returns {Promise<object>} - Object containing an array of processed image metadata (name, public URL, dimensions).
 */
export const processImage = async (sourceBlobName, formats) => {
  try {
    console.log(`Requesting processing for blob: ${sourceBlobName} with formats:`, Object.keys(formats).filter(key => formats[key]));
    
    const response = await fetch(`${API_BASE_URL}?action=processImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceBlobName, formats }) 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image processing request failed:', errorText);
      throw new Error(`Processing failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Processing completed successfully by backend.');
    
    // The backend should now return direct public URLs for images in the 'downloads' container
    // No need to fetch SAS tokens for processed images here.
    if (result.processedImages) {
        result.processedImages.forEach(img => {
            console.log(`Processed image: ${img.name}, URL: ${img.url}`);
        });
    }
    
    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Fetches the content of a processed image from its public URL.
 * @param {string} imageUrl - The public URL of the image to fetch.
 * @returns {Promise<Blob>} The image data as a Blob.
 */
export const getProcessedImage = async (imageUrl) => {
  try {
    console.log(`Fetching processed image from: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: 'blob' // Important to get the raw blob data
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching processed image from ${imageUrl}:`, error);
    throw error;
  }
};

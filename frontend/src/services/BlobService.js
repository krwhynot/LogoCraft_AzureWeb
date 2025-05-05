import axios from 'axios';

/**
 * Get SAS URL for uploading a specific file
 * @param {string} filename
 * @returns {Promise<string>} Signed URL to upload blob
 */
const getSasUrl = async (filename) => {
  try {
    const response = await fetch(`/api/GetSasToken?container=input-images&filename=${encodeURIComponent(filename)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SAS token fetch failed:', errorText);
      throw new Error(`Failed to get SAS token: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('SAS token retrieved successfully');
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
    const sasUrl = await getSasUrl(filename);

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
 * Fetch processed image blob from URL
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export const getProcessedImage = async (url) => {
  try {
    console.log(`Fetching processed image from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    console.log('Image fetched successfully');
    return await response.blob();
  } catch (error) {
    console.error('Error fetching processed image:', error);
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
    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
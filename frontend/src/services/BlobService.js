// frontend/src/services/BlobService.js
const BASE_URL = '/api'; // This will be replaced with the actual API URL in production

export const getBlobSasToken = async () => {
  try {
    const response = await fetch(`${BASE_URL}/GetSasToken`);
    if (!response.ok) {
      throw new Error(`Failed to get SAS token: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting SAS token:', error);
    throw error;
  }
};

export const uploadFileToBlob = async (file, filename) => {
  try {
    const { sasToken, containerUrl } = await getBlobSasToken();
    const blobUrl = `${containerUrl}/${filename}${sasToken}`;
    
    const response = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type
      },
      body: file
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload blob: ${response.statusText}`);
    }
    
    return blobUrl.split('?')[0]; // Return the URL without SAS token
  } catch (error) {
    console.error('Error uploading file to blob storage:', error);
    throw error;
  }
};

export const processImage = async (blobUrl, formatOptions) => {
  try {
    const response = await fetch(`${BASE_URL}/ProcessImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceUrl: blobUrl,
        formats: formatOptions
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process image: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

export const getProcessedImage = async (blobUrl) => {
  try {
    const { sasToken } = await getBlobSasToken();
    const downloadUrl = `${blobUrl}${sasToken}`;
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading processed image:', error);
    throw error;
  }
};
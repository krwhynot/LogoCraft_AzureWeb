import axios from 'axios';

/**
 * Get SAS URL for uploading a specific file
 * @param {string} filename
 * @returns {Promise<string>} Signed URL to upload blob
 */
const getSasUrl = async (filename) => {
  const response = await fetch(`/api/GetSasToken?container=input-images&filename=${encodeURIComponent(filename)}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get SAS token for input-images: ${text}`);
  }
  const data = await response.json();
  return data.blobUrlWithSas;
};

/**
 * Upload file to Azure Blob Storage using SAS URL
 * @param {File} file - File object
 * @param {string} filename - Name for the blob
 * @returns {Promise<string>} - URL to uploaded blob
 */
export const uploadFileToBlob = async (file, filename) => {
  const sasUrl = await getSasUrl(filename);

  await axios.put(sasUrl, file, {
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type
    }
  });

  // Return the blob URL without the SAS token if needed
  const [blobUrl] = sasUrl.split('?');
  return blobUrl;
};

/**
 * Fetch processed image blob from URL
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export const getProcessedImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  return await response.blob();
};

/**
 * Trigger backend image processing
 * @param {string} blobUrl
 * @param {object} formats
 * @returns {Promise<object>}
 */
export const processImage = async (blobUrl, formats) => {
  const response = await fetch('/api/ProcessImage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobUrl, formats })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Processing failed: ${text}`);
  }

  return await response.json();
};

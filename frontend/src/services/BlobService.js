// frontend/src/services/BlobService.js

let BASE_URL;

// Check Vite's built-in flag for production mode
if (import.meta.env.PROD) {
  BASE_URL = 'https://logocraftfunctions.azurewebsites.net/api';
} else {
  BASE_URL = 'http://localhost:7071/api';
}

// MODIFIED: Accept an optional containerName parameter
export const getBlobSasToken = async (containerName = 'input-images') => { // Default to input-images
  try {
    // Append container name to the query string if provided
    const url = `${BASE_URL}/GetSasToken?container=${encodeURIComponent(containerName)}`;
    const response = await fetch(url); // Pass the container name
    if (!response.ok) {
      // Try to get more details from the response body if possible
      let errorDetails = response.statusText;
      try {
          const errorBody = await response.json();
          errorDetails = errorBody.details || errorBody.error || errorDetails;
      } catch (e) {/* Ignore if body isn't json */}
      throw new Error(`Failed to get SAS token for ${containerName}: ${errorDetails}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error getting SAS token for ${containerName}:`, error);
    throw error;
  }
};

export const uploadFileToBlob = async (file, filename) => {
  try {
    // Get a SAS token for uploading (defaults to input-images)
    const { sasToken, containerUrl } = await getBlobSasToken(); // No container specified, uses default 'input-images'
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
       // Try to get more details from the response body if possible
       let errorDetails = response.statusText;
       try {
           const errorBody = await response.text(); // Get text response
           errorDetails = errorBody || errorDetails;
       } catch (e) {/* Ignore */}
      throw new Error(`Failed to upload blob: ${errorDetails}`);
    }

    return blobUrl.split('?')[0];
  } catch (error) {
    console.error('Error uploading file to blob storage:', error);
    throw error;
  }
};

export const processImage = async (blobUrl, formatOptions) => {
  try {
    const response = await fetch(`${BASE_URL}/ProcessImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: blobUrl, formats: formatOptions })
    });

    if (!response.ok) {
       // Try to get more details from the response body if possible
       let errorDetails = response.statusText;
       try {
           const errorBody = await response.json();
           errorDetails = errorBody.details || errorBody.error || errorDetails;
       } catch (e) {/* Ignore if body isn't json */}
      throw new Error(`Failed to process image: ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// MODIFIED: Pass 'output-images' when getting token for download
export const getProcessedImage = async (blobUrl) => {
  try {
    // Get a SAS token specifically for the output container
    const outputContainerName = 'output-images'; // Define the correct container
    const { sasToken } = await getBlobSasToken(outputContainerName); // Pass the container name
    const downloadUrl = `${blobUrl}${sasToken}`; // Append the correct token

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      // Try to get more details from the response body if possible
       let errorDetails = response.statusText;
       try {
           // Blob storage errors are often XML or text
           const errorBody = await response.text(); 
           // A common authentication error text check:
           if (errorBody.includes('AuthenticationFailed')) {
               errorDetails = 'Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.';
           } else {
               errorDetails = errorBody || errorDetails;
           }
       } catch (e) {/* Ignore */}
      throw new Error(`Failed to download image: ${errorDetails}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading processed image:', error);
    throw error; // Re-throw the potentially more detailed error
  }
};
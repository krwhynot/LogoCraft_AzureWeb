// LogoCraftWeb/frontend/src/App.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import ImagePreview from './components/ImagePreview';
import OutputOptions from './components/OutputOptions';
import ProcessingOptions from './components/ProcessingOptions';
// FormatInfo removed
import StatusBar from './components/StatusBar';
import MainPreview from './components/MainPreview';
import StepIndicator from './components/StepIndicator';

import { uploadFileToBlob, processImage, getProcessedImage } from './services/BlobService';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const FORMAT_DIMENSIONS = {
  'Logo.png': { width: 300, height: 300 },
  'Smalllogo.png': { width: 136, height: 136 },
  'KDlogo.png': { width: 140, height: 112 },
  'RPTlogo.bmp': { width: 155, height: 110 },
  'PRINTLOGO.bmp': { width: 600, height: 256 },
  'Feature Graphic.png': { width: 1024, height: 500 },
  'hpns.png': { width: 96, height: 96 },
  'loginLogo.png': { width: 600, height: 600 },
  // 'logo.png' is duplicated, assuming the first one is intended or needs review
  // 'logo.png': { width: 300, height: 300 }, 
  'logo@2x.png': { width: 300, height: 300 }, // Assuming this is for higher DPI, base size is 300x300
  'logo@3x.png': { width: 300, height: 300 }, // Assuming this is for higher DPI, base size is 300x300
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

const getFormatDimensions = (format) => {
  return FORMAT_DIMENSIONS[format] || { width: 300, height: 300 }; // Default if not found
};

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState({
    'Logo.png': false,
    'Smalllogo.png': false,
    'KDlogo.png': false,
    'RPTlogo.bmp': false,
    'PRINTLOGO.bmp': false,
    'Feature Graphic.png': false,
    'hpns.png': false,
    'loginLogo.png': false,
    'logo.png': false,
    'logo@2x.png': false,
    'logo@3x.png': false,
    'appicon-60.png': false,
    'appicon-60@2x.png': false,
    'appicon-60@3x.png': false,
    'appicon.png': false,
    'appicon-512.png': false,
    'appicon@2x.png': false,
    'default_app_logo.png': false,
    'DefaultIcon.png': false,
    'default-large.png': false,
    'Default-568h@2x.png': false,
    'Default-677h@2x.png': false,
    'Default-736h@3x.png': false,
    'Default-Portrait-1792h@2x.png': false,
    'Default-Portrait-2436h@3x.png': false,
    'Default-Portrait-2688h@3x.png': false,
    'Default.png': false,
    'Default@2x.png': false,
    'CarryoutBtn.png': false,
    'DeliveryBtn.png': false,
    'FutureBtn.png': false,
    'NowBtn.png': false
  });
  const [outputDir, setOutputDir] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to start. Select an image to begin.');
  const [error, setError] = useState(null);
  const [processedImages, setProcessedImages] = useState([]);
  const [activeResult, setActiveResult] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  const handleReset = () => {
    setCurrentFile(null); setPreview(null); setImageSize(null); setOutputDir('');
    setProcessedImages([]); setActiveResult(null); setStatusMessage('Ready to start. Select an image to begin.');
    setActiveStep(1); setError(null); setIsProcessing(false); setProgress(0);
    // Optionally reset format selections too if desired:
    // const initialFormats = { /* ... define initial state again ... */ };
    // setSelectedFormats(initialFormats);
  };

  const loadImagePreview = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      const img = new Image();
      img.onload = () => { setImageSize({ width: img.width, height: img.height }); };
      img.src = reader.result;
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (file) => {
    handleReset(); // Reset state when a new file is selected
    setCurrentFile(file);
    loadImagePreview(file);
    if (file) {
      setStatusMessage(`Image loaded: ${file.name}`);
      setActiveStep(2);
    }
  };

  const handleRemoveImage = () => { handleReset(); };

  const hasSelectedFormats = Object.values(selectedFormats).some(value => value === true);

  const _uploadImage = async (file, filename) => {
    setStatusMessage('Uploading image...');
    setProgress(5); // Start progress
    try {
      const blobUrl = await uploadFileToBlob(file, filename);
      console.log("Blob URL after upload:", blobUrl);
      setProgress(10);
      setStatusMessage('Image uploaded, starting processing...');
      return blobUrl;
    } catch (uploadError) {
      console.error('Error during image upload:', uploadError);
      setError(`Image upload failed: ${uploadError.message}`);
      setStatusMessage(`Error: Image upload failed - ${uploadError.message}`);
      throw uploadError; // Re-throw to be caught by handleProcessAndDownload
    }
  };

  const _processTheImage = async (sourceUrl, formatsToProcess) => {
    setStatusMessage('Processing image...');
    setProgress(15);
    try {
      console.log("Calling processImage with:", { sourceUrl, formats: formatsToProcess });
      const result = await processImage(sourceUrl, formatsToProcess);
      setProgress(50);
      setStatusMessage('Processing finished, preparing results...');
      return result;
    } catch (processingError) {
      console.error('Error during image processing:', processingError);
      setError(`Image processing failed: ${processingError.message}`);
      setStatusMessage(`Error: Image processing failed - ${processingError.message}`);
      throw processingError; // Re-throw
    }
  };

  const _downloadImages = async (imagesToDownload) => {
    if (!imagesToDownload || imagesToDownload.length === 0) {
      setStatusMessage("Processing complete, but no images were generated.");
      setError("No images were generated based on selected formats.");
      setActiveStep(2); // Go back to configuration if nothing to download
      return false;
    }

    setStatusMessage("Preparing zip file...");
    setProgress(60);
    const zip = new JSZip();
    let fetchedCount = 0;

    try {
      for (const image of imagesToDownload) {
        fetchedCount++;
        setStatusMessage(`Fetching ${image.name} (${fetchedCount}/${imagesToDownload.length})...`);
        const blobData = await getProcessedImage(image.url);
        zip.file(image.name, blobData, { binary: true });
        setProgress(60 + (30 * fetchedCount / imagesToDownload.length));
      }

      setStatusMessage("Generating zip file...");
      setProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE", compressionOptions: { level: 6 } });
      setStatusMessage("Starting download...");
      saveAs(zipBlob, 'logocraft_exports.zip');
      setStatusMessage("Process complete, download initiated.");
      return true;
    } catch (downloadError) {
      console.error('Error during zipping/download:', downloadError);
      setError(`Download preparation failed: ${downloadError.message}`);
      setStatusMessage(`Error: Download preparation failed - ${downloadError.message}`);
      throw downloadError; // Re-throw
    }
  };


  const handleProcessAndDownload = async () => {
    if (!currentFile) {
      setError('Please select an image first');
      setStatusMessage('Please select an image first');
      return;
    }
  
    const formatKeys = Object.keys(selectedFormats).filter(key => selectedFormats[key]);
    if (formatKeys.length === 0) {
      setError('Please select at least one output format');
      setStatusMessage('Please select at least one output format');
      return;
    }
  
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Starting process...');
    setError(null);
    setProcessedImages([]);
    setActiveResult(null);
    // let didDownloadStart = false; // No longer needed as _downloadImages returns status

    try {
      const timestamp = new Date().getTime();
      const filename = `${timestamp}_${currentFile.name}`;
  
      const blobUrl = await _uploadImage(currentFile, filename);
  
      const formatsToProcess = {};
      formatKeys.forEach(key => {
        formatsToProcess[key] = true;
      });
  
      const result = await _processTheImage(blobUrl, formatsToProcess);
      
      const downloadedImages = result.processedImages || [];
      setProcessedImages(downloadedImages); // Set processed images for potential gallery display
      setActiveStep(3); // Move to download step
  
      await _downloadImages(downloadedImages);
      // didDownloadStart = await _downloadImages(downloadedImages); // if you need to track success
  
    } catch (err) {
      // Errors are now set by helper functions, but we can add a general fallback
      console.error('Overall processing error in handleProcessAndDownload:', err);
      if (!error) { // If a specific error wasn't already set
        const errorMsg = err.message || 'An unexpected error occurred during the process';
        setError(`Operation failed: ${errorMsg}`);
        setStatusMessage(`Error: ${errorMsg}`);
      }
      setActiveStep(2); // Revert to configuration step on error
    } finally {
      setIsProcessing(false);
      setProgress(100);
      handleReset(); // Call reset directly
    }
  };

  return (
    <Container fluid className="app-container centered-container py-4 py-lg-5">
      <div className="logo-header">
        <h1 className="app-title">LogoCraft Web</h1>
        <p className="app-subtitle text-center text-muted">Convert your logos to multiple formats with just a few clicks</p>
      </div>
      <StepIndicator
        activeStep={activeStep}
        steps={[ { number: 1, title: "Upload" }, { number: 2, title: "Configure" }, { number: 3, title: "Download" } ]}
      />
      {error && ( <Alert variant="danger" onClose={() => setError(null)} dismissible className="mx-md-4 my-2"> {error} </Alert> )}

      <Row className="content-wrapper gx-md-4 gy-4">
        {/* Column 1: Upload */}
        <Col lg={4} md={5} className="mb-lg-0">
          <div className={`panel shadow-sm h-100 ${activeStep === 1 ? 'panel-active' : ''}`}>
            <div className="panel-header">
              <h3 className="panel-title"> <Badge bg={activeStep === 1 ? "primary" : "secondary"} className="step-badge">1</Badge> Image Upload </h3>
            </div>
            <div className="panel-body p-4">
              <ImagePreview preview={preview} onFileSelect={handleFileSelect} onRemoveImage={handleRemoveImage} imageSize={imageSize} fileName={currentFile?.name} />
            </div>
          </div>
        </Col>

        {/* Column 2: Configure & Process */}
        <Col lg={8} md={7}>
           <Row className="gy-4">
              {/* Sub-Column 1: Export Options */}
              <Col lg={8}>
                 <div className={`panel shadow-sm h-100 ${activeStep === 2 ? 'panel-active' : ''}`}>
                  <div className="panel-header">
                    <h3 className="panel-title"> <Badge bg={activeStep === 2 ? "primary" : "secondary"} className="step-badge">2</Badge> Export Options </h3>
                  </div>
                  <div className="panel-body p-4">
                    <OutputOptions
                      selectedFormats={selectedFormats}
                      setSelectedFormats={setSelectedFormats}
                      disabled={!currentFile || isProcessing || activeStep === 3}
                    />
                  </div>
                </div>
              </Col>
              {/* Sub-Column 2: Processing */}
              <Col lg={4}>
                <div className={`panel shadow-sm h-100 ${activeStep === 2 || activeStep === 3 ? 'panel-active' : ''}`}>
                  <div className="panel-header">
                     <h3 className="panel-title"> <Badge bg={activeStep === 3 ? "success" : (activeStep === 2 ? "primary" : "secondary")} className="step-badge">3</Badge> Generate </h3>
                  </div>
                  <div className="panel-body p-4 d-flex flex-column justify-content-center"> {/* Center content vertically */}
                    <ProcessingOptions
                        outputDir={outputDir}
                        setOutputDir={setOutputDir}
                        onProcess={handleProcessAndDownload}
                        isProcessing={isProcessing}
                        progress={progress}
                        disabled={!currentFile || !hasSelectedFormats || isProcessing}
                    />
                     {activeStep === 3 && processedImages.length > 0 && !isProcessing && (
                       <Alert variant="success" className="mt-3 small p-2 text-center">
                         {processedImages.length} image(s) downloaded. Resetting...
                       </Alert>
                     )}
                     {activeStep === 3 && processedImages.length === 0 && !isProcessing && !error && (
                       <Alert variant="warning" className="mt-3 small p-2 text-center">
                          No images generated. Resetting...
                       </Alert>
                     )}
                     {activeStep === 2 && error && !isProcessing && (
                       <Alert variant="danger" className="mt-3 small p-2 text-center">
                          Error occurred. Resetting...
                       </Alert>
                     )}
                  </div>
                </div>
              </Col>
           </Row>
           {/* Results Gallery below Configure & Process */}
           {processedImages.length > 0 && activeStep === 3 && !isProcessing && (
              <Row className="mt-4">
                 <Col>
                    <div className="panel shadow-sm">
                       <div className="panel-header">
                          <h3 className="panel-title">Results Preview</h3>
                       </div>
                       <div className="panel-body p-4">
                          {/* You could potentially put a simplified results view or message here, */}
                          {/* or just rely on the status bar and the fact that reset is happening. */}
                          {/* Example: <p>Download complete. Resetting application...</p> */}
                       </div>
                    </div>
                 </Col>
              </Row>
           )}
        </Col>
      </Row>

      <StatusBar message={statusMessage} />

    </Container>
  );
}

export default App;

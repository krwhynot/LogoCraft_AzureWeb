// LogoCraftWeb/frontend/src/App.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import ImagePreview from './components/ImagePreview';
import OutputOptions from './components/OutputOptions';
import ProcessingOptions from './components/ProcessingOptions';
import StatusBar from './components/StatusBar';
import MainPreview from './components/MainPreview';
import StepIndicator from './components/StepIndicator';

import { uploadFileToBlob, processImage, getProcessedImage } from './services/BlobService';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

  // New partial reset function that preserves the uploaded image
  const handlePartialReset = () => {
    setProcessedImages([]);
    setActiveResult(null);
    setStatusMessage('Ready to process again. You can select different formats.');
    setActiveStep(2); // Keep at step 2 (configure) instead of going back to step 1
    setError(null);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleFileSelect = (file) => {
    handleReset(); // Reset state when a new file is selected
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      const img = new Image();
      img.onload = () => { setImageSize({ width: img.width, height: img.height }); };
      img.src = reader.result;
    };
    if (file) { reader.readAsDataURL(file); setStatusMessage(`Image loaded: ${file.name}`); setActiveStep(2); }
  };

  const handleRemoveImage = () => { handleReset(); };

  const hasSelectedFormats = Object.values(selectedFormats).some(value => value === true);

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
    let didDownloadStart = false;

    try {
      const timestamp = new Date().getTime();
      const filename = `${timestamp}_${currentFile.name}`;

      setStatusMessage('Uploading image...');
      const blobUrl = await uploadFileToBlob(currentFile, filename);

      console.log("Blob URL after upload:", blobUrl);
      setProgress(10);
      setStatusMessage('Image uploaded, starting processing...');

      const formatsToProcess = {};
      formatKeys.forEach(key => {
        formatsToProcess[key] = true;
      });

      console.log("Calling processImage with:", {
        sourceUrl: blobUrl,
        formats: formatsToProcess
      });

      // Update here: renamed `blobUrl` to `sourceUrl` for API
      const result = await processImage(blobUrl, formatsToProcess);
      setProgress(50);
      setStatusMessage('Processing finished, preparing results...');

      const downloadedImages = result.processedImages || [];
      setProcessedImages(downloadedImages);
      setActiveStep(3);

      if (downloadedImages.length > 0) {
        setStatusMessage("Preparing zip file...");
        setProgress(60);
        const zip = new JSZip();
        let fetchedCount = 0;

        for (const image of downloadedImages) {
          fetchedCount++;
          setStatusMessage(`Processing ${image.name} (${fetchedCount}/${downloadedImages.length})...`);
          const blobData = await getProcessedImage(image.url);
          zip.file(image.name, blobData, { binary: true });
          setProgress(60 + (30 * fetchedCount / downloadedImages.length));
        }

        setStatusMessage("Generating zip file...");
        setProgress(95);
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE", compressionOptions: { level: 6 } });
        setStatusMessage("Starting download...");

        // Determine filename based on outputDir
        let zipFileName = 'logocraft_exports.zip';
        if (outputDir && outputDir.trim() !== '') {
          // Sanitize the outputDir to create a valid filename
          // Replace spaces and special characters with underscores, ensure .zip extension
          zipFileName = outputDir.trim().replace(/[^a-zA-Z0-9_.-]/g, '_') + '.zip';
          // Ensure it ends with .zip, even if user included it
          if (!zipFileName.toLowerCase().endsWith('.zip')) {
            zipFileName = zipFileName.replace(/\.zip$/i, '') + '.zip';
          }
        }

        saveAs(zipBlob, zipFileName);
        setStatusMessage("Process complete, download initiated.");
        didDownloadStart = true;
      } else {
        setStatusMessage("Processing complete, but no images were generated.");
        setError("No images were generated based on selected formats.");
        setActiveStep(2);
      }

    } catch (err) {
      console.error('Processing or Zipping error:', err);
      const errorMsg = err.message || 'An error occurred during the process';
      setError(`Operation failed: ${errorMsg}`);
      setStatusMessage(`Error: ${errorMsg}`);
      setActiveStep(2);
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setTimeout(() => {
        handlePartialReset(); // Using partial reset instead of full reset
      }, 3000);
    }
  };


  // getFormatDimensions function remains the same...
  const getFormatDimensions = (format) => {
    switch(format) {
        case 'Logo.png': return { width: 300, height: 300 }; case 'Smalllogo.png': return { width: 136, height: 136 };
        case 'KDlogo.png': return { width: 140, height: 112 }; case 'RPTlogo.bmp': return { width: 155, height: 110 };
        case 'PRINTLOGO.bmp': return { width: 600, height: 256 }; case 'Feature Graphic.png': return { width: 1024, height: 500 };
        case 'hpns.png': return { width: 96, height: 96 }; case 'loginLogo.png': return { width: 600, height: 600 };
        case 'logo.png': return { width: 300, height: 300 }; case 'logo@2x.png': return { width: 300, height: 300 };
        case 'logo@3x.png': return { width: 300, height: 300 }; case 'appicon-60.png': return { width: 60, height: 60 };
        case 'appicon-60@2x.png': return { width: 120, height: 120 }; case 'appicon-60@3x.png': return { width: 180, height: 180 };
        case 'appicon.png': return { width: 57, height: 57 }; case 'appicon-512.png': return { width: 512, height: 512 };
        case 'appicon@2x.png': return { width: 114, height: 114 }; case 'default_app_logo.png': return { width: 512, height: 512 };
        case 'DefaultIcon.png': return { width: 1024, height: 1024 }; case 'default-large.png': return { width: 640, height: 1136 };
        case 'Default-568h@2x.png': return { width: 640, height: 1136 }; case 'Default-677h@2x.png': return { width: 750, height: 1334 };
        case 'Default-736h@3x.png': return { width: 1242, height: 2208 }; case 'Default-Portrait-1792h@2x.png': return { width: 828, height: 1792 };
        case 'Default-Portrait-2436h@3x.png': return { width: 1125, height: 2436 }; case 'Default-Portrait-2688h@3x.png': return { width: 1242, height: 2688 };
        case 'Default.png': return { width: 640, height: 980 }; case 'Default@2x.png': return { width: 1242, height: 1902 };
        case 'CarryoutBtn.png': return { width: 300, height: 300 }; case 'DeliveryBtn.png': return { width: 300, height: 300 };
        case 'FutureBtn.png': return { width: 300, height: 300 }; case 'NowBtn.png': return { width: 300, height: 300 };
        default: return { width: 300, height: 300 };
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
        </Col>
      </Row>

      <StatusBar message={statusMessage} />

    </Container>
  );
}

export default App;

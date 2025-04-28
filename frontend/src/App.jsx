import React, { useState } from 'react';
import { Container, Row, Col, Alert, Button, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import ImagePreview from './components/ImagePreview';
import OutputOptions from './components/OutputOptions';
import ProcessingOptions from './components/ProcessingOptions';
import FormatInfo from './components/FormatInfo';
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
    'Logo.png': true,
    'Smalllogo.png': true,
    'KDlogo.png': true,
    'RPTlogo.bmp': true,
    'PRINTLOGO.bmp': true,
    'Feature Graphic.png': true,
    'hpns.png': true,
    'loginLogo.png': true,
    'logo.png': true,
    'logo@2x.png': true,
    'logo@3x.png': true,
    'appicon-60.png': true,
    'appicon-60@2x.png': true,
    'appicon-60@3x.png': true,
    'appicon.png': true,
    'appicon-512.png': true,
    'appicon@2x.png': true,
    'default_app_logo.png': true,
    'DefaultIcon.png': true,
    'default-large.png': true,
    'Default-568h@2x.png': true,
    'Default-677h@2x.png': true,
    'Default-736h@3x.png': true,
    'Default-Portrait-1792h@2x.png': true,
    'Default-Portrait-2436h@3x.png': true,
    'Default-Portrait-2688h@3x.png': true,
    'Default.png': true,
    'Default@2x.png': true,
    'CarryoutBtn.png': true,
    'DeliveryBtn.png': true,
    'FutureBtn.png': true,
    'NowBtn.png': true
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
    setCurrentFile(null);
    setPreview(null);
    setImageSize(null);
    setOutputDir('');
    setProcessedImages([]);
    setActiveResult(null);
    setStatusMessage('Ready to start. Select an image to begin.');
    setActiveStep(1);
    setError(null);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleFileSelect = (file) => {
    handleReset(); // Reset fully before selecting new file
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = reader.result;
    };
    if (file) {
      reader.readAsDataURL(file);
      setStatusMessage(`Image loaded: ${file.name}`);
      setActiveStep(2);
    }
  };

  const handleRemoveImage = () => {
    handleReset(); // Use the main reset function
  };

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
      setProgress(10);
      setStatusMessage('Image uploaded, starting processing...');

      const formatsToProcess = {};
      formatKeys.forEach(key => { formatsToProcess[key] = true; });
      const result = await processImage(blobUrl, formatsToProcess);
      setProgress(50);
      setStatusMessage('Processing finished, preparing results...');

      const downloadedImages = result.processedImages || [];
      setProcessedImages(downloadedImages);
      if (downloadedImages.length > 0) {
        setActiveResult(downloadedImages[0]);
      }
      setActiveStep(3);

      if (downloadedImages.length > 0) {
          setStatusMessage("Preparing zip file...");
          setProgress(60);
          const zip = new JSZip();
          let fetchedCount = 0;
          for (const image of downloadedImages) {
            fetchedCount++;
            setStatusMessage(`Fetching ${image.name} (${fetchedCount}/${downloadedImages.length})...`);
            const blobData = await getProcessedImage(image.url);
            zip.file(image.name, blobData, { binary: true });
            setProgress(60 + (30 * fetchedCount / downloadedImages.length));
          }
          setStatusMessage("Generating zip file...");
          setProgress(95);
          const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE", compressionOptions: { level: 6 } });
          setStatusMessage("Starting download...");
          saveAs(zipBlob, 'logocraft_exports.zip');
          setStatusMessage("Process complete, download initiated. Resetting...");
          didDownloadStart = true;
      } else {
          setStatusMessage("Processing complete, but no images were generated.");
          setError("No images were generated based on selected formats.");
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
      // Reset the UI after a short delay if download started
      if (didDownloadStart) {
          setTimeout(() => {
              handleReset();
          }, 2000); // Reset after 2 seconds
      } else {
           // If no download happened (error or no images), potentially reset sooner or based on error state
           setTimeout(() => {
              if (!error) setStatusMessage('Ready for next conversion.');
           }, 3000);
      }
    }
  };

  const getFormatDimensions = (format) => {
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
  };

  return (
    <Container fluid className="app-container centered-container">
      <div className="logo-header">
        <h1 className="app-title">LogoCraft Web</h1>
        <p className="text-center text-muted">Convert your logos to multiple formats with just a few clicks</p>
      </div>
      <StepIndicator
        activeStep={activeStep}
        steps={[ { number: 1, title: "Upload" }, { number: 2, title: "Configure" }, { number: 3, title: "Results" } ]}
      />
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mx-4">
          {error}
        </Alert>
      )}
      <Row className="content-wrapper gx-4">
        <Col lg={4} md={5} className="upload-column mb-4">
          <div className={`panel h-100 ${activeStep !== 1 ? 'panel-inactive' : ''}`}>
            <div className="panel-header">
              <h3 className="panel-title">
                <Badge bg={activeStep === 1 ? "primary" : "secondary"} className="step-badge">1</Badge> Image Upload
              </h3>
            </div>
            <div className="panel-body d-flex flex-column">
              <ImagePreview
                preview={preview}
                onFileSelect={handleFileSelect}
                onRemoveImage={handleRemoveImage}
                imageSize={imageSize}
                fileName={currentFile?.name}
              />
            </div>
          </div>
        </Col>
        <Col lg={8} md={7} className="right-column">
          <Row className="mb-4">
            <Col md={7}>
              <div className={`panel h-100 ${activeStep !== 2 ? 'panel-inactive' : ''}`}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Badge bg={activeStep === 2 ? "primary" : "secondary"} className="step-badge">2</Badge> Export Options
                  </h3>
                </div>
                <div className="panel-body">
                  <OutputOptions
                    selectedFormats={selectedFormats}
                    setSelectedFormats={setSelectedFormats}
                    disabled={!currentFile || isProcessing || activeStep === 3}
                  />
                </div>
              </div>
            </Col>
            <Col md={5}>
              <div className={`panel h-100 ${activeStep !== 2 ? 'panel-inactive' : ''}`}>
                <div className="panel-header">
                  <h3 className="panel-title">Processing</h3>
                </div>
                <div className="panel-body">
                  <ProcessingOptions
                    outputDir={outputDir}
                    setOutputDir={setOutputDir}
                    onProcess={handleProcessAndDownload}
                    isProcessing={isProcessing}
                    progress={progress}
                    disabled={!currentFile || !hasSelectedFormats || isProcessing || activeStep === 3}
                  />
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
               <MainPreview
                 preview={preview}
                 processedImages={processedImages}
                 activeResult={activeResult}
                 setActiveResult={setActiveResult}
                 imageSize={imageSize}
                 isProcessing={isProcessing}
                 activeStep={activeStep}
               />
            </Col>
             <Col lg={3} className="info-column mb-3 d-none d-lg-block">
              <div className="panel h-100">
                <div className="panel-header">
                  <h3 className="panel-title">Supported Formats</h3>
                </div>
                <div className="panel-body">
                  <FormatInfo />
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
// frontend/src/App.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Alert, Button, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import ImagePreview from './components/ImagePreview';
import OutputOptions from './components/OutputOptions';
import ProcessingOptions from './components/ProcessingOptions';
import FormatInfo from './components/FormatInfo';
import StatusBar from './components/StatusBar';
import MainPreview from './components/MainPreview';
import StepIndicator from './components/StepIndicator';

// Import services
// Comment out unused services until we implement the backend functionality
// import { uploadFileToBlob, processImage, getProcessedImage } from './services/BlobService';

function App() {
  // State management
  const [currentFile, setCurrentFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState({
    'Logo.png': true,
    'Smalllogo.png': true,
    'KDlogo.png': true,
    'RPTlogo.bmp': true,
    'PRINTLOGO.bmp': true,
     
    // Online Images - Feature Graphic
    'Feature Graphic.png': true,
    
    // Online Images - Push
    'hpns.png': true,
    
    // Online Images - Logo
    'loginLogo.png': true,
    'logo.png': true,
    'logo@2x.png': true,
    'logo@3x.png': true,
    
    // Online Images - Appicon
    'appicon-60.png': true,
    'appicon-60@2x.png': true,
    'appicon-60@3x.png': true,
    'appicon.png': true,
    'appicon-512.png': true,
    'appicon@2x.png': true,
    'default_app_logo.png': true,
    'DefaultIcon.png': true,
    
    // Online Images - Default Large
    'default-large.png': true,
    'Default-568h@2x.png': true,
    'Default-677h@2x.png': true,
    'Default-736h@3x.png': true,
    
    // Online Images - Default XL
    'Default-Portrait-1792h@2x.png': true,
    'Default-Portrait-2436h@3x.png': true,
    'Default-Portrait-2688h@3x.png': true,
    
    // Online Images - Default
    'Default.png': true,
    'Default@2x.png': true,
    
    // Online Images - Miscellaneous
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

  // Function to handle file selection
  const handleFileSelect = (file) => {
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageSize({
          width: img.width,
          height: img.height
        });
      };
      img.src = reader.result;
    };
    
    if (file) {
      reader.readAsDataURL(file);
      setStatusMessage(`Image loaded: ${file.name}`);
      setProcessedImages([]);
      setActiveResult(null);
      setActiveStep(2); // Advance to next step after upload
    }
  };

  // Function to handle image removal
  const handleRemoveImage = () => {
    setCurrentFile(null);
    setPreview(null);
    setImageSize(null);
    setProcessedImages([]);
    setActiveResult(null);
    setStatusMessage('Image removed. Select an image to begin.');
    setActiveStep(1); // Go back to first step
  };

  // Determine if any formats are selected
  const hasSelectedFormats = Object.values(selectedFormats).some(value => value === true);

  // Function to handle processing
  const handleProcess = async () => {
    if (!currentFile) {
      setStatusMessage('Please select an image first');
      return;
    }

    const formatKeys = Object.keys(selectedFormats).filter(key => selectedFormats[key]);
    if (formatKeys.length === 0) {
      setStatusMessage('Please select at least one output format');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Processing your image...');
    setError(null);
    setProcessedImages([]);
    setActiveResult(null);

    try {
      // For demo purposes, we'll simulate the processing
      // In production, you would use the actual API calls
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const downloadedImages = [];
      
      for (let i = 0; i < formatKeys.length; i++) {
        const format = formatKeys[i];
        // Create a simulated result
        const dimensions = getFormatDimensions(format);
        
        // We're using the same preview image for demo
        downloadedImages.push({
          name: format,
          url: preview,
          size: `${dimensions.width}×${dimensions.height}`,
          dimensions: dimensions
        });
        
        // Update progress
        setProgress(((i + 1) / formatKeys.length) * 100);
        
        // Add a small delay between formats
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setProcessedImages(downloadedImages);
      setActiveResult(downloadedImages[0]); // Set first result as active
      setStatusMessage('Processing complete! Your images are ready.');
      setActiveStep(3); // Move to final step after processing
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'An error occurred during processing');
      setStatusMessage(`Error: ${err.message || 'An error occurred during processing'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get dimensions for format
  const getFormatDimensions = (format) => {
    switch(format) {
      case 'Logo.png': return { width: 300, height: 300 };
      case 'Smalllogo.png': return { width: 136, height: 136 };
      case 'KDlogo.png': return { width: 140, height: 112 };
      case 'RPTlogo.bmp': return { width: 155, height: 110 };
      case 'PRINTLOGO.bmp': return { width: 600, height: 256 };

          // Online Images - Feature Graphic
      case 'Feature Graphic.png': return { width: 1024, height: 500 };
      
      // Online Images - Push
      case 'hpns.png': return { width: 96, height: 96 };
      
      // Online Images - Logo
      case 'loginLogo.png': return { width: 600, height: 600 };
      case 'logo.png': return { width: 300, height: 300 };
      case 'logo@2x.png': return { width: 300, height: 300 };
      case 'logo@3x.png': return { width: 300, height: 300 };
      
      // Online Images - Appicon
      case 'appicon-60.png': return { width: 60, height: 60 };
      case 'appicon-60@2x.png': return { width: 120, height: 120 };
      case 'appicon-60@3x.png': return { width: 180, height: 180 };
      case 'appicon.png': return { width: 57, height: 57 };
      case 'appicon-512.png': return { width: 512, height: 512 };
      case 'appicon@2x.png': return { width: 114, height: 114 };
      case 'default_app_logo.png': return { width: 512, height: 512 };
      case 'DefaultIcon.png': return { width: 1024, height: 1024 };
      
      // Online Images - Default Large
      case 'default-large.png': return { width: 640, height: 1136 };
      case 'Default-568h@2x.png': return { width: 640, height: 1136 };
      case 'Default-677h@2x.png': return { width: 750, height: 1334 };
      case 'Default-736h@3x.png': return { width: 1242, height: 2208 };
      
      // Online Images - Default XL
      case 'Default-Portrait-1792h@2x.png': return { width: 828, height: 1792 };
      case 'Default-Portrait-2436h@3x.png': return { width: 1125, height: 2436 };
      case 'Default-Portrait-2688h@3x.png': return { width: 1242, height: 2688 };
      
      // Online Images - Default
      case 'Default.png': return { width: 640, height: 980 };
      case 'Default@2x.png': return { width: 1242, height: 1902 };
      
      // Online Images - Miscellaneous
      case 'CarryoutBtn.png': return { width: 300, height: 300 };
      case 'DeliveryBtn.png': return { width: 300, height: 300 };
      case 'FutureBtn.png': return { width: 300, height: 300 };
      case 'NowBtn.png': return { width: 300, height: 300 };
      default: return { width: 300, height: 300 };
    }
  };

  // Function to reset everything
  const handleReset = () => {
    setCurrentFile(null);
    setPreview(null);
    setImageSize(null);
    setSelectedFormats({
      'Logo.png': true,
      'Smalllogo.png': true,
      'KDlogo.png': true,
      'RPTlogo.bmp': true,
      'PRINTLOGO.bmp': true,

      // Online Images - Feature Graphic
      'Feature Graphic.png': true,
      
      // Online Images - Push
      'hpns.png': true,
      
      // Online Images - Logo
      'loginLogo.png': true,
      'logo.png': true,
      'logo@2x.png': true,
      'logo@3x.png': true,
      
      // Online Images - Appicon
      'appicon-60.png': true,
      'appicon-60@2x.png': true,
      'appicon-60@3x.png': true,
      'appicon.png': true,
      'appicon-512.png': true,
      'appicon@2x.png': true,
      'default_app_logo.png': true,
      'DefaultIcon.png': true,
      
      // Online Images - Default Large
      'default.png': true,
      'Default-568h@2x.png': true,
      'Default-677h@2x.png': true,
      'Default-736h@3x.png': true,
      
      // Online Images - Default XL
      'Default-Portrait-1792h@2x.png': true,
      'Default-Portrait-2436h@3x.png': true,
      'Default-Portrait-2688h@3x.png': true,
      
      // Online Images - Default
      'Default.png': true,
      'Default@2x.png': true,
      
      // Online Images - Miscellaneous
      'CarryoutBtn.png': true,
      'DeliveryBtn.png': true,
      'FutureBtn.png': true,
      'NowBtn.png': true  
    });
    setOutputDir('');
    setProcessedImages([]);
    setActiveResult(null);
    setStatusMessage('Ready to start. Select an image to begin.');
    setActiveStep(1);
    setError(null);
  };

  return (
    <Container fluid className="app-container centered-container">
      <div className="logo-header">
        <h1 className="app-title">LogoCraft Web</h1>
        <p className="text-center text-muted">Convert your logos to multiple formats with just a few clicks</p>
      </div>
      
      <StepIndicator 
        activeStep={activeStep} 
        steps={[
          { number: 1, title: "Upload" },
          { number: 2, title: "Configure", disabled: !currentFile },
          { number: 3, title: "Results", disabled: processedImages.length === 0 }
        ]}
      />
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* New Horizontal Layout */}
      <Row className="content-wrapper gx-4">
        {/* Top Row: Upload and Options */}
        <Col lg={4} md={6} className="upload-column mb-3">
          <div className={`panel h-100 ${activeStep !== 1 ? 'panel-inactive' : ''}`}>
            <div className="panel-header">
              <h3 className="panel-title">
                <Badge bg="primary" className="step-badge">1</Badge> Image Upload
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
        
        <Col lg={8} md={6} className="options-column mb-3">
          <Row className="h-100">
            <Col md={6} className="mb-3 mb-md-0">
              <div className={`panel h-100 ${activeStep !== 2 ? 'panel-inactive' : ''}`}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Badge bg="primary" className="step-badge">2</Badge> Export Options
                  </h3>
                </div>
                <div className="panel-body">
                  <OutputOptions 
                    selectedFormats={selectedFormats}
                    setSelectedFormats={setSelectedFormats}
                    disabled={!currentFile || isProcessing}
                  />
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className={`panel h-100 ${activeStep !== 2 ? 'panel-inactive' : ''}`}>
                <div className="panel-header">
                  <h3 className="panel-title">Processing</h3>
                </div>
                <div className="panel-body">
                  <ProcessingOptions 
                    outputDir={outputDir}
                    setOutputDir={setOutputDir}
                    onProcess={handleProcess}
                    isProcessing={isProcessing}
                    progress={progress}
                    disabled={!currentFile || !hasSelectedFormats}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Col>
        
        {/* Bottom Row: Preview and Format Info */}
        <Col lg={9} md={8} className="preview-column mb-3">
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
        
        <Col lg={3} md={4} className="info-column mb-3">
          <div className="panel h-100 d-none d-md-block">
            <div className="panel-header">
              <h3 className="panel-title">Supported Formats</h3>
            </div>
            <div className="panel-body">
              <FormatInfo />
            </div>
          </div>
        </Col>
      </Row>
      
      <StatusBar message={statusMessage} />
      
      {(currentFile || processedImages.length > 0) && (
        <div className="sticky-footer">
          <div>
            <Button 
              variant="outline-secondary"
              onClick={handleReset}
            >
              Start Over
            </Button>
            
            {processedImages.length > 0 && (
              <div>
                <span className="text-muted me-2">
                  {processedImages.length} formats processed
                </span>
                <Button 
                  variant="success"
                  onClick={() => {
                    alert("In production, this would download all processed images as a zip file.");
                  }}
                >
                  Download All
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}

export default App;

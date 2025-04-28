// frontend/src/components/MainPreview.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { Download, Images, FileImage, ArrowsFullscreen } from 'react-bootstrap-icons';

const MainPreview = ({
  preview,
  processedImages = [],
  activeResult,
  setActiveResult,
  imageSize,
  isProcessing,
  activeStep
}) => {

  const renderPreviewContent = () => {
    if (isProcessing && activeStep !== 3) {
      return (
        <div className="processing-animation">
          <div className="spinner"></div>
          <h4>Processing your image...</h4>
          <p>This may take a few moments</p>
        </div>
      );
    }

    if (activeResult) {
      return (
        <>
          <div className="preview-body">
            <div className="position-relative">
              <img
                src={activeResult.url}
                alt={activeResult.name}
                className="full-preview"
                onError={(e) => { e.target.onerror = null; e.target.src="placeholder.png"; }}
              />
              {activeResult.dimensions && (
                <div className="image-dimensions">
                   <ArrowsFullscreen size={12} /> {activeResult.dimensions.width} × {activeResult.dimensions.height} px
                </div>
              )}
            </div>
          </div>
          <div className="preview-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{activeResult.name}</h5>
                {activeResult.size && <span className="text-muted small">{activeResult.size}</span>}
              </div>
              <Button
                variant="primary"
                href={activeResult.url}
                download={activeResult.name}
                className="d-flex align-items-center gap-2"
              >
                <Download size={16} /> Download
              </Button>
            </div>

            {processedImages.length > 1 && (
              <>
                <hr className="my-3" />
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">All Processed Formats ({processedImages.length})</h6>
                    {/* Download All Button Removed Here */}
                  </div>
                  <div className="results-thumbnails">
                    {processedImages.map((image, index) => (
                      <img
                        key={image.url || index}
                        src={image.url}
                        alt={image.name}
                        className={`result-thumbnail ${activeResult?.name === image.name ? 'active' : ''}`}
                        onClick={() => setActiveResult(image)}
                        title={image.name}
                        onError={(e) => { e.target.onerror = null; e.target.src="placeholder.png"; }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      );
    }

    if (preview) {
       return (
         <>
           <div className="preview-body">
             <div className="position-relative">
               <img
                 src={preview}
                 alt="Original Preview"
                 className="full-preview"
               />
               {imageSize && (
                 <div className="image-dimensions">
                   <ArrowsFullscreen size={12} /> {imageSize.width} × {imageSize.height} px
                 </div>
               )}
             </div>
           </div>
           <div className="preview-footer">
             <div className="d-flex justify-content-between align-items-center">
               <h5 className="mb-0">Original Image</h5>
               {activeStep === 2 && (
                 <span className="text-muted">Select export options to continue</span>
               )}
               {activeStep === 1 && (
                 <span className="text-muted">Step 1: Image uploaded</span>
               )}
             </div>
           </div>
         </>
       );
    }

     return (
       <div className="empty-preview">
         <FileImage className="preview-placeholder-icon" />
         <h4>No Image Selected</h4>
         <p className={activeStep === 1 ? 'text-primary fw-bold' : ''}>
           {activeStep === 1
             ? "Step 1: Upload an image to get started"
             : "Upload an image to get started"}
         </p>
         <div className="mt-4 text-muted small">
           <p className="mb-1">Supported formats: PNG, JPEG, GIF, BMP, TIFF, WebP</p>
           <p className="mb-0">Maximum size: 20MB</p>
         </div>
       </div>
     );
  };

  const getPanelTitle = () => {
      if (activeStep === 3 && processedImages.length > 0) {
        return (
          <>
            <Images className="me-2" /> Processing Results
            <span className="ms-2 badge bg-success">Step 3: Complete</span>
          </>
        );
      } else if (activeStep === 2 && preview) {
         return (
          <>
            <FileImage className="me-2" /> Image Preview
            <span className="ms-2 badge bg-primary">Step 2: Configure</span>
          </>
         );
      } else if (activeStep === 1 && preview) {
         return (
          <>
            <FileImage className="me-2" /> Image Preview
            <span className="ms-2 badge bg-success">Step 1: Complete</span>
          </>
         );
      } else {
         return (
          <>
            <FileImage className="me-2" /> Image Preview
          </>
         );
      }
  };

  return (
    <div className="main-preview-pane h-100">
      <div className={`panel main-preview-container ${activeStep === 3 || (isProcessing && activeStep !== 3) ? 'panel-active' : ''}`}>
        <div className="panel-header">
          <h3 className="panel-title d-flex align-items-center">
             {getPanelTitle()}
          </h3>
        </div>
        {renderPreviewContent()}
      </div>
    </div>
  );
};

export default MainPreview;
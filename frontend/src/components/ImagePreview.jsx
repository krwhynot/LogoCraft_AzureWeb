// frontend/src/components/ImagePreview.jsx
import React, { useRef, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { X, Upload, Image } from 'react-bootstrap-icons';

const ImagePreview = ({ 
  preview, 
  onFileSelect, 
  onRemoveImage,
  imageSize,
  fileName
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isImageFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isImageFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const isImageFile = (file) => {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
    return acceptedTypes.includes(file.type);
  };

  const handleSelectClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <div
        className={`preview-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="preview-wrapper">
            <img src={preview} alt="Preview" className="preview-image" />
            {imageSize && (
              <div className="image-dimensions">
                <Image size={12} /> {imageSize.width} × {imageSize.height} px
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload size={48} className="text-primary mb-3" />
            <p className="mb-1">Drag and drop image here</p>
            <p className="text-muted small">or use the button below</p>
          </div>
        )}
      </div>
      
      <div className="d-flex justify-content-between align-items-center mt-3">
        <Button 
          variant={preview ? "outline-primary" : "primary"}
          onClick={handleSelectClick}
          className="d-flex align-items-center gap-2"
        >
          <Upload size={16} />
          {preview ? "Change Image" : "Select Image"}
        </Button>
        
        {preview && (
          <Button 
            variant="outline-danger"
            onClick={onRemoveImage}
            title="Remove image"
            className="d-flex align-items-center"
          >
            <X size={18} />
          </Button>)}
      </div>
      
      {fileName && (
        <div className="file-info mt-3">
          <span className="file-name">{fileName}</span>
          {imageSize && (
            <span className="file-size text-muted">
              {imageSize.width} × {imageSize.height}
            </span>
          )}
        </div>
      )}
      
      <Form.Control
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept=".png,.jpg,.jpeg,.bmp,.gif,.tiff,.webp"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImagePreview;
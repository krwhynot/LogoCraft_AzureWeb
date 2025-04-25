// frontend/src/components/ProcessingOptions.jsx
import React from 'react';
import { Form, InputGroup, Button, ProgressBar } from 'react-bootstrap';
import { FolderFill, ArrowRightCircleFill, CloudArrowUp } from 'react-bootstrap-icons';

const ProcessingOptions = ({ 
  outputDir, 
  setOutputDir, 
  onProcess, 
  isProcessing, 
  progress,
  disabled
}) => {
  return (
    <div>
      <InputGroup className="mb-3">
        <InputGroup.Text>
          <FolderFill />
        </InputGroup.Text>
        <Form.Control
          placeholder="Output Folder Name (optional)"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          disabled={isProcessing || disabled}
        />
      </InputGroup>
      
      <Button
        variant="primary"
        onClick={onProcess}
        disabled={isProcessing || disabled}
        className="w-100 py-3 process-button d-flex align-items-center justify-content-center gap-2"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>
            <CloudArrowUp size={20} />
            Process & Generate Formats
          </>
        )}
      </Button>
      
      {isProcessing && (
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <span>Processing...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar 
            now={progress} 
            animated
          />
        </div>
      )}
      
      {!isProcessing && disabled && !outputDir && (
        <div className="mt-3 text-center text-muted small">
          {disabled ? "Upload an image and select formats to continue" : ""}
        </div>
      )}
    </div>
  );
};

export default ProcessingOptions;
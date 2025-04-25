// frontend/src/components/ResultsGallery.jsx
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Download, Clipboard } from 'react-bootstrap-icons';

const ResultsGallery = ({ processedImages }) => {
  if (!processedImages || processedImages.length === 0) {
    return null;
  }

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('URL copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  return (
    <div className="panel">
      <h3 className="panel-title">Processed Images</h3>
      <Row>
        {processedImages.map((image, index) => (
          <Col key={index} xs={6} md={4} className="mb-3">
            <Card className="h-100">
              <Card.Img 
                variant="top" 
                src={image.url} 
                alt={image.name}
                className="processed-image"
              />
              <Card.Body className="p-2 text-center">
                <Card.Title className="format-name">{image.name}</Card.Title>
                {image.size && <small className="text-muted d-block mb-2">{image.size}</small>}
                <div className="d-flex justify-content-between mt-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    href={image.url} 
                    download={image.name}
                  >
                    <Download size={14} className="me-1" /> Download
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => copyToClipboard(image.url)}
                  >
                    <Clipboard size={14} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ResultsGallery;
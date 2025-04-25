// frontend/src/components/FormatInfo.jsx
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const FormatInfo = () => {
  const formats = [
    { 
      name: 'PNG', 
      color: 'bg-primary',
      description: 'Lossless compression with transparency',
      uses: 'Websites, apps, digital media'
    },
    { 
      name: 'JPEG/JPG', 
      color: 'bg-success',
      description: 'Lossy compression for photographs',
      uses: 'Photos, web images, email'
    },
    { 
      name: 'GIF', 
      color: 'bg-warning text-dark',
      description: 'Animation support with limited colors',
      uses: 'Simple animations, icons'
    },
    { 
      name: 'TIFF', 
      color: 'bg-info',
      description: 'High-quality uncompressed format',
      uses: 'Print, archiving, professional editing'
    },
    { 
      name: 'WebP', 
      color: 'bg-secondary',
      description: 'Modern format with better compression',
      uses: 'Web images, modern browsers'
    },
    { 
      name: 'BMP', 
      color: 'bg-dark',
      description: 'Uncompressed pixel data',
      uses: 'Legacy systems, specialized hardware'
    }
  ];
  
  return (
    <div>
      <p className="mb-3">
        All input formats below are supported for conversion to the output types listed in Export Options.
      </p>
      
      <Row className="g-2">
        {formats.map((format, index) => (
          <Col key={index} xs={6} md={4}>
            <Card className="h-100 border-0">
              <Card.Header className={`${format.color} text-white text-center py-2`}>
                {format.name}
              </Card.Header>
              <Card.Body className="p-2">
                <Card.Text className="small mb-0">
                  {format.uses}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FormatInfo;
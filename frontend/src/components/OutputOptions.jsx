// frontend/src/components/OutputOptions.jsx
import React from 'react';
import { Form, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { InfoCircle, CheckCircle } from 'react-bootstrap-icons';

const OutputOptions = ({ selectedFormats, setSelectedFormats, disabled }) => {
  const formatGroups = [
    {
      title: "PNG Formats",
      description: "Portable Network Graphics with transparency support",
      formats: [
        { 
          id: 'Logo.png', 
          label: 'Logo PNG (300×300)',
          tooltip: 'Standard square logo format with transparent background, ideal for websites and digital media'
        },
        { 
          id: 'Smalllogo.png', 
          label: 'Small Logo PNG (136×136)',
          tooltip: 'Compact size for thumbnails, app icons, and mobile applications'
        },
        { 
          id: 'KDlogo.png', 
          label: 'KD Logo PNG (140×112)',
          tooltip: 'Slightly rectangular format optimized for UI elements and sidebar navigation'
        }
      ]
    },
    {
      title: "BMP Formats",
      description: "Bitmap formats for legacy system compatibility",
      formats: [
        { 
          id: 'RPTlogo.bmp', 
          label: 'RPT Logo BMP (155×110)',
          tooltip: 'BMP format for legacy systems and specialized applications'
        },
        { 
          id: 'PRINTLOGO.bmp', 
          label: 'Print Logo BMP (Thermal)',
          tooltip: 'Optimized for thermal printer output at 203 DPI, includes printer-specific adjustments'
        }
      ]
    }
  ];

  const handleCheckboxChange = (formatId) => {
    setSelectedFormats({
      ...selectedFormats,
      [formatId]: !selectedFormats[formatId]
    });
  };

  const handleSelectAll = (checked) => {
    const newFormats = {};
    Object.keys(selectedFormats).forEach(key => {
      newFormats[key] = checked;
    });
    setSelectedFormats(newFormats);
  };

  const selectedCount = Object.values(selectedFormats).filter(Boolean).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <div className="d-flex align-items-center">
            <CheckCircle className="text-primary me-1" size={14} />
            <span className="text-primary small">{selectedCount} formats selected</span>
          </div>
        </div>
        <div>
          <Button 
            variant="link" 
            onClick={() => handleSelectAll(true)}
            disabled={disabled}
            className="btn-sm text-decoration-none p-1"
            size="sm"
          >
            Select All
          </Button>
          <Button 
            variant="link" 
            onClick={() => handleSelectAll(false)}
            disabled={disabled}
            className="btn-sm text-decoration-none p-1"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </div>
      
      {formatGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="format-group">
          <h6 className="format-group-title mb-1">{group.title}</h6>
          {group.formats.map((format) => (
            <Form.Check
              key={format.id}
              type="checkbox"
              id={`format-${format.id}`}
              label={
                <>
                  {format.label}
                  <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip>{format.tooltip}</Tooltip>}
                  >
                    <InfoCircle size={12} className="tooltip-icon" />
                  </OverlayTrigger>
                </>
              }
              checked={selectedFormats[format.id]}
              onChange={() => handleCheckboxChange(format.id)}
              className="format-checkbox"
              disabled={disabled}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default OutputOptions;
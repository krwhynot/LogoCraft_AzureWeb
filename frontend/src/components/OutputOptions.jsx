// frontend/src/components/OutputOptions.jsx
import React, { useState } from 'react';
import { Form, OverlayTrigger, Tooltip, Button, Card, Row, Col, Collapse } from 'react-bootstrap';
import { InfoCircle, CheckCircle, ChevronDown, ChevronUp } from 'react-bootstrap-icons';

const OutputOptions = ({ selectedFormats, setSelectedFormats, disabled }) => {
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState(['Feature Graphic']);
  
  // Toggle category expansion
  const toggleCategory = (category) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(cat => cat !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };
  const formatGroups = [
    {
      title: "Installer Images",
      description: "Image formats optimized for desktop applications",
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
        },
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
    },
    {
      title: "Online Images",
      description: "Image formats optimized for web, mobile and social media",
      formats: [
        // Feature Graphic
        { 
          id: 'Feature Graphic.png', 
          label: 'Feature Graphic (1024×500)',
          tooltip: 'Feature graphic for app stores and promotional materials'
        },
        
        // Push
        { 
          id: 'hpns.png', 
          label: 'Push Notification Icon (96×96)',
          tooltip: 'Icon for push notifications'
        },
        
        // Logo
        { 
          id: 'loginLogo.png', 
          label: 'Login Logo (600×600)',
          tooltip: 'Main login logo with 20% transparent padding'
        },
        { 
          id: 'logo.png', 
          label: 'Standard Logo (300×300)',
          tooltip: 'Standard logo with 55% transparent padding'
        },
        { 
          id: 'logo@2x.png', 
          label: 'Standard Logo @2x (300×300)',
          tooltip: 'High resolution version of standard logo'
        },
        { 
          id: 'logo@3x.png', 
          label: 'Standard Logo @3x (300×300)',
          tooltip: 'Extra high resolution version of standard logo'
        },
        
        // Appicon
        { 
          id: 'appicon-60.png', 
          label: 'App Icon 60 (60×60)',
          tooltip: 'iOS app icon for older devices'
        },
        { 
          id: 'appicon-60@2x.png', 
          label: 'App Icon 60 @2x (120×120)',
          tooltip: 'iOS app icon for standard resolution devices'
        },
        { 
          id: 'appicon-60@3x.png', 
          label: 'App Icon 60 @3x (180×180)',
          tooltip: 'iOS app icon for high resolution devices'
        },
        { 
          id: 'appicon.png', 
          label: 'App Icon (57×57)',
          tooltip: 'Legacy iOS app icon'
        },
        { 
          id: 'appicon-512.png', 
          label: 'App Icon Large (512×512)',
          tooltip: 'Large app icon for app stores'
        },
        { 
          id: 'appicon@2x.png', 
          label: 'App Icon @2x (114×114)',
          tooltip: 'High resolution legacy iOS app icon'
        },
        { 
          id: 'default_app_logo.png', 
          label: 'Default App Logo (512×512)',
          tooltip: 'Default application logo'
        },
        { 
          id: 'DefaultIcon.png', 
          label: 'Default Icon Large (1024×1024)',
          tooltip: 'Largest version of app icon for marketing materials'
        },
        
        // Default Large
        { 
          id: 'default-large.png', 
          label: 'Default Splash (640×1136)',
          tooltip: 'Default splash screen'
        },
        { 
          id: 'Default-568h@2x.png', 
          label: 'Default Splash 568h @2x (640×1136)',
          tooltip: 'Splash screen for 4-inch iPhones'
        },
        { 
          id: 'Default-677h@2x.png', 
          label: 'Default Splash 677h @2x (750×1334)',
          tooltip: 'Splash screen for 4.7-inch iPhones'
        },
        { 
          id: 'Default-736h@3x.png', 
          label: 'Default Splash 736h @3x (1242×2208)',
          tooltip: 'Splash screen for 5.5-inch iPhones'
        },
        
        // Default XL
        { 
          id: 'Default-Portrait-1792h@2x.png', 
          label: 'Default XL 1792h @2x (828×1792)',
          tooltip: 'Splash screen for iPhone XR/11'
        },
        { 
          id: 'Default-Portrait-2436h@3x.png', 
          label: 'Default XL 2436h @3x (1125×2436)',
          tooltip: 'Splash screen for iPhone X/XS/11 Pro'
        },
        { 
          id: 'Default-Portrait-2688h@3x.png', 
          label: 'Default XL 2688h @3x (1242×2688)',
          tooltip: 'Splash screen for iPhone XS Max/11 Pro Max'
        },
        
        // Default
        { 
          id: 'Default.png', 
          label: 'Default (640×980)',
          tooltip: 'Standard default splash screen'
        },
        { 
          id: 'Default@2x.png', 
          label: 'Default @2x (1242×1902)',
          tooltip: 'High resolution default splash screen'
        },
        
        // Miscellaneous
        { 
          id: 'CarryoutBtn.png', 
          label: 'Carryout Button (300×300)',
          tooltip: 'Button for carryout option'
        },
        { 
          id: 'DeliveryBtn.png', 
          label: 'Delivery Button (300×300)',
          tooltip: 'Button for delivery option'
        },
        { 
          id: 'FutureBtn.png', 
          label: 'Future Button (300×300)',
          tooltip: 'Button for future or scheduled orders'
        },
        { 
          id: 'NowBtn.png', 
          label: 'Now Button (300×300)',
          tooltip: 'Button for immediate action'
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
      
      {/* Group Boxes */}
      <div className="format-groups">
        {formatGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="format-group-card mb-3">
            <Card.Header className="format-group-header">
              <h6 className="format-group-title mb-0">{group.title}</h6>
            </Card.Header>
            <Card.Body className="format-group-body py-2">
      {group.description && (
        <p className="small text-muted mb-2">{group.description}</p>
      )}
      
      {group.title === "Online Images" ? (
        // For Online Images, group by categories with collapsible sections
        <>
          {/* Feature Graphic Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Feature Graphic')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Feature Graphic')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Feature Graphic</h6>
                <span>{expandedCategories.includes('Feature Graphic') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Feature Graphic')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(0, 1).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Push Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Push')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Push')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Push</h6>
                <span>{expandedCategories.includes('Push') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Push')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(1, 2).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Logo Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Logo')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Logo')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Logo</h6>
                <span>{expandedCategories.includes('Logo') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Logo')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(2, 6).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Appicon Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Appicon')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Appicon')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Appicon</h6>
                <span>{expandedCategories.includes('Appicon') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Appicon')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(6, 14).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Default Large Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Default Large')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Default Large')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Default Large</h6>
                <span>{expandedCategories.includes('Default Large') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Default Large')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(14, 18).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Default XL Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Default XL')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Default XL')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Default XL</h6>
                <span>{expandedCategories.includes('Default XL') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Default XL')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(18, 21).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Default Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Default')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Default')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Default</h6>
                <span>{expandedCategories.includes('Default') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Default')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(21, 23).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
          
          {/* Miscellaneous Category */}
          <div className="format-category mb-2">
            <Button
              onClick={() => toggleCategory('Miscellaneous')}
              variant="link"
              className="format-category-toggle w-100 text-start p-1"
              aria-expanded={expandedCategories.includes('Miscellaneous')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="format-category-heading mb-0">Miscellaneous</h6>
                <span>{expandedCategories.includes('Miscellaneous') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </div>
            </Button>
            
            <Collapse in={expandedCategories.includes('Miscellaneous')}>
              <div>
                <Row className="mx-0">
                  {group.formats.slice(23).map((format) => (
                    <Col md={6} lg={4} key={format.id}>
                      <Form.Check
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
                    </Col>
                  ))}
                </Row>
              </div>
            </Collapse>
          </div>
        </>
      ) : (
        // For other groups (like Installer Images), render in a grid layout
        <Row className="mx-0">
          {group.formats.map((format) => (
            <Col md={6} lg={4} key={format.id}>
              <Form.Check
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
            </Col>
          ))}
        </Row>
      )}
    </Card.Body>            
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OutputOptions;

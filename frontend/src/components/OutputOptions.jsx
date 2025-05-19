import React from 'react';
import { Form, OverlayTrigger, Tooltip, Button, Row, Col, Tabs, Tab, ButtonGroup } from 'react-bootstrap';
import { InfoCircle, CheckCircle } from 'react-bootstrap-icons';

const OutputOptions = ({ selectedFormats, setSelectedFormats, disabled }) => {

  const formatGroups = [
    {
      title: "Installer Images",
      formats: [
        { id: 'Logo.png', label: 'Logo PNG (300×300)', tooltip: 'Standard square logo format with transparent background, ideal for websites and digital media'},
        { id: 'Smalllogo.png', label: 'Small Logo PNG (136×136)', tooltip: 'Compact size for thumbnails, app icons, and mobile applications'},
        { id: 'KDlogo.png', label: 'KD Logo PNG (140×112)', tooltip: 'Slightly rectangular format optimized for UI elements and sidebar navigation'},
        { id: 'RPTlogo.bmp', label: 'RPT Logo BMP (155×110)', tooltip: 'BMP format for legacy systems and specialized applications'},
        { id: 'PRINTLOGO.bmp', label: 'Print Logo BMP (600X256)', tooltip: 'Optimized for thermal printer output at 203 DPI, includes printer-specific adjustments'}
      ]
    },
    {
      title: "Online Images",
      formats: [
        { id: 'Feature Graphic.png', label: 'Feature Graphic (1024×500)', tooltip: 'Feature graphic for app stores and promotional materials'},
        { id: 'hpns.png', label: 'Push Notification Icon (96×96)', tooltip: 'Icon for push notifications'},
        { id: 'loginLogo.png', label: 'Login Logo (600×600)', tooltip: 'Main login logo with 20% transparent padding'},
        { id: 'logo.png', label: 'Standard Logo (300×300)', tooltip: 'Standard logo with 55% transparent padding'},
        { id: 'logo@2x.png', label: 'Standard Logo @2x (300×300)', tooltip: 'High resolution version of standard logo'},
        { id: 'logo@3x.png', label: 'Standard Logo @3x (300×300)', tooltip: 'Extra high resolution version of standard logo'},
        { id: 'appicon-60.png', label: 'App Icon 60 (60×60)', tooltip: 'iOS app icon for older devices'},
        { id: 'appicon-60@2x.png', label: 'App Icon 60 @2x (120×120)', tooltip: 'iOS app icon for standard resolution devices'},
        { id: 'appicon-60@3x.png', label: 'App Icon 60 @3x (180×180)', tooltip: 'iOS app icon for high resolution devices'},
        { id: 'appicon.png', label: 'App Icon (57×57)', tooltip: 'Legacy iOS app icon'},
        { id: 'appicon-512.png', label: 'App Icon Large (512×512)', tooltip: 'Large app icon for app stores'},
        { id: 'appicon@2x.png', label: 'App Icon @2x (114×114)', tooltip: 'High resolution legacy iOS app icon'},
        { id: 'default_app_logo.png', label: 'Default App Logo (512×512)', tooltip: 'Default application logo'},
        { id: 'DefaultIcon.png', label: 'Default Icon Large (1024×1024)', tooltip: 'Largest version of app icon for marketing materials'},
        { id: 'default-large.png', label: 'Default Splash (640×1136)', tooltip: 'Default splash screen'},
        { id: 'Default-568h@2x.png', label: 'Default Splash 568h @2x (640×1136)', tooltip: 'Splash screen for 4-inch iPhones'},
        { id: 'Default-677h@2x.png', label: 'Default Splash 677h @2x (750×1334)', tooltip: 'Splash screen for 4.7-inch iPhones'},
        { id: 'Default-736h@3x.png', label: 'Default Splash 736h @3x (1242×2208)', tooltip: 'Splash screen for 5.5-inch iPhones'},
        { id: 'Default-Portrait-1792h@2x.png', label: 'Default XL 1792h @2x (828×1792)', tooltip: 'Splash screen for iPhone XR/11'},
        { id: 'Default-Portrait-2436h@3x.png', label: 'Default XL 2436h @3x (1125×2436)', tooltip: 'Splash screen for iPhone X/XS/11 Pro'},
        { id: 'Default-Portrait-2688h@3x.png', label: 'Default XL 2688h @3x (1242×2688)', tooltip: 'Splash screen for iPhone XS Max/11 Pro Max'},
        { id: 'Default.png', label: 'Default (640×980)', tooltip: 'Standard default splash screen'},
        { id: 'Default@2x.png', label: 'Default @2x (1242×1902)', tooltip: 'High resolution default splash screen'},
        { id: 'CarryoutBtn.png', label: 'Carryout Button (300×300)', tooltip: 'Button for carryout option'},
        { id: 'DeliveryBtn.png', label: 'Delivery Button (300×300)', tooltip: 'Button for delivery option'},
        { id: 'FutureBtn.png', label: 'Future Button (300×300)', tooltip: 'Button for future or scheduled orders'},
        { id: 'NowBtn.png', label: 'Now Button (300×300)', tooltip: 'Button for immediate action'}
      ]
    }
  ];

  // Extract keys for each group
  const installerFormatKeys = formatGroups[0].formats.map(f => f.id);
  const onlineFormatKeys = formatGroups[1].formats.map(f => f.id);

  const handleCheckboxChange = (formatId) => {
    setSelectedFormats(prev => ({
      ...prev,
      [formatId]: !prev[formatId]
    }));
  };

  // Generic handler for selecting/clearing a group
  const handleSelectGroup = (keysToModify, checked) => {
    const updates = {};
    keysToModify.forEach(key => {
      updates[key] = checked;
    });
    setSelectedFormats(prev => ({ ...prev, ...updates }));
  };

  const selectedCount = Object.values(selectedFormats).filter(Boolean).length;

  // Helper to render checkboxes for a given list of formats
  const renderCheckboxes = (formats) => (
    <Row className="mx-0 mt-2">
      {formats.map((format) => (
        <Col md={6} lg={4} key={format.id} className="mb-1">
          <Form.Check
            type="checkbox"
            id={`format-${format.id}`}
            label={
              <>
                {format.label}
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id={`tooltip-${format.id}`}>{format.tooltip}</Tooltip>}
                >
                  <InfoCircle size={12} className="tooltip-icon ms-1" />
                </OverlayTrigger>
              </>
            }
            checked={selectedFormats[format.id] || false}
            onChange={() => handleCheckboxChange(format.id)}
            className="format-checkbox small"
            disabled={disabled}
          />
        </Col>
      ))}
    </Row>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <CheckCircle className="text-primary me-1" size={14} />
          <span className="text-primary small">{selectedCount} total formats selected</span>
        </div>
        {/* Global buttons removed, moved inside tabs */}
      </div>

      <Tabs defaultActiveKey="installer" id="format-tabs" className="mb-3 format-tabs" fill>
        <Tab eventKey="installer" title="Installer Images">
          <div className="d-flex justify-content-end mb-2">
             <ButtonGroup size="sm">
                <Button
                  variant="outline-secondary"
                  onClick={() => handleSelectGroup(installerFormatKeys, true)}
                  disabled={disabled}
                >
                  Select All
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => handleSelectGroup(installerFormatKeys, false)}
                  disabled={disabled}
                >
                  Clear All
                </Button>
             </ButtonGroup>
          </div>
          {renderCheckboxes(formatGroups[0].formats)}
        </Tab>
        <Tab eventKey="online" title="Online Images">
           <div className="d-flex justify-content-end mb-2">
             <ButtonGroup size="sm">
                <Button
                  variant="outline-secondary"
                  onClick={() => handleSelectGroup(onlineFormatKeys, true)}
                  disabled={disabled}
                >
                  Select All
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => handleSelectGroup(onlineFormatKeys, false)}
                  disabled={disabled}
                >
                  Clear All
                </Button>
             </ButtonGroup>
          </div>
          {renderCheckboxes(formatGroups[1].formats)}
        </Tab>
      </Tabs>
    </div>
  );
};

export default OutputOptions;

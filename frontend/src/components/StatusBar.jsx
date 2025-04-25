// frontend/src/components/StatusBar.jsx
import React from 'react';
import { InfoCircle } from 'react-bootstrap-icons';

const StatusBar = ({ message }) => {
  return (
    <div className="status-bar">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <InfoCircle className="me-2" />
            {message}
          </div>
          <div className="small text-muted">LogoCraft Web v1.0</div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
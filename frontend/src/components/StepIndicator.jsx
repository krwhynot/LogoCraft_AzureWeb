// frontend/src/components/StepIndicator.jsx
import React from 'react';
import { CheckCircleFill } from 'react-bootstrap-icons';

const StepIndicator = ({ activeStep, steps }) => {
  return (
    <div className="steps-container">
      {steps.map((step) => {
        const isActive = activeStep === step.number;
        const isCompleted = activeStep > step.number;
        
        return (
          <div className="step-item" key={step.number}>
            <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              {isCompleted ? <CheckCircleFill size={20} /> : step.number}
            </div>
            <div className="step-title">
              {step.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
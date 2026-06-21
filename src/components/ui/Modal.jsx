import React from 'react';
import { Button } from './Button';

export const Modal = ({ 
  title, 
  children, 
  onClose, 
  width = "560px", 
  zIndex = 10002 
}) => {
  return (
    <div className="rwa-ov" style={{ zIndex }}>
      <div className="rwa-win" style={{ width }}>
        <div className="rwa-topbar"></div>
        <div className="rwa-hdr">
          <div className="rwa-title">{title}</div>
          {onClose && (
            <Button 
              className="rwa-btn-close"
              onClick={onClose} 
            >
              ✕
            </Button>
          )}
        </div>
        <div className="rwa-body">
          {children}
        </div>
      </div>
    </div>
  );
};
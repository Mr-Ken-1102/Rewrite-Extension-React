import React from 'react';

export const Slider = ({ 
  value, 
  onChange, 
  disabled, 
  min = "-99", 
  max = "200", 
  label = "📏 LENGTH ADJUST",
  ...rest // Hứng onMouseUp, onTouchEnd từ cha truyền xuống
}) => {
  const formatPct = (v) => `${v >= 0 ? "+" : ""}${v}%`;

  return (
    <div className="rwa-slider-row" style={{ opacity: disabled ? "0.45" : "1" }}>
      <span className="rwa-slider-lbl" style={{ letterSpacing: "0.05em" }}>
        {label}
      </span>
      <input
        className="rwa-range"
        type="range"
        min={min}
        max={max}
        value={value || 0}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        {...rest} // Phải bơm vào đây để keepFocus() hoạt động
      />
      <span className="rwa-slider-val">{formatPct(value || 0)}</span>
    </div>
  );
};
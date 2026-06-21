import React, { useRef } from 'react';

export const Button = ({ 
  children, 
  variant = '', 
  className = '', 
  onClick, 
  disabled, 
  title, 
  style, 
  type = "button",
  ...rest // [BẢN VÁ QUAN TRỌNG]: Hứng toàn bộ các sự kiện khác (onMouseEnter, onMouseLeave, onMouseUp, v.v.)
}) => {
  const btnRef = useRef(null);

  // Kế thừa chính xác thuật toán tính tọa độ chuột cho hiệu ứng rwa-glow-button
  const handleMouseMove = (e) => {
    if (!btnRef.current || disabled) return;
    window.requestAnimationFrame(() => {
      // Bảo vệ component khi bị unmount đột ngột
      if (!btnRef.current) return; 
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btnRef.current.style.setProperty('--x', `${x}px`);
      btnRef.current.style.setProperty('--y', `${y}px`);
    });
    
    // Nếu cha có truyền onMouseMove, vẫn phải gọi nó
    if (rest.onMouseMove) {
      rest.onMouseMove(e);
    }
  };

  const baseClass = variant ? `rwa-btn ${variant}` : 'rwa-btn';
  // Lọc để tránh trùng lặp class rwa-glow-button nếu cha lỡ truyền vào
  const cleanClassName = className.replace('rwa-glow-button', '').trim();
  const finalClass = `${baseClass} rwa-glow-button ${cleanClassName}`.trim();

  return (
    <button
      ref={btnRef}
      type={type}
      className={finalClass}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      {...rest} // [BẢN VÁ QUAN TRỌNG]: Trải toàn bộ props xuống DOM thật
      onMouseMove={handleMouseMove} // Ghi đè onMouseMove sau cùng để giữ logic Glow
    >
      {children}
    </button>
  );
};
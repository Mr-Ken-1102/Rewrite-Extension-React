import { useRef } from 'react';

export const Button = ({
  children,
  variant = '',
  className = '',
  onClick,
  disabled,
  title,
  style,
  type = 'button',
  glow = true,
  ...rest
}) => {
  const btnRef = useRef(null);

  const handleMouseMove = (event) => {
    if (glow && btnRef.current && !disabled) {
      window.requestAnimationFrame(() => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        btnRef.current.style.setProperty('--x', `${x}px`);
        btnRef.current.style.setProperty('--y', `${y}px`);
      });
    }

    rest.onMouseMove?.(event);
  };

  const baseClass = variant ? `rwa-btn ${variant}` : 'rwa-btn';
  const cleanClassName = className.replace('rwa-glow-button', '').trim();
  const glowClass = glow ? 'rwa-glow-button' : '';
  const finalClass = `${baseClass} ${glowClass} ${cleanClassName}`.trim();

  return (
    <button
      ref={btnRef}
      type={type}
      className={finalClass}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      {...rest}
      onMouseMove={handleMouseMove}
    >
      {children}
    </button>
  );
};

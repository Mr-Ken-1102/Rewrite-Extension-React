export const ToggleSwitch = ({
  checked,
  onChange,
  label,
  disabled,
  labelStyle = {},
  ariaLabel,
  ariaDescribedBy,
}) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? '0.35' : '1',
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}
    >
      <div className="rwa-tog-wrap">
        <input
          type="checkbox"
          role="switch"
          checked={!!checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
        />
        <span className="rwa-tog-sl"></span>
      </div>
      {label && (
        <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'rgba(255,255,255,0.85)', ...labelStyle }}>
          {label}
        </span>
      )}
    </label>
  );
};

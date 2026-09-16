
export const ToggleSwitch = ({ checked, onChange, label, disabled, labelStyle = {} }) => {
  return (
    <label 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? "0.35" : "1",
        pointerEvents: disabled ? "none" : "auto",
        transition: "opacity 0.2s"
      }}
    >
      <div className="rwa-tog-wrap">
        <input 
          type="checkbox" 
          checked={!!checked} 
          onChange={(e) => onChange(e.target.checked)} 
          disabled={disabled} 
        />
        <span className="rwa-tog-sl"></span>
      </div>
      {label && (
        <span style={{ fontSize: "11.5px", fontWeight: "700", color: "rgba(255,255,255,0.85)", ...labelStyle }}>
          {label}
        </span>
      )}
    </label>
  );
};
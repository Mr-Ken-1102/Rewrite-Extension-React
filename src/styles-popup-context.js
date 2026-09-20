export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-performance-strip {
  min-height:27px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  align-items:stretch;
  gap:4px;
  margin:0;
  padding:0 0 2px;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
.rwa2-performance-item {
  appearance:none;
  position:relative;
  min-width:0;
  min-height:25px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  padding:0 6px;
  border:1px solid transparent;
  border-radius:7px;
  background:transparent;
  color:rgba(255,255,255,.48);
  font:inherit;
  cursor:pointer;
  transition:color .12s ease,background-color .12s ease,border-color .12s ease,opacity .12s ease;
}
.rwa2-performance-item:hover:not(:disabled),
.rwa2-performance-item:focus-visible {
  border-color:rgba(255,255,255,.08);
  background:rgba(255,255,255,.022);
  color:rgba(255,255,255,.78);
  outline:none;
}
.rwa2-performance-item:disabled { opacity:.28; cursor:not-allowed; }
.rwa2-performance-dot { width:4px; height:4px; flex:0 0 4px; border-radius:50%; background:rgba(255,255,255,.28); }
.rwa2-performance-on {
  border-color:rgba(226,161,59,.24);
  background:linear-gradient(180deg,rgba(226,161,59,.085),rgba(226,161,59,.035));
  color:var(--rwa2-brand);
}
.rwa2-performance-on:hover:not(:disabled),
.rwa2-performance-on:focus-visible {
  border-color:rgba(226,161,59,.38);
  background:rgba(226,161,59,.09);
  color:var(--rwa2-brand-hover);
}
.rwa2-performance-on .rwa2-performance-dot { background:var(--rwa2-brand); box-shadow:0 0 7px rgba(226,161,59,.28); }
.rwa2-performance-key {
  min-width:0;
  overflow:hidden;
  color:currentColor;
  font-size:9.5px;
  line-height:1;
  font-weight:690;
  letter-spacing:.035em;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.rwa2-context-deck {
  position:relative;
  min-width:0;
  display:grid;
  gap:4px;
  overflow:visible;
  padding:5px 7px 4px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:9px;
  background:linear-gradient(180deg,rgba(255,255,255,.016),rgba(255,255,255,.005)),rgba(18,20,25,.78);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.02);
}
.rwa2-context-chips {
  min-width:0;
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  align-items:stretch;
  gap:5px;
  padding:0;
  border:0;
  overflow:visible;
}
.rwa2-context-chip {
  appearance:none;
  min-width:0;
  min-height:27px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:4px;
  padding:0 4px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:999px;
  background:rgba(255,255,255,.012);
  color:rgba(255,255,255,.43);
  font:580 10px/1 var(--rwa-host-font,system-ui,sans-serif);
  white-space:nowrap;
  cursor:pointer;
  transition:border-color .12s ease,background-color .12s ease,color .12s ease,transform .12s ease,opacity .12s ease;
}
.rwa2-context-chip:hover:not(:disabled),
.rwa2-context-chip:focus-visible { border-color:rgba(226,161,59,.35); background:rgba(226,161,59,.045); color:var(--rwa2-text); outline:none; }
.rwa2-context-chip:active:not(:disabled) { transform:translateY(1px); }
.rwa2-context-chip-icon { width:15px; height:15px; flex:0 0 15px; display:inline-grid; place-items:center; }
.rwa2-context-chip-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-context-chip-on { border-color:rgba(226,161,59,.48); background:rgba(226,161,59,.055); color:var(--rwa2-brand); box-shadow:inset 0 0 0 1px rgba(226,161,59,.025); }
.rwa2-context-chip-off { color:rgba(255,255,255,.38); }
.rwa2-context-chip:disabled { opacity:.28; cursor:not-allowed; }

.rwa2-context-adjust-row {
  min-height:30px;
  display:grid;
  grid-template-columns:minmax(0,.76fr) minmax(0,1.24fr);
  align-items:center;
  gap:12px;
  padding:1px 2px 0;
  border:0;
  border-radius:0;
  background:transparent;
}
.rwa2-context-depth {
  grid-column:1;
  min-width:0;
  display:grid;
  grid-template-columns:15px minmax(0,1fr) 43px;
  align-items:center;
  gap:6px;
  color:var(--rwa2-text-2);
  font-size:10.5px;
  font-weight:540;
}
.rwa2-adjust-icon { width:15px; height:15px; display:inline-grid; place-items:center; color:var(--rwa2-brand); }
.rwa2-adjust-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-depth-stepper {
  width:43px;
  height:24px;
  display:grid;
  grid-template-columns:minmax(0,1fr) 14px;
  align-items:stretch;
  overflow:hidden;
  border:1px solid var(--rwa2-border);
  border-radius:8px;
  background:var(--rwa2-surface);
  color:var(--rwa2-text);
}
.rwa2-depth-input {
  min-width:0;
  width:100%;
  height:100%;
  padding:0 2px 0 6px;
  border:0;
  outline:0;
  background:transparent;
  color:var(--rwa2-text);
  font:680 10.5px/1 var(--rwa-host-font,system-ui,sans-serif);
  font-variant-numeric:tabular-nums;
  text-align:center;
  -moz-appearance:textfield;
}
.rwa2-depth-input::-webkit-inner-spin-button,
.rwa2-depth-input::-webkit-outer-spin-button { margin:0; appearance:none; -webkit-appearance:none; }
.rwa2-depth-input:focus-visible { background:rgba(226,161,59,.04); }
.rwa2-depth-step-buttons {
  display:grid;
  grid-template-rows:1fr 1fr;
  border-left:1px solid rgba(255,255,255,.09);
}
.rwa2-depth-step {
  appearance:none;
  min-width:0;
  min-height:0;
  display:grid;
  place-items:center;
  padding:0;
  border:0;
  background:transparent;
  color:var(--rwa2-brand);
  cursor:pointer;
}
.rwa2-depth-step + .rwa2-depth-step { border-top:1px solid rgba(255,255,255,.08); }
.rwa2-depth-step:hover:not(:disabled),
.rwa2-depth-step:focus-visible { background:rgba(226,161,59,.08); outline:none; }
.rwa2-depth-step:disabled { opacity:.25; cursor:not-allowed; }

.rwa2-context-length {
  grid-column:2;
  min-width:0;
  display:grid;
  grid-template-columns:auto minmax(58px,1fr) auto;
  align-items:center;
  gap:6px;
}
.rwa2-length-label { display:inline-flex; align-items:center; gap:5px; color:var(--rwa2-text-2); font-size:10.5px; font-weight:540; white-space:nowrap; }
.rwa2-range {
  min-width:0;
  width:100%;
  height:12px;
  margin:0;
  appearance:none;
  -webkit-appearance:none;
  background:transparent;
  cursor:pointer;
  outline:none;
}
.rwa2-range:disabled { opacity:.28; cursor:not-allowed; }
.rwa2-context-length-off .rwa2-length-label { opacity:.56; }
.rwa2-range::-webkit-slider-runnable-track {
  height:3px;
  border-radius:99px;
  background:linear-gradient(90deg,rgba(226,161,59,.92) 0%,rgba(226,161,59,.92) var(--rwa2-range-fill,0%),rgba(255,255,255,.14) var(--rwa2-range-fill,0%),rgba(255,255,255,.14) 100%);
}
.rwa2-range::-webkit-slider-thumb {
  width:10px;
  height:10px;
  margin-top:-3.5px;
  appearance:none;
  -webkit-appearance:none;
  border:1px solid rgba(255,255,255,.16);
  border-radius:50%;
  background:var(--rwa2-brand);
  box-shadow:0 0 10px rgba(226,161,59,.20);
}
.rwa2-range::-moz-range-track {
  height:3px;
  border:0;
  border-radius:99px;
  background:rgba(255,255,255,.14);
}
.rwa2-range::-moz-range-progress {
  height:3px;
  border-radius:99px;
  background:rgba(226,161,59,.92);
}
.rwa2-range::-moz-range-thumb {
  width:10px;
  height:10px;
  border:1px solid rgba(255,255,255,.16);
  border-radius:50%;
  background:var(--rwa2-brand);
  box-shadow:0 0 10px rgba(226,161,59,.20);
}

.rwa2-length-toggle {
  appearance:none;
  min-width:40px;
  height:24px;
  padding:0 6px;
  border:1px solid var(--rwa2-border);
  border-radius:999px;
  background:var(--rwa2-surface);
  color:rgba(255,255,255,.58);
  font:700 9.5px/1 var(--rwa-host-font,system-ui,sans-serif);
  letter-spacing:.035em;
  cursor:pointer;
  transition:border-color .12s ease,background-color .12s ease,color .12s ease;
}
.rwa2-length-toggle:hover,
.rwa2-length-toggle:focus-visible { border-color:var(--rwa2-brand-border); color:var(--rwa2-brand); outline:none; }
.rwa2-length-toggle-on {
  border-color:rgba(226,161,59,.42);
  background:rgba(226,161,59,.07);
  color:var(--rwa2-brand);
}
.rwa2-length-toggle-off { color:rgba(255,255,255,.48); }

.rwa2-tooltip-token {
  width:min(254px,calc(100vw - 16px));
  max-width:min(254px,calc(100vw - 16px));
  display:grid;
  gap:5px;
  padding:8px 10px 9px;
  border-color:rgba(226,161,59,.30);
  border-radius:9px;
  background:radial-gradient(circle at 100% 0%,rgba(226,161,59,.07),transparent 42%),#15181d;
  box-shadow:0 16px 38px rgba(0,0,0,.54),inset 2px 0 0 rgba(226,161,59,.42),inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-tooltip-token-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.rwa2-tooltip-token-head > span { color:var(--rwa2-brand); font-size:10.6px; line-height:1.15; font-weight:760; }
.rwa2-tooltip-token-head > strong { color:rgba(255,255,255,.76); font-size:10px; font-weight:720; }
.rwa2-tooltip-token-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:3px 9px; }
.rwa2-tooltip-token-row { min-width:0; display:flex; align-items:center; justify-content:space-between; gap:6px; color:rgba(255,255,255,.72); font-size:10.2px; line-height:1.3; }
.rwa2-tooltip-token-row > span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-tooltip-token-row > strong { flex:0 0 auto; color:rgba(255,255,255,.86); font-weight:700; font-variant-numeric:tabular-nums; }
.rwa2-tooltip-token-note { color:var(--rwa2-subtle); font-size:9.8px; line-height:1.3; }

`;

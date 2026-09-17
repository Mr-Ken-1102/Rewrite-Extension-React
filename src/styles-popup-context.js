export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-context-rail {
  min-height: 96px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--rwa2-border);
  border-radius: 11px;
  background: var(--rwa2-surface);
  overflow: hidden;
}
.rwa2-context-region {
  min-width: 0;
  padding: 9px 10px;
}
.rwa2-context-region + .rwa2-context-region {
  border-left: 1px solid rgba(255,255,255,.055);
}
.rwa2-context-identity { grid-column: span 4; }
.rwa2-context-sources { grid-column: span 5; }
.rwa2-context-modifiers { grid-column: span 3; }

.rwa2-region-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rwa2-region-label-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.rwa2-info {
  appearance: none;
  width: 17px;
  height: 17px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--rwa2-border);
  border-radius: 50%;
  background: transparent;
  color: var(--rwa2-muted);
  font: 700 10px/1 system-ui, sans-serif;
  cursor: help;
}
.rwa2-info:hover { color: var(--rwa2-text); border-color: var(--rwa2-border-strong); }
.rwa2-target-chip {
  min-width: 0;
  max-width: 145px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 1px solid var(--rwa2-border);
  border-radius: 999px;
  background: var(--rwa2-surface-2);
  color: var(--rwa2-text-2);
  font-size: 9.25px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa2-target-dot { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; }
.rwa2-token-status {
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 9px;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 8px;
  background: rgba(0,0,0,.14);
  color: rgba(255,255,255,.70);
  font-size: 11.5px;
  line-height: 1;
  font-weight: 630;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rwa2-free-mode-row {
  min-height: 28px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.rwa2-free-note {
  min-width: 0;
  color: var(--rwa2-subtle);
  font-size: 8.75px;
  line-height: 1.2;
  text-align: right;
}
.rwa2-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 12px;
  margin-top: 4px;
}
.rwa2-source-grid > label,
.rwa2-free-mode-row > label {
  min-width: 0;
  min-height: 24px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 8px !important;
}
.rwa2-source-grid > label > span,
.rwa2-free-mode-row > label > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-popup .rwa-tog-wrap {
  width: 30px !important;
  height: 17px !important;
  flex: 0 0 30px !important;
}
.rwa2-popup .rwa-tog-sl { background: rgba(255,255,255,.15) !important; box-shadow: none !important; }
.rwa2-popup .rwa-tog-sl:before { width: 11px !important; height: 11px !important; left: 3px !important; bottom: 3px !important; }
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl {
  background: var(--rwa2-brand) !important;
  box-shadow: none !important;
}
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl:before { transform: translateX(13px) !important; }

.rwa2-one-shot {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,.045);
}
.rwa2-one-shot-label {
  padding-top: 4px;
  color: var(--rwa2-subtle);
  font-size: 9px;
  line-height: 1;
  white-space: nowrap;
}
.rwa2-one-shot-chips { min-width: 0; display: flex; flex-wrap: wrap; gap: 4px; }
.rwa2-chip {
  appearance: none;
  min-height: 20px;
  padding: 0 6px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 999px;
  background: rgba(255,255,255,.02);
  color: var(--rwa2-text-2);
  font: 600 8.5px/1 system-ui, sans-serif;
  cursor: pointer;
}
.rwa2-chip:hover { border-color: var(--rwa2-brand-border); color: var(--rwa2-brand); }
.rwa2-chip-off { opacity: .42; text-decoration: line-through; }

.rwa2-context-modifiers { display: flex; flex-direction: column; gap: 9px; }
.rwa2-length-row {
  display: grid;
  grid-template-columns: 30px auto minmax(48px, 1fr) 38px;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.rwa2-length-row > label { min-width: 30px; }
.rwa2-control-label {
  color: var(--rwa2-muted);
  font-size: 9.25px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
}
.rwa2-length-value {
  min-width: 38px;
  color: var(--rwa2-brand);
  font-size: 9.5px;
  font-weight: 700;
  text-align: right;
}
.rwa2-range {
  min-width: 0;
  width: 100%;
  height: 18px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}
.rwa2-range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 99px;
  background: rgba(255,255,255,.13);
}
.rwa2-range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  margin-top: -4.5px;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 50%;
  background: var(--rwa2-brand);
  box-shadow: none;
}
.rwa2-range:disabled { cursor: not-allowed; }
.rwa2-depth-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.rwa2-depth-input {
  width: 52px;
  min-width: 52px;
  height: 28px;
  margin: 0;
  padding: 3px 5px;
  border: 1px solid var(--rwa2-border);
  border-radius: 7px;
  outline: none;
  background: rgba(0,0,0,.18);
  color: var(--rwa2-text);
  font: 650 10px/1 system-ui, sans-serif;
  text-align: center;
}
.rwa2-depth-input:focus { border-color: var(--rwa2-brand-border); }
`;

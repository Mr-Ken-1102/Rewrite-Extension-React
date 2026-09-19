export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-context-rail {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0;
  align-items: stretch;
  min-width: 0;
  border: 1px solid rgba(209,154,69,.08);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.010)),
    var(--rwa2-surface);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
  overflow: hidden;
}
.rwa2-context-region {
  min-width: 0;
  padding: 6px 8px;
}
.rwa2-context-identity {
  grid-column: 1 / -1;
  min-height: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, auto);
  align-items: center;
  gap: 10px;
  padding-top: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}
.rwa2-context-sources {
  grid-column: span 8;
  border-right: 1px solid rgba(255,255,255,.055);
}
.rwa2-context-modifiers {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rwa2-region-head {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}
.rwa2-region-label-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}
.rwa2-info {
  appearance: none;
  width: 24px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 24px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--rwa2-muted);
  font: 700 10px/1 system-ui, sans-serif;
  cursor: help;
}
.rwa2-info:hover {
  color: var(--rwa2-text);
  border-color: var(--rwa2-border);
  background: rgba(255,255,255,.025);
}
.rwa2-target-chip {
  min-width: 0;
  max-width: 166px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 7px;
  border: 1px solid var(--rwa2-border);
  border-radius: 999px;
  background: var(--rwa2-surface-2);
  color: var(--rwa2-text-2);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa2-target-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
}
.rwa2-token-status {
  justify-self: end;
  min-width: 190px;
  max-width: 260px;
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 7px;
  background: rgba(0,0,0,.12);
  color: rgba(255,255,255,.68);
  font-size: 11px;
  line-height: 1;
  font-weight: 620;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rwa2-source-mode-grid {
  min-height: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  align-items: center;
  margin-top: 3px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa2-source-mode-item {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
}
.rwa2-source-mode-item > label {
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-start;
}
.rwa2-source-mode-item > label > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-mode-info {
  width: 20px;
  height: 20px;
  flex-basis: 20px;
  border-color: rgba(255,255,255,.06);
}
.rwa2-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 12px;
  margin-top: 2px;
}
.rwa2-source-grid > label {
  min-width: 0;
  min-height: 24px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 6px !important;
}
.rwa2-source-grid > label > span {
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
.rwa2-popup .rwa-tog-sl {
  background: rgba(255,255,255,.15) !important;
  box-shadow: none !important;
}
.rwa2-popup .rwa-tog-sl:before {
  width: 11px !important;
  height: 11px !important;
  left: 3px !important;
  bottom: 3px !important;
}
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl {
  background: var(--rwa2-brand) !important;
  box-shadow: none !important;
}
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl:before {
  transform: translateX(13px) !important;
}

.rwa2-context-applied {
  grid-column: 1 / -1;
  min-width: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 5px;
  padding-bottom: 5px;
  border-top: 1px solid rgba(255,255,255,.055);
  background: rgba(0,0,0,.055);
}
.rwa2-one-shot-label {
  flex: 0 0 auto;
  color: var(--rwa2-subtle);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}
.rwa2-one-shot-chips {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.rwa2-one-shot-chips::-webkit-scrollbar { display: none; }
.rwa2-chip {
  appearance: none;
  min-width: 0;
  max-width: 190px;
  min-height: 24px;
  flex: 0 1 auto;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 999px;
  background: rgba(255,255,255,.018);
  color: var(--rwa2-text-2);
  font: 600 10px/1 system-ui, sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.rwa2-chip:hover {
  border-color: var(--rwa2-brand-border);
  color: var(--rwa2-brand);
}
.rwa2-chip-off {
  opacity: .42;
  text-decoration: line-through;
}

.rwa2-length-row {
  min-width: 0;
  min-height: 28px;
  display: grid;
  grid-template-columns: 30px auto minmax(42px, 1fr) 36px;
  align-items: center;
  gap: 5px;
}
.rwa2-length-row > label { min-width: 30px; }
.rwa2-control-label {
  color: var(--rwa2-muted);
  font-size: 10px;
  line-height: 1;
  font-weight: 680;
  white-space: nowrap;
}
.rwa2-length-value {
  min-width: 36px;
  color: var(--rwa2-text-2);
  font-size: 10px;
  font-weight: 680;
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
  min-width: 0;
  min-height: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
  margin-top: 0;
  padding-top: 5px;
  border-top: 1px solid rgba(255,255,255,.045);
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
  background: rgba(0,0,0,.16);
  color: var(--rwa2-text);
  font: 650 10px/1 system-ui, sans-serif;
  text-align: center;
}
.rwa2-depth-input:focus { border-color: var(--rwa2-brand-border); }
`;

export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-performance-strip {
  min-height: 29px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  margin: 0 0 6px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,.009));
  overflow: hidden;
}
.rwa2-performance-item {
  appearance: none;
  position: relative;
  min-width: 0;
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: var(--rwa2-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color .10s ease, color .10s ease;
}
.rwa2-performance-item + .rwa2-performance-item {
  border-left: 1px solid rgba(255,255,255,.065);
}
.rwa2-performance-item:hover:not(:disabled),
.rwa2-performance-item:focus-visible {
  background: rgba(255,255,255,.025);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-performance-item:disabled {
  opacity: .40;
  cursor: not-allowed;
}
.rwa2-performance-key {
  flex: 0 0 auto;
  color: var(--rwa2-subtle);
  font-size: 8px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .08em;
}
.rwa2-performance-meta {
  min-width: 0;
  overflow: hidden;
  color: var(--rwa2-muted);
  font-size: 9px;
  line-height: 1;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-performance-on .rwa2-performance-key { color: var(--rwa2-brand); }
.rwa2-performance-on .rwa2-performance-meta { color: rgba(255,255,255,.74); }
.rwa2-performance-divider { display: none; }

.rwa2-context-deck {
  min-width: 0;
  border: 1px solid rgba(209,154,69,.085);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.020), rgba(255,255,255,.009)),
    var(--rwa2-surface);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
  overflow: hidden;
}
.rwa2-context-summary {
  min-width: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 7px;
}
.rwa2-context-summary-left {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 7px;
}
.rwa2-context-title {
  flex: 0 0 auto;
  color: var(--rwa2-muted);
  font-size: 9px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.rwa2-context-chips {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.rwa2-context-chips::-webkit-scrollbar { display: none; }
.rwa2-context-chip {
  appearance: none;
  min-height: 24px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 999px;
  background: rgba(255,255,255,.016);
  color: var(--rwa2-text-2);
  font: 650 9.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease, opacity .10s ease;
}
.rwa2-context-chip:hover,
.rwa2-context-chip:focus-visible {
  border-color: var(--rwa2-brand-border);
  background: rgba(209,154,69,.045);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-context-chip-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--rwa2-positive);
}
.rwa2-context-chip-off {
  opacity: .42;
  text-decoration: line-through;
}
.rwa2-context-chip-off .rwa2-context-chip-dot { background: rgba(255,255,255,.25); }

.rwa2-token-trigger {
  appearance: none;
  min-width: 0;
  max-width: 190px;
  min-height: 25px;
  flex: 0 1 auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: rgba(255,255,255,.66);
  font: 650 9.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease;
}
.rwa2-token-trigger > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa2-token-trigger:hover,
.rwa2-token-trigger:focus-visible,
.rwa2-context-deck-open .rwa2-token-trigger {
  border-color: rgba(209,154,69,.16);
  background: rgba(209,154,69,.035);
  color: var(--rwa2-brand);
  outline: none;
}
.rwa2-token-trigger svg {
  flex: 0 0 auto;
  transition: transform .16s ease;
}
.rwa2-context-deck-open .rwa2-token-trigger svg { transform: rotate(180deg); }

.rwa2-context-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
  transition: grid-template-rows .18s cubic-bezier(.2,.75,.2,1), opacity .12s ease;
}
.rwa2-context-deck-open .rwa2-context-collapse {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}
.rwa2-context-detail {
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,.05);
}
.rwa2-token-detail {
  padding: 7px 8px 6px;
  border-bottom: 1px solid rgba(255,255,255,.045);
  background: rgba(0,0,0,.055);
}
.rwa2-context-detail-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rwa2-context-detail-label {
  color: var(--rwa2-brand);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 830;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.rwa2-context-detail-total {
  color: var(--rwa2-text-2);
  font-size: 9.5px;
  font-weight: 700;
}
.rwa2-token-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 8px;
  margin-top: 6px;
}
.rwa2-token-detail-item {
  min-width: 0;
  display: grid;
  grid-template-columns: 5px minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  color: var(--rwa2-muted);
  font-size: 9px;
}
.rwa2-token-detail-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--rwa2-brand);
}
.rwa2-token-detail-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-token-detail-value {
  color: rgba(255,255,255,.70);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rwa2-token-detail-note,
.rwa2-token-detail-empty {
  margin-top: 5px;
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1.2;
}

.rwa2-context-control-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  gap: 10px;
  padding: 7px 8px 8px;
}
.rwa2-context-control-block { min-width: 0; }
.rwa2-context-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 8px;
  margin-top: 5px;
}
.rwa2-context-source-grid > label {
  min-width: 0;
  min-height: 23px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 5px !important;
}
.rwa2-context-source-grid > label > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-context-adjust {
  padding-left: 10px;
  border-left: 1px solid rgba(255,255,255,.045);
}
.rwa2-context-depth {
  min-height: 28px;
  display: grid;
  grid-template-columns: minmax(0,1fr) 48px;
  align-items: center;
  gap: 7px;
  margin-top: 3px;
  color: var(--rwa2-muted);
  font-size: 9.5px;
  font-weight: 650;
}
.rwa2-depth-input {
  width: 48px;
  min-width: 48px;
  height: 26px;
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
.rwa2-context-length {
  margin-top: 3px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,.04);
}
.rwa2-context-length-head {
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}
.rwa2-context-length-head > span {
  color: var(--rwa2-text-2);
  font-size: 9.5px;
  font-weight: 700;
}
.rwa2-range {
  min-width: 0;
  width: 100%;
  height: 17px;
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
.rwa2-range:disabled { cursor: not-allowed; opacity: .45; }

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
`;

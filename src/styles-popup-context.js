export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-performance-strip {
  min-height: 31px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  margin: 0 0 7px;
  padding: 0 0 6px;
  border-bottom: 1px solid rgba(255,255,255,.060);
}
.rwa2-performance-item {
  appearance: none;
  position: relative;
  min-width: 0;
  min-height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--rwa2-muted);
  font: inherit;
  cursor: pointer;
  transition: color .10s ease, background-color .10s ease, opacity .10s ease;
}
.rwa2-performance-item + .rwa2-performance-item {
  border-left: 1px solid rgba(255,255,255,.055);
}
.rwa2-performance-item:hover:not(:disabled),
.rwa2-performance-item:focus-visible {
  background: rgba(255,255,255,.018);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-performance-item:disabled {
  opacity: .36;
  cursor: not-allowed;
}
.rwa2-performance-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: rgba(255,255,255,.20);
}
.rwa2-performance-on .rwa2-performance-dot {
  background: var(--rwa2-brand);
  box-shadow: 0 0 8px rgba(209,154,69,.28);
}
.rwa2-performance-item:first-child.rwa2-performance-on .rwa2-performance-dot {
  background: var(--rwa2-positive);
  box-shadow: 0 0 8px rgba(119,200,167,.22);
}
.rwa2-performance-key {
  min-width: 0;
  overflow: hidden;
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .07em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-performance-meta {
  flex: 0 0 auto;
  color: var(--rwa2-muted);
  font-size: 9px;
  line-height: 1;
  font-weight: 640;
  white-space: nowrap;
}
.rwa2-performance-on .rwa2-performance-key { color: var(--rwa2-brand); }
.rwa2-performance-item:first-child.rwa2-performance-on .rwa2-performance-key { color: var(--rwa2-positive); }
.rwa2-performance-on .rwa2-performance-meta { color: rgba(255,255,255,.72); }
.rwa2-performance-divider { display: none; }

.rwa2-context-deck {
  position: relative;
  min-width: 0;
  border: 1px solid rgba(209,154,69,.085);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,.008)),
    var(--rwa2-surface);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.016);
}
.rwa2-context-summary {
  min-width: 0;
  min-height: 35px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 4px 5px 4px 7px;
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
  min-height: 25px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 999px;
  background: rgba(255,255,255,.014);
  color: var(--rwa2-text-2);
  font: 650 9.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease, opacity .10s ease;
}
.rwa2-context-chip:hover,
.rwa2-context-chip:focus-visible {
  border-color: var(--rwa2-brand-border);
  background: rgba(209,154,69,.040);
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
.rwa2-context-param-chip {
  border-style: dashed;
  color: rgba(255,255,255,.62);
}
.rwa2-context-chip-off {
  opacity: .42;
  text-decoration: line-through;
}
.rwa2-context-chip-off .rwa2-context-chip-dot { background: rgba(255,255,255,.24); }

.rwa2-context-summary-actions {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.rwa2-token-trigger {
  appearance: none;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: rgba(255,255,255,.68);
  font: 690 9.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease;
}
.rwa2-token-trigger:hover,
.rwa2-token-trigger:focus-visible,
.rwa2-token-trigger-open {
  border-color: rgba(209,154,69,.17);
  background: rgba(209,154,69,.038);
  color: var(--rwa2-brand);
  outline: none;
}
.rwa2-context-toggle {
  appearance: none;
  width: 27px;
  height: 27px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--rwa2-muted);
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease;
}
.rwa2-context-toggle:hover,
.rwa2-context-toggle:focus-visible {
  border-color: var(--rwa2-border);
  background: rgba(255,255,255,.025);
  color: var(--rwa2-brand);
  outline: none;
}
.rwa2-context-toggle svg { transition: transform .16s ease; }
.rwa2-context-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

.rwa2-token-popover {
  position: absolute;
  right: 31px;
  bottom: calc(100% + 7px);
  z-index: 4;
  width: min(300px, calc(100vw - 32px));
  display: grid;
  gap: 7px;
  padding: 10px 12px 11px;
  border: 1px solid rgba(209,154,69,.28);
  border-radius: 10px;
  background:
    radial-gradient(circle at 100% 0%, rgba(209,154,69,.075), transparent 42%),
    #17181e;
  color: var(--rwa2-text-2);
  box-shadow:
    0 16px 38px rgba(0,0,0,.54),
    inset 2px 0 0 rgba(209,154,69,.42),
    inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-token-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rwa2-token-popover-head > span {
  color: var(--rwa2-brand);
  font-size: 11.2px;
  line-height: 1.15;
  font-weight: 760;
}
.rwa2-token-popover-head > strong {
  color: rgba(255,255,255,.76);
  font-size: 10.5px;
  font-weight: 720;
}
.rwa2-token-popover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 4px 12px;
}
.rwa2-token-popover-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: rgba(255,255,255,.72);
  font-size: 11px;
  line-height: 1.35;
}
.rwa2-token-popover-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-token-popover-row > strong {
  flex: 0 0 auto;
  color: rgba(255,255,255,.86);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.rwa2-token-popover-note,
.rwa2-token-popover-empty {
  color: var(--rwa2-subtle);
  font-size: 10.5px;
  line-height: 1.35;
}

.rwa2-context-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
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
.rwa2-context-control-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  gap: 10px;
  padding: 7px 8px 8px;
}
.rwa2-context-control-block { min-width: 0; }
.rwa2-context-detail-label {
  color: var(--rwa2-brand);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 830;
  letter-spacing: .08em;
  text-transform: uppercase;
}
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

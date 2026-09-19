export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-context-shell {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(209,154,69,.08);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.020), rgba(255,255,255,.009)),
    var(--rwa2-surface);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}

.rwa2-context-summary {
  appearance: none;
  width: 100%;
  min-height: 31px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 9px;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,.045);
  background: transparent;
  color: var(--rwa2-text-2);
  font: inherit;
  cursor: pointer;
}
.rwa2-context-summary:hover,
.rwa2-context-summary:focus-visible {
  background: rgba(255,255,255,.018);
  outline: none;
}
.rwa2-context-summary-label {
  color: var(--rwa2-muted);
  font-size: 9.5px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.rwa2-context-summary-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,.66);
  font-size: 10px;
  line-height: 1;
  font-weight: 680;
}
.rwa2-context-summary-meta svg {
  transition: transform .18s ease;
}
.rwa2-context-summary[aria-expanded="true"] .rwa2-context-summary-meta svg {
  transform: rotate(180deg);
}

.rwa2-context-applied {
  min-width: 0;
  min-height: 31px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px 5px;
  background: rgba(0,0,0,.045);
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
  max-width: 150px;
  min-height: 23px;
  flex: 0 1 auto;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 999px;
  background: rgba(255,255,255,.018);
  color: var(--rwa2-text-2);
  font: 600 10px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color .10s ease, border-color .10s ease, opacity .10s ease;
}
.rwa2-chip:hover,
.rwa2-chip:focus-visible {
  border-color: var(--rwa2-brand-border);
  color: var(--rwa2-brand);
  outline: none;
}
.rwa2-chip-off {
  opacity: .40;
  text-decoration: line-through;
}

.rwa2-context-details {
  min-width: 0;
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
  border-top: 0 solid rgba(255,255,255,.045);
  transition:
    grid-template-rows .18s cubic-bezier(.2,.75,.2,1),
    opacity .14s ease,
    border-top-width .18s ease;
}
.rwa2-context-details-open {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
  border-top-width: 1px;
}
.rwa2-context-details-clip {
  min-height: 0;
  overflow: hidden;
}
.rwa2-context-details-inner {
  min-width: 0;
  padding: 7px 8px 8px;
}

.rwa2-token-details {
  min-width: 0;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa2-detail-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rwa2-region-label {
  color: var(--rwa2-muted);
  font-size: 9.5px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .075em;
  text-transform: uppercase;
}
.rwa2-token-total {
  color: var(--rwa2-brand);
  font-size: 10px;
  line-height: 1;
  font-weight: 720;
}
.rwa2-token-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 8px;
  margin-top: 6px;
}
.rwa2-token-detail-item {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  padding: 4px 6px;
  border: 1px solid rgba(255,255,255,.045);
  border-radius: 6px;
  background: rgba(0,0,0,.075);
  color: var(--rwa2-muted);
  font-size: 9.5px;
  line-height: 1;
}
.rwa2-token-detail-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-token-detail-item strong {
  flex: 0 0 auto;
  color: rgba(255,255,255,.72);
  font-size: 9.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.rwa2-token-detail-empty,
.rwa2-token-detail-note {
  margin-top: 5px;
  color: var(--rwa2-subtle);
  font-size: 9px;
  line-height: 1.25;
}
.rwa2-token-detail-note { margin-top: 6px; }

.rwa2-context-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, .85fr);
  gap: 0;
  align-items: stretch;
  min-width: 0;
  padding-top: 7px;
}
.rwa2-context-region {
  min-width: 0;
}
.rwa2-context-sources {
  padding-right: 10px;
  border-right: 1px solid rgba(255,255,255,.045);
}
.rwa2-context-modifiers {
  padding-left: 10px;
}
.rwa2-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 10px;
  margin-top: 4px;
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

.rwa2-depth-row {
  min-width: 0;
  min-height: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
}
.rwa2-control-label {
  color: var(--rwa2-muted);
  font-size: 10px;
  line-height: 1;
  font-weight: 680;
  white-space: nowrap;
}
.rwa2-depth-input {
  width: 48px;
  min-width: 48px;
  height: 27px;
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

.rwa2-length-row {
  min-width: 0;
  min-height: 29px;
  display: grid;
  grid-template-columns: 30px auto minmax(34px, 1fr) 34px;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,.04);
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
.rwa2-length-value {
  min-width: 34px;
  color: var(--rwa2-text-2);
  font-size: 9.5px;
  font-weight: 680;
  text-align: right;
}
`;

export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-live-rail {
  min-width: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  background:
    linear-gradient(90deg, rgba(209,154,69,.035), transparent 34%),
    rgba(255,255,255,.012);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa2-live-controls {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
}
.rwa2-live-control,
.rwa2-live-token {
  appearance: none;
  min-height: 25px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--rwa2-muted);
  font: inherit;
  cursor: pointer;
  transition: color .12s ease, border-color .12s ease, background-color .12s ease;
}
.rwa2-live-control:hover:not(:disabled),
.rwa2-live-control:focus-visible,
.rwa2-live-token:hover,
.rwa2-live-token:focus-visible {
  border-color: var(--rwa2-border);
  background: rgba(255,255,255,.025);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-live-control:disabled {
  opacity: .38;
  cursor: not-allowed;
}
.rwa2-live-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.22);
  box-shadow: 0 0 0 1px rgba(255,255,255,.03);
}
.rwa2-live-control-on .rwa2-live-dot {
  background: var(--rwa2-brand);
  box-shadow: 0 0 9px rgba(209,154,69,.30);
}
.rwa2-live-control:first-child.rwa2-live-control-on .rwa2-live-dot {
  background: var(--rwa2-positive);
  box-shadow: 0 0 9px rgba(119,200,167,.24);
}
.rwa2-live-key {
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 840;
  letter-spacing: .08em;
}
.rwa2-live-control-on .rwa2-live-key { color: var(--rwa2-brand); }
.rwa2-live-control:first-child.rwa2-live-control-on .rwa2-live-key { color: var(--rwa2-positive); }
.rwa2-live-label {
  color: var(--rwa2-muted);
  font-size: 9px;
  line-height: 1;
  font-weight: 620;
}
.rwa2-live-token {
  min-width: 0;
  max-width: 220px;
  flex: 0 1 auto;
  justify-content: flex-end;
  color: rgba(255,255,255,.64);
  font-size: 9.5px;
  font-weight: 650;
  white-space: nowrap;
}
.rwa2-live-token > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa2-live-token svg {
  flex: 0 0 auto;
  transition: transform .16s ease;
}
.rwa2-live-token-open {
  border-color: rgba(209,154,69,.15);
  background: rgba(209,154,69,.035);
  color: var(--rwa2-brand);
}
.rwa2-live-token-open svg { transform: rotate(180deg); }

.rwa2-recipe {
  min-width: 0;
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  border: 1px solid rgba(209,154,69,.075);
  border-radius: 10px;
  background:
    radial-gradient(circle at 0% 50%, rgba(209,154,69,.045), transparent 34%),
    rgba(0,0,0,.07);
}
.rwa2-recipe-title {
  flex: 0 0 auto;
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 840;
  letter-spacing: .10em;
  text-transform: uppercase;
}
.rwa2-recipe-chips {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: none;
}
.rwa2-recipe-chips::-webkit-scrollbar { display: none; }
.rwa2-recipe-chip {
  appearance: none;
  min-height: 25px;
  flex: 0 0 auto;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 999px;
  background: rgba(255,255,255,.018);
  color: var(--rwa2-text-2);
  font: 650 9.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  cursor: pointer;
  transition: color .10s ease, border-color .10s ease, background-color .10s ease, opacity .10s ease;
}
.rwa2-recipe-chip:hover,
.rwa2-recipe-chip:focus-visible {
  border-color: var(--rwa2-brand-border);
  background: rgba(209,154,69,.045);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-recipe-source::before {
  content: '';
  width: 5px;
  height: 5px;
  display: inline-block;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--rwa2-positive);
  vertical-align: 1px;
}
.rwa2-recipe-parameter {
  border-style: dashed;
  color: rgba(255,255,255,.63);
}
.rwa2-recipe-chip-off {
  opacity: .40;
  text-decoration: line-through;
}
.rwa2-recipe-chip-off::before { background: rgba(255,255,255,.25); }

.rwa2-inspector {
  min-width: 0;
  display: grid;
  grid-template-rows: 0fr;
  margin-top: -6px;
  opacity: 0;
  pointer-events: none;
  transition: grid-template-rows .20s cubic-bezier(.2,.75,.2,1), margin-top .20s ease, opacity .15s ease;
}
.rwa2-inspector-open {
  grid-template-rows: 1fr;
  margin-top: 0;
  opacity: 1;
  pointer-events: auto;
}
.rwa2-inspector-clip {
  min-height: 0;
  overflow: hidden;
}
.rwa2-inspector-panel {
  min-width: 0;
  padding: 9px;
  border: 1px solid rgba(209,154,69,.11);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,.008)),
    rgba(15,16,21,.94);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa2-inspector-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa2-inspector-kicker,
.rwa2-inspector-section-label {
  color: var(--rwa2-brand);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 840;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.rwa2-inspector-subtitle {
  margin-top: 3px;
  color: var(--rwa2-subtle);
  font-size: 9px;
  line-height: 1.2;
}
.rwa2-inspector-head-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.rwa2-inspector-total {
  color: var(--rwa2-text-2);
  font-size: 10px;
  font-weight: 720;
}
.rwa2-inspector-close {
  appearance: none;
  width: 26px;
  height: 26px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--rwa2-muted);
  cursor: pointer;
}
.rwa2-inspector-close:hover,
.rwa2-inspector-close:focus-visible {
  border-color: var(--rwa2-border);
  background: rgba(255,255,255,.025);
  color: var(--rwa2-text);
  outline: none;
}

.rwa2-inspector-token-block {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa2-token-composition {
  width: 100%;
  height: 5px;
  display: flex;
  gap: 2px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255,255,255,.035);
}
.rwa2-token-segment {
  min-width: 3px;
  border-radius: 99px;
  background: rgba(209,154,69,.78);
}
.rwa2-token-segment-character,
.rwa2-token-swatch-character { background: rgba(209,154,69,.70); }
.rwa2-token-segment-persona,
.rwa2-token-swatch-persona { background: rgba(119,200,167,.72); }
.rwa2-token-segment-lore,
.rwa2-token-swatch-lore { background: rgba(160,142,205,.68); }
.rwa2-token-segment-surrounding,
.rwa2-token-swatch-surrounding { background: rgba(117,159,203,.68); }
.rwa2-token-segment-history,
.rwa2-token-swatch-history { background: rgba(206,172,115,.58); }
.rwa2-token-segment-memory,
.rwa2-token-swatch-memory { background: rgba(151,171,150,.60); }
.rwa2-token-segment-speaker,
.rwa2-token-swatch-speaker { background: rgba(186,149,149,.58); }
.rwa2-token-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 8px;
  margin-top: 7px;
}
.rwa2-token-cell {
  min-width: 0;
  display: grid;
  grid-template-columns: 6px minmax(0,1fr) auto;
  align-items: center;
  gap: 5px;
  color: var(--rwa2-muted);
  font-size: 9px;
}
.rwa2-token-swatch {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(209,154,69,.82);
}
.rwa2-token-cell-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-token-cell-value {
  color: rgba(255,255,255,.70);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rwa2-inspector-note,
.rwa2-inspector-empty {
  margin-top: 6px;
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1.25;
}

.rwa2-inspector-controls {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr);
  gap: 12px;
  padding-top: 8px;
}
.rwa2-inspector-control-group {
  min-width: 0;
}
.rwa2-inspector-source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 3px 10px;
  margin-top: 6px;
}
.rwa2-inspector-source-grid > label {
  min-width: 0;
  min-height: 24px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 6px !important;
}
.rwa2-inspector-source-grid > label > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-inspector-parameters {
  padding-left: 11px;
  border-left: 1px solid rgba(255,255,255,.045);
}
.rwa2-inspector-depth {
  min-height: 30px;
  display: grid;
  grid-template-columns: minmax(0,1fr) 52px;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--rwa2-muted);
  font-size: 9.5px;
  font-weight: 650;
}
.rwa2-depth-input {
  width: 52px;
  min-width: 52px;
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
.rwa2-inspector-length {
  margin-top: 4px;
  padding-top: 5px;
  border-top: 1px solid rgba(255,255,255,.04);
}
.rwa2-inspector-length-head {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rwa2-inspector-length-head > span {
  color: var(--rwa2-text-2);
  font-size: 9.5px;
  font-weight: 700;
}
.rwa2-range {
  min-width: 0;
  width: 100%;
  height: 18px;
  margin: 1px 0 0;
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

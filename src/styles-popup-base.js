import {
  POPUP_DESKTOP_WIDTH,
  POPUP_OUTER_PADDING_X,
  POPUP_PROFILE_ROW_GAP,
} from './popupGeometry';

export const RWA_POPUP_BASE_CSS = `
:host {
  --rwa2-brand: #d19a45;
  --rwa2-brand-hover: #dca756;
  --rwa2-brand-soft: rgba(209, 154, 69, .09);
  --rwa2-brand-border: rgba(209, 154, 69, .24);
  --rwa2-bg: #111217;
  --rwa2-surface: #17181e;
  --rwa2-surface-2: #1b1c22;
  --rwa2-surface-hover: #202127;
  --rwa2-border: rgba(255,255,255,.08);
  --rwa2-border-strong: rgba(255,255,255,.14);
  --rwa2-text: rgba(255,255,255,.94);
  --rwa2-text-2: rgba(255,255,255,.74);
  --rwa2-muted: rgba(255,255,255,.54);
  --rwa2-subtle: rgba(255,255,255,.36);
  --rwa2-positive: #77c8a7;
  --rwa2-danger: #ff6b78;
}

.rwa2-popup,
.rwa2-popup * {
  box-sizing: border-box;
}

.rwa2-popup {
  position: fixed;
  z-index: 10000;
  width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  min-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  max-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 7px ${POPUP_OUTER_PADDING_X}px 8px;
  border: 1px solid var(--rwa2-border);
  border-radius: 14px;
  background:
    radial-gradient(circle at 12% -18%, rgba(209,154,69,.10), transparent 32%),
    linear-gradient(180deg, rgba(255,255,255,.012), transparent 30%),
    var(--rwa2-bg);
  color: var(--rwa2-text-2);
  box-shadow: 0 22px 58px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.04);
  font-family: var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  contain: layout paint style;
  isolation: isolate;
}

.rwa2-workbench { display: contents; }

.rwa2-toolbar {
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 1px;
  border-bottom: 1px solid rgba(255,255,255,.045);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.rwa2-toolbar:active { cursor: grabbing; }
.rwa2-brand { display: flex; align-items: center; gap: 7px; min-width: 0; }
.rwa2-brand-title {
  color: var(--rwa2-brand);
  font-size: 12px;
  line-height: 1;
  font-weight: 760;
  letter-spacing: .055em;
}
.rwa2-version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 6px;
  border: 1px solid var(--rwa2-brand-border);
  border-radius: 999px;
  background: var(--rwa2-brand-soft);
  color: var(--rwa2-brand);
  font-size: 9px;
  font-weight: 780;
}
.rwa2-toolbar-actions {
  min-width: 0;
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}
.rwa2-identity-chip {
  appearance: none;
  min-width: 0;
  max-width: min(250px, 44vw);
  height: 22px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-right: 3px;
  padding: 0 8px;
  border: 1px solid var(--rwa2-brand-border);
  border-radius: 999px;
  background: rgba(209,154,69,.055);
  color: var(--rwa2-brand);
  font: inherit;
  cursor: pointer;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease;
}
.rwa2-identity-chip:hover,
.rwa2-identity-chip:focus-visible {
  border-color: rgba(209,154,69,.38);
  background: rgba(209,154,69,.10);
  color: var(--rwa2-brand-hover);
  outline: none;
}
.rwa2-identity-chip-mark {
  flex: 0 0 auto;
  font-size: 9px;
  line-height: 1;
}
.rwa2-identity-chip-text {
  min-width: 0;
  overflow: hidden;
  font-size: 9.5px;
  line-height: 1;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-icon-button {
  appearance: none;
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--rwa2-muted);
  cursor: pointer;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease;
}
.rwa2-icon-button:hover:not(:disabled) {
  background: var(--rwa2-surface-hover);
  border-color: var(--rwa2-border);
  color: var(--rwa2-text);
}
.rwa2-icon-button-active {
  background: var(--rwa2-brand-soft);
  border-color: var(--rwa2-brand-border);
  color: var(--rwa2-brand);
}
.rwa2-icon-button:disabled { opacity: .28; cursor: not-allowed; }

.rwa2-rewrite {
  min-width: 0;
  padding: 7px;
  border: 1px solid rgba(209,154,69,.10);
  border-radius: 11px;
  background:
    radial-gradient(circle at 92% -18%, rgba(209,154,69,.055), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.010));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.022);
}
.rwa2-section-head {
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 4px;
}
.rwa2-kicker { display: none; }
.rwa2-region-label {
  color: var(--rwa2-muted);
  font-size: 9.5px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.rwa2-section-title {
  margin: 0;
  color: var(--rwa2-text);
  font-size: 11.5px;
  line-height: 1.15;
  font-weight: 690;
}
.rwa2-section-meta {
  color: var(--rwa2-subtle);
  font-size: 9.5px;
  line-height: 1;
  white-space: nowrap;
}

.rwa2-performance-strip {
  min-height: 29px;
  display: grid;
  grid-template-columns: minmax(0,1fr) 1px minmax(0,1fr);
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,.009));
}
.rwa2-performance-item {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 7px;
  overflow: hidden;
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
.rwa2-performance-on .rwa2-performance-key {
  color: var(--rwa2-brand);
}
.rwa2-performance-on .rwa2-performance-meta {
  color: rgba(255,255,255,.72);
}
.rwa2-performance-divider {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,.065);
}

.rwa2-popup .rwa2-profile-btn,
.rwa2-popup .rwa2-action {
  box-shadow: none !important;
  transform: none !important;
  filter: none !important;
}
.rwa2-multi-notice {
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 8px;
  background: rgba(255,255,255,.016);
  color: var(--rwa2-muted);
  font-size: 10px;
  line-height: 1.25;
}
.rwa2-status-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--rwa2-brand);
}

.rwa2-profile-grid {
  display: grid;
  gap: ${POPUP_PROFILE_ROW_GAP}px 6px;
  min-width: 0;
  margin: 0;
  padding: 0 2px 1px 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.14) transparent;
}
.rwa2-profile-grid::-webkit-scrollbar { width: 5px; }
.rwa2-profile-grid::-webkit-scrollbar-track { background: transparent; }
.rwa2-profile-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,.13); border-radius: 99px; }
.rwa2-cols-1 { grid-template-columns: minmax(0, 1fr); }
.rwa2-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.rwa2-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.rwa2-cols-4 { grid-template-columns: repeat(4, minmax(140px, 1fr)); }
.rwa2-profile-grid-compact.rwa2-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.rwa2-profile-grid-compact.rwa2-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }

.rwa2-popup .rwa2-profile-btn {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 30px !important;
  height: 30px !important;
  justify-content: flex-start !important;
  margin: 0 !important;
  padding: 0 10px !important;
  border: 1px solid var(--rwa2-border) !important;
  border-radius: 8px !important;
  background: var(--rwa2-surface) !important;
  color: var(--rwa2-text-2) !important;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease !important;
}
.rwa2-popup .rwa2-profile-btn:hover:not(:disabled) {
  background: var(--rwa2-surface-hover) !important;
  border-color: var(--rwa2-brand-border) !important;
  color: var(--rwa2-text) !important;
}

.rwa2-profile-name {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 11.5px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: .005em;
}

.rwa2-actionbar {
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 5px;
  border-top: 1px solid rgba(255,255,255,.045);
}
.rwa2-popup .rwa2-action {
  min-width: 0 !important;
  min-height: 32px !important;
  height: 32px !important;
  margin: 0 !important;
  padding: 0 10px !important;
  border: 1px solid var(--rwa2-border) !important;
  border-radius: 8px !important;
  background: var(--rwa2-surface) !important;
  color: var(--rwa2-text-2) !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease, opacity .10s ease !important;
}
.rwa2-popup .rwa2-action:hover:not(:disabled) {
  background: var(--rwa2-surface-hover) !important;
  border-color: var(--rwa2-border-strong) !important;
  color: var(--rwa2-text) !important;
}
.rwa2-popup .rwa2-action:disabled { opacity: .20 !important; }
.rwa2-popup .rwa2-undo,
.rwa2-popup .rwa2-redo {
  flex: 0 0 32px;
  width: 32px !important;
  padding: 0 !important;
}
.rwa2-popup .rwa2-custom {
  flex: 1 1 auto;
  width: auto !important;
  margin-left: 4px !important;
  color: var(--rwa2-brand) !important;
  border-color: var(--rwa2-brand-border) !important;
  background: var(--rwa2-brand-soft) !important;
}
.rwa2-popup .rwa2-settings {
  flex: 0 0 128px;
  width: 128px !important;
}
.rwa2-action-icon { font-size: 14px; line-height: 1; }

.rwa2-tooltip {
  position: fixed;
  z-index: 10006;
  max-width: 240px;
  padding: 8px 10px;
  border: 1px solid var(--rwa2-brand-border);
  border-radius: 8px;
  background: #17181e;
  color: var(--rwa2-text);
  box-shadow: 0 12px 32px rgba(0,0,0,.48);
  font: 10px/1.45 var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity .08s ease, transform .08s ease;
  white-space: pre-wrap;
}
.rwa2-tooltip-preset {
  width: min(320px, calc(100vw - 16px));
  max-width: min(320px, calc(100vw - 16px));
  display: grid;
  gap: 7px;
  padding: 10px 12px 11px;
  border-color: rgba(209,154,69,.28);
  border-radius: 10px;
  background:
    radial-gradient(circle at 100% 0%, rgba(209,154,69,.075), transparent 42%),
    #17181e;
  box-shadow:
    0 16px 38px rgba(0,0,0,.54),
    inset 2px 0 0 rgba(209,154,69,.42),
    inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-tooltip-preset-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rwa2-tooltip-preset-name {
  min-width: 0;
  overflow: hidden;
  color: var(--rwa2-brand);
  font-size: 11.2px;
  line-height: 1.15;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-tooltip-preset-meta {
  flex: 0 0 auto;
  color: var(--rwa2-subtle);
  font-size: 8px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .09em;
}
.rwa2-tooltip-preset-copy {
  max-height: 132px;
  overflow: hidden;
  color: rgba(255,255,255,.80);
  font-size: 11.5px;
  line-height: 1.48;
  white-space: pre-wrap;
}
.rwa2-tooltip-show {
  opacity: 1;
  visibility: visible;
}
.rwa2-tooltip-preset.rwa2-tooltip-show {
  transform: translateY(-1px);
}
`;

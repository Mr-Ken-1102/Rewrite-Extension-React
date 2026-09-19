import {
  POPUP_DESKTOP_WIDTH,
  POPUP_OUTER_PADDING_X,
  POPUP_PROFILE_ROW_GAP,
  POPUP_NORMAL_MIN_CELL,
} from './popupGeometry';

export const RWA_POPUP_BASE_CSS = `
:host {
  --rwa2-brand: #e2a13b;
  --rwa2-brand-hover: #efb24c;
  --rwa2-brand-soft: rgba(226,161,59,.10);
  --rwa2-brand-soft-2: rgba(226,161,59,.055);
  --rwa2-brand-border: rgba(226,161,59,.34);
  --rwa2-bg: #101216;
  --rwa2-surface: #15181d;
  --rwa2-surface-2: #191c22;
  --rwa2-surface-hover: #1d2127;
  --rwa2-border: rgba(255,255,255,.105);
  --rwa2-border-strong: rgba(255,255,255,.18);
  --rwa2-text: rgba(255,255,255,.94);
  --rwa2-text-2: rgba(255,255,255,.78);
  --rwa2-muted: rgba(255,255,255,.57);
  --rwa2-subtle: rgba(255,255,255,.35);
  --rwa2-positive: #77c8a7;
  --rwa2-danger: #ff6b78;
}

.rwa2-popup,
.rwa2-popup * { box-sizing: border-box; }

.rwa2-popup {
  position: fixed;
  z-index: 10000;
  width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  min-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  max-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px));
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 10px ${POPUP_OUTER_PADDING_X}px 11px;
  border: 1px solid rgba(226,161,59,.24);
  border-radius: 15px;
  background:
    radial-gradient(circle at 94% 0%, rgba(226,161,59,.055), transparent 24%),
    radial-gradient(circle at 4% 0%, rgba(255,255,255,.025), transparent 20%),
    linear-gradient(180deg, #111318 0%, #0f1115 100%);
  color: var(--rwa2-text-2);
  box-shadow:
    0 24px 64px rgba(0,0,0,.58),
    inset 0 1px 0 rgba(255,255,255,.045),
    inset 0 0 0 1px rgba(0,0,0,.18);
  font-family: var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  contain: layout paint style;
  isolation: isolate;
}

.rwa2-workbench { display: contents; }

.rwa2-toolbar {
  min-height: 45px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 1px 1px 8px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.rwa2-toolbar:active { cursor: grabbing; }
.rwa2-brand { display:flex; align-items:center; gap:9px; min-width:0; }
.rwa2-brand-mark {
  flex:0 0 auto;
  display:inline-grid;
  place-items:center;
  color:var(--rwa2-brand);
  filter:drop-shadow(0 0 8px rgba(226,161,59,.18));
}
.rwa2-brand-title {
  color:var(--rwa2-text);
  font-size:17px;
  line-height:1;
  font-weight:740;
  letter-spacing:-.015em;
  white-space:nowrap;
}
.rwa2-version {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height:26px;
  padding:0 10px;
  border:1px solid var(--rwa2-border);
  border-radius:999px;
  background:rgba(255,255,255,.018);
  color:rgba(255,255,255,.67);
  font-size:10px;
  font-weight:650;
  letter-spacing:.02em;
}
.rwa2-toolbar-actions {
  min-width:0;
  flex:0 1 auto;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:7px;
}
.rwa2-icon-button {
  appearance:none;
  width:34px;
  height:34px;
  display:inline-grid;
  place-items:center;
  padding:0;
  border:1px solid var(--rwa2-border);
  border-radius:9px;
  background:rgba(255,255,255,.014);
  color:rgba(255,255,255,.74);
  cursor:pointer;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
  transition:background-color .12s ease,border-color .12s ease,color .12s ease,transform .12s ease;
}
.rwa2-icon-button:hover:not(:disabled) {
  background:var(--rwa2-surface-hover);
  border-color:var(--rwa2-brand-border);
  color:var(--rwa2-brand);
}
.rwa2-icon-button:active:not(:disabled) { transform:translateY(1px); }
.rwa2-icon-button-active {
  background:var(--rwa2-brand-soft);
  border-color:var(--rwa2-brand-border);
  color:var(--rwa2-brand);
}
.rwa2-icon-button:disabled { opacity:.28; cursor:not-allowed; }

.rwa2-status-row {
  min-height:39px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:1px 4px 7px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.rwa2-status-identity-slot {
  min-width:0;
  flex:1 1 auto;
  display:flex;
  align-items:center;
}
.rwa2-identity-chip {
  min-width:0;
  max-width:min(76%,330px);
  height:31px;
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:0 12px;
  border:1px solid rgba(226,161,59,.40);
  border-radius:999px;
  background:linear-gradient(180deg,rgba(226,161,59,.075),rgba(226,161,59,.035));
  color:var(--rwa2-brand);
  font:660 12px/1 var(--rwa-host-font,system-ui,sans-serif);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-identity-persona {
  border-color:rgba(118,175,226,.34);
  background:linear-gradient(180deg,rgba(118,175,226,.07),rgba(118,175,226,.03));
  color:#84b8e8;
}
.rwa2-identity-chip:not(.rwa2-identity-profile-ready) {
  color:rgba(255,255,255,.78);
  box-shadow:none;
}
.rwa2-identity-profile-ready {
  box-shadow:0 0 12px rgba(226,161,59,.12),inset 0 1px 0 rgba(255,255,255,.035);
}
.rwa2-identity-persona.rwa2-identity-profile-ready {
  box-shadow:0 0 12px rgba(118,175,226,.13),inset 0 1px 0 rgba(255,255,255,.035);
}
.rwa2-identity-mark {
  flex:0 0 auto;
  display:inline-grid;
  place-items:center;
  color:currentColor;
}
.rwa2-identity-dot {
  width:5px;
  height:5px;
  border-radius:50%;
  background:currentColor;
  opacity:.7;
}
.rwa2-identity-copy {
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.rwa2-token-trigger {
  appearance:none;
  min-height:31px;
  flex:0 0 auto;
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:0 3px 0 12px;
  border:0;
  border-left:1px solid rgba(255,255,255,.10);
  border-radius:0;
  background:transparent;
  color:rgba(255,255,255,.84);
  font:650 13px/1 var(--rwa-host-font,system-ui,sans-serif);
  white-space:nowrap;
  cursor:help;
  transition:color .12s ease;
}
.rwa2-token-trigger:hover,
.rwa2-token-trigger:focus-visible { color:var(--rwa2-brand); outline:none; }
.rwa2-token-value { font-variant-numeric:tabular-nums; }

.rwa2-rewrite {
  min-width:0;
  display:grid;
  gap:9px;
  padding:0;
  border:0;
  background:transparent;
  box-shadow:none;
}
.rwa2-section-head,.rwa2-kicker { display:none; }

.rwa2-popup .rwa2-profile-btn,
.rwa2-popup .rwa2-action {
  box-shadow:none !important;
  transform:none !important;
  filter:none !important;
}
.rwa2-multi-notice {
  min-height:30px;
  display:flex;
  align-items:center;
  gap:7px;
  margin:0;
  padding:0 10px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:10px;
  background:rgba(255,255,255,.018);
  color:var(--rwa2-muted);
  font-size:10px;
  line-height:1.25;
}
.rwa2-status-dot {
  width:5px;
  height:5px;
  flex:0 0 auto;
  border-radius:50%;
  background:var(--rwa2-brand);
}

.rwa2-profile-grid {
  display:grid;
  gap:${POPUP_PROFILE_ROW_GAP}px 8px;
  min-width:0;
  margin:0;
  padding:0;
  overflow-y:auto;
  overscroll-behavior:contain;
  scrollbar-width:thin;
  scrollbar-color:rgba(255,255,255,.14) transparent;
}
.rwa2-profile-grid::-webkit-scrollbar { width:5px; }
.rwa2-profile-grid::-webkit-scrollbar-track { background:transparent; }
.rwa2-profile-grid::-webkit-scrollbar-thumb { background:rgba(255,255,255,.13); border-radius:99px; }
.rwa2-cols-1 { grid-template-columns:minmax(0,1fr); }
.rwa2-cols-2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.rwa2-cols-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
.rwa2-cols-4 { grid-template-columns:repeat(4,minmax(${POPUP_NORMAL_MIN_CELL}px,1fr)); }
.rwa2-profile-grid-compact.rwa2-cols-5 { grid-template-columns:repeat(5,minmax(0,1fr)); }
.rwa2-profile-grid-compact.rwa2-cols-6 { grid-template-columns:repeat(6,minmax(0,1fr)); }

.rwa2-popup .rwa2-profile-btn,
.rwa2-profile-placeholder {
  width:100% !important;
  min-width:0 !important;
  min-height:54px !important;
  height:54px !important;
  margin:0 !important;
  border-radius:10px !important;
}
.rwa2-popup .rwa2-profile-btn {
  justify-content:flex-start !important;
  gap:11px !important;
  padding:0 14px !important;
  border:1px solid rgba(255,255,255,.105) !important;
  background:linear-gradient(180deg,rgba(255,255,255,.017),rgba(255,255,255,.006)),var(--rwa2-surface) !important;
  color:var(--rwa2-text-2) !important;
  transition:background-color .12s ease,border-color .12s ease,color .12s ease,transform .12s ease !important;
}
.rwa2-popup .rwa2-profile-btn:hover:not(:disabled) {
  background:linear-gradient(180deg,rgba(226,161,59,.04),rgba(255,255,255,.008)),var(--rwa2-surface-hover) !important;
  border-color:rgba(226,161,59,.38) !important;
  color:var(--rwa2-text) !important;
}
.rwa2-popup .rwa2-profile-btn:active:not(:disabled) { transform:translateY(1px) !important; }
.rwa2-profile-icon {
  width:22px;
  height:22px;
  flex:0 0 22px;
  display:inline-grid;
  place-items:center;
  color:var(--rwa2-brand);
}
.rwa2-profile-name {
  min-width:0;
  overflow:hidden;
  color:rgba(255,255,255,.90);
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:left;
  font-size:12px;
  line-height:1.15;
  font-weight:560;
  letter-spacing:-.005em;
}
.rwa2-profile-placeholder {
  display:grid;
  place-items:center;
  border:1px dashed rgba(255,255,255,.13);
  background:rgba(255,255,255,.006);
  color:rgba(255,255,255,.20);
  font-size:26px;
  font-weight:250;
}

.rwa2-actionbar {
  min-height:48px;
  display:grid;
  grid-template-columns:72px 72px minmax(0,1fr) 44px;
  align-items:center;
  gap:8px;
  padding-top:9px;
  border-top:1px solid rgba(255,255,255,.075);
}
.rwa2-popup .rwa2-action {
  min-width:0 !important;
  min-height:39px !important;
  height:39px !important;
  margin:0 !important;
  padding:0 11px !important;
  border:1px solid var(--rwa2-border) !important;
  border-radius:9px !important;
  background:rgba(255,255,255,.012) !important;
  color:var(--rwa2-text-2) !important;
  font-size:11px !important;
  font-weight:560 !important;
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:7px !important;
  transition:background-color .12s ease,border-color .12s ease,color .12s ease,opacity .12s ease !important;
}
.rwa2-popup .rwa2-action:hover:not(:disabled) {
  background:var(--rwa2-surface-hover) !important;
  border-color:var(--rwa2-border-strong) !important;
  color:var(--rwa2-text) !important;
}
.rwa2-popup .rwa2-action:disabled { opacity:.28 !important; }
.rwa2-popup .rwa2-undo,
.rwa2-popup .rwa2-redo { width:auto !important; flex:none; padding:0 8px !important; }
.rwa2-popup .rwa2-custom {
  width:auto !important;
  margin:0 !important;
  color:var(--rwa2-brand) !important;
  border-color:rgba(226,161,59,.48) !important;
  background:radial-gradient(circle at 58% 0%,rgba(226,161,59,.11),transparent 58%),rgba(226,161,59,.055) !important;
}
.rwa2-popup .rwa2-custom:hover:not(:disabled) {
  border-color:rgba(226,161,59,.70) !important;
  background:rgba(226,161,59,.09) !important;
}
.rwa2-custom-icon { color:var(--rwa2-brand); }
.rwa2-popup .rwa2-settings {
  width:44px !important;
  padding:0 !important;
  color:rgba(255,255,255,.70) !important;
}
.rwa2-popup .rwa2-settings:hover:not(:disabled) {
  color:var(--rwa2-brand) !important;
  border-color:var(--rwa2-brand-border) !important;
  background:var(--rwa2-brand-soft) !important;
}
.rwa2-action-icon { flex:0 0 auto; display:inline-grid; place-items:center; line-height:1; }

.rwa2-tooltip {
  position:fixed;
  z-index:10006;
  max-width:240px;
  padding:8px 10px;
  border:1px solid var(--rwa2-brand-border);
  border-radius:9px;
  background:#15181d;
  color:var(--rwa2-text);
  box-shadow:0 14px 34px rgba(0,0,0,.52);
  font:10px/1.45 var(--rwa-host-font,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);
  pointer-events:none;
  opacity:0;
  visibility:hidden;
  transition:opacity .09s ease,transform .09s ease;
  white-space:pre-wrap;
}
.rwa2-tooltip-preset {
  width:min(320px,calc(100vw - 16px));
  max-width:min(320px,calc(100vw - 16px));
  display:grid;
  gap:7px;
  padding:10px ${POPUP_OUTER_PADDING_X}px 11px;
  border-color:rgba(226,161,59,.30);
  background:radial-gradient(circle at 100% 0%,rgba(226,161,59,.075),transparent 42%),#15181d;
  box-shadow:0 16px 38px rgba(0,0,0,.54),inset 2px 0 0 rgba(226,161,59,.42),inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-tooltip-preset-head { min-width:0; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.rwa2-tooltip-preset-name { min-width:0; overflow:hidden; color:var(--rwa2-brand); font-size:11.2px; line-height:1.15; font-weight:760; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-tooltip-preset-meta { flex:0 0 auto; color:var(--rwa2-subtle); font-size:8px; line-height:1; font-weight:800; letter-spacing:.09em; }
.rwa2-tooltip-preset-copy { max-height:132px; overflow:hidden; color:rgba(255,255,255,.80); font-size:11.5px; line-height:1.48; white-space:pre-wrap; }
.rwa2-tooltip-show { opacity:1; visibility:visible; }
.rwa2-tooltip-preset.rwa2-tooltip-show { transform:translateY(-1px); }

`;

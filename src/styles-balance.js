export const RWA_BALANCE_CSS = `
/* v3.0.1 live-smoke balance/hardening overrides. Keep these isolated from the
   legacy premium stylesheet so layout fixes stay reviewable and reversible. */

.rwa, .rwa-win, .rwa-err-window { box-sizing: border-box; }

/* Popup proportions */
.rwa-popup-main {
  width: min(430px, calc(100vw - 24px));
  min-width: min(430px, calc(100vw - 24px)) !important;
  max-width: min(430px, calc(100vw - 24px));
  padding: 14px 14px 12px;
  gap: 8px !important;
}
.rwa-header-drag-zone { margin: -4px -2px 0; padding: 6px 2px 4px; touch-action: none; }
.rwa-header-drag-zone::before { left: -12px; right: -12px; top: -10px; }
.rwa-drag-handle { top: 0; min-height: 24px; }
.rwa-mini-title { font-size: 11.5px; letter-spacing: .09em; }
.rwa-mini-actions { gap: 6px; }
.rwa-mini-action { width: 26px; height: 24px; }

.rwa-profile-grid {
  gap: 7px !important;
  margin: 0 !important;
  padding: 2px 2px 6px !important;
  scrollbar-gutter: stable;
}
.rwa-profile-btn { height: 34px !important; padding: 0 10px !important; }
.rwa-profile-name { font-size: 11.25px; line-height: 1.15; text-align: left; }

.rwa-radar-header { min-height: 24px; gap: 10px; }
.rwa-radar-title { min-width: 0; white-space: nowrap; }
.rwa-radar-target { min-width: 128px; justify-content: center; white-space: nowrap; }
.rwa-token-panel { padding: 4px 1px 7px; min-height: 20px; }
.rwa-panel-compact { padding: 8px 10px; border-radius: 9px; }
.rwa-context-primary { display: flex; align-items: center; min-height: 24px; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.05); }
.rwa-context-switch-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 7px 14px; align-items: center; }
.rwa-context-switch-grid > * { min-width: 0; }
.rwa-merged-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
.rwa-length-side { min-width: 0; padding-right: 0; }
.rwa-depth-side { min-width: 82px; }
.rwa-popup-foot { display: grid !important; grid-template-columns: 34px 34px minmax(0,1fr) minmax(0,1fr); gap: 7px !important; }
.rwa-btn-icon-square, .rwa-btn-custom, .rwa-btn-settings { width: 100% !important; margin: 0 !important; }

/* Settings modal: fixed rhythm and equal tab geometry */
.rwa-settings-win {
  width: min(700px, calc(100vw - 28px)) !important;
  max-width: min(700px, calc(100vw - 28px)) !important;
  height: min(760px, calc(100vh - 28px));
  max-height: min(760px, calc(100vh - 28px));
}
.rwa-settings-hdr { min-height: 62px; padding: 16px 22px; }
.rwa-settings-tabs {
  display: grid !important;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 7px !important;
  padding: 0 22px !important;
  margin-top: 10px !important;
}
.rwa-settings-tabs .rwa-tab-btn {
  min-width: 0;
  min-height: 54px;
  padding: 8px 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.22;
  white-space: normal;
}
.rwa-settings-body {
  flex: 1 1 auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  padding: 18px 22px 20px !important;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}
.rwa-settings-foot {
  display: grid !important;
  gap: 9px !important;
  padding: 12px 20px !important;
  margin-top: 0 !important;
}
.rwa-settings-foot-four { grid-template-columns: repeat(4, minmax(0,1fr)); }
.rwa-settings-foot-two { grid-template-columns: repeat(2, minmax(0,1fr)); }
.rwa-settings-foot > .rwa-btn { width: 100%; min-width: 0; min-height: 38px; margin: 0; }

/* Preset editor list: pointer-based reorder with stable hit targets */
.rwa-section-kicker { font-size: 11.5px; font-weight: 800; color: var(--rwa-primary); margin-bottom: 10px; }
.rwa-profile-search { margin: 0 0 8px !important; font-size: 12px !important; }
.rwa-profile-summary { font-size: 10px; opacity: .58; margin-bottom: 10px; line-height: 1.4; }
.rwa-profile-list { display: flex; flex-direction: column; gap: 7px; padding-bottom: 10px; min-height: 50px; }
.rwa-profile-row {
  display: grid !important;
  grid-template-columns: 26px minmax(0,1fr) auto;
  align-items: center !important;
  gap: 10px !important;
  min-height: 58px;
  margin: 0 !important;
  padding: 8px 10px !important;
  cursor: default !important;
  transition: border-color .14s ease, background-color .14s ease, opacity .14s ease !important;
}
.rwa-profile-row-dragging { border-style: dashed !important; border-color: var(--rwa-primary) !important; background: rgba(255,140,0,.06) !important; opacity: .5 !important; }
.rwa-profile-row-target { border-color: var(--rwa-accent) !important; background: rgba(5,196,107,.055) !important; }
.rwa-profile-drag-handle {
  appearance: none; width: 26px; height: 32px; padding: 0; border: 0; border-radius: 6px;
  background: transparent; color: rgba(255,255,255,.3); font-size: 18px; cursor: grab; touch-action: none;
}
.rwa-profile-drag-handle:hover:not(:disabled) { color: var(--rwa-primary); background: rgba(255,140,0,.08); }
.rwa-profile-drag-handle:active:not(:disabled) { cursor: grabbing; }
.rwa-profile-drag-handle:disabled { opacity: .25; cursor: not-allowed; }
.rwa-profile-copy { min-width: 0; overflow: hidden; }
.rwa-profile-row-name { font-size: 13px; font-weight: 750; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rwa-profile-row-prompt { font-size: 10.75px; color: rgba(255,255,255,.48); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rwa-profile-actions { display: grid; grid-template-columns: repeat(3, 52px); gap: 6px; }
.rwa-profile-actions .rwa-btn { width: 52px; min-width: 52px; height: 28px; padding: 0 6px; font-size: 10px; border-radius: 6px; }

/* API tab: one alignment system instead of mixed inline widths */
.rwa-settings-section-title { margin: 4px 0 14px !important; }
.rwa-form-row, .rwa-form-grid {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 10px 14px;
  align-items: center;
  margin-bottom: 14px;
}
.rwa-form-row > span, .rwa-form-grid > span { font-size: 12px; color: rgba(255,255,255,.82); }
.rwa-form-row .rwa-inp, .rwa-form-grid .rwa-inp { margin: 0 !important; min-height: 42px; }
.rwa-form-row-compact { margin: 12px 0 0; }
.rwa-api-connection-block { margin-bottom: 18px; }
.rwa-connection-card { border: 1px solid rgba(5,196,107,.25); background: rgba(5,196,107,.045); border-radius: 11px; padding: 12px 14px; }
.rwa-connection-card-error { border-color: rgba(255,71,87,.36); background: rgba(255,71,87,.045); }
.rwa-connection-card-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
.rwa-connection-eyebrow { font-size: 9px; font-weight: 800; letter-spacing: .08em; color: rgba(255,255,255,.46); margin-bottom: 4px; }
.rwa-connection-name { font-size: 13px; font-weight: 800; color: var(--rwa-primary); }
.rwa-connection-note { margin-top: 7px; font-size: 10.5px; line-height: 1.45; color: rgba(255,255,255,.62); }
.rwa-connection-refresh { min-width: 72px; height: 30px; padding: 0 10px !important; font-size: 10px !important; }
.rwa-api-preset-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; margin-bottom: 12px; }
.rwa-api-preset { text-align: left; cursor: pointer; padding: 9px 10px !important; margin: 0 !important; }
.rwa-api-preset strong { display: block; color: var(--rwa-primary); font-size: 10px; }
.rwa-api-preset span { display: block; opacity: .6; font-family: monospace; font-size: 9.5px; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwa-api-note { font-size: 10px !important; line-height: 1.5 !important; margin-bottom: 16px !important; }
.rwa-setting-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.rwa-setting-toggle-row > div > div { font-size: 12px; }
.rwa-setting-toggle-row small { display: block; font-size: 10px; opacity: .6; margin-top: 3px; line-height: 1.35; }
.rwa-request-note { margin: -4px 0 12px 164px; font-size: 9.75px; line-height: 1.4; color: rgba(255,255,255,.5); }
.rwa-full-width { width: 100%; min-height: 40px; }

/* Give scrollable surfaces predictable geometry and avoid layout jumps. */
.rwa-grid, .rwa-body, .rwa-prev { scrollbar-gutter: stable; }
.rwa-body, .rwa-grid { overscroll-behavior: contain; }

@media (max-width: 620px) {
  .rwa-popup-main { width: calc(100vw - 20px); min-width: calc(100vw - 20px) !important; max-width: calc(100vw - 20px); }
  .rwa-radar-header { align-items: flex-start; }
  .rwa-radar-target { min-width: 0; }
  .rwa-settings-tabs { grid-template-columns: repeat(5, minmax(74px,1fr)); overflow-x: auto; padding-bottom: 2px !important; }
  .rwa-settings-body { padding: 16px !important; }
  .rwa-settings-foot-four { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .rwa-form-row, .rwa-form-grid { grid-template-columns: 1fr; gap: 6px; }
  .rwa-request-note { margin-left: 0; }
  .rwa-profile-row { grid-template-columns: 24px minmax(0,1fr); }
  .rwa-profile-actions { grid-column: 2; grid-template-columns: repeat(3, minmax(0,1fr)); }
  .rwa-profile-actions .rwa-btn { width: 100%; min-width: 0; }
}
`;

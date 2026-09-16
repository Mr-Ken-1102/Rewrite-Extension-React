export const RWA_PERFORMANCE_CSS = `
/* v3.0.1 productivity-density pass.
   Loaded last: wide/low popup, subdued amber, low-paint settings and drag surfaces. */
:host {
  --rwa-brand: #d6a04a;
  --rwa-brand-strong: #e0ad60;
  --rwa-brand-soft: rgba(214, 160, 74, .085);
  --rwa-brand-border: rgba(214, 160, 74, .22);
  --rwa-action: #bd8435;
  --rwa-action-hover: #cb9140;
}

/* A solid desktop surface is faster and calmer than blurring the whole page. */
.rwa-win,
.rwa-err-window,
.rwa-settings-win {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: #121218 !important;
}
.rwa-settings-win { box-shadow: 0 22px 64px rgba(0,0,0,.48) !important; }
.rwa-settings-body {
  contain: layout paint;
  overscroll-behavior: contain;
  scroll-behavior: auto !important;
}
.rwa-settings-workspace { min-width: 0; background: #121218 !important; }
.rwa-settings-sidebar { background: #0f0f14 !important; }
.rwa-settings-nav-item,
.rwa-btn,
.rwa-inp { transition-duration: .10s !important; }

/* Muted amber: brand remains legible without a fluorescent full-width CTA. */
.rwa-accept {
  background: var(--rwa-action) !important;
  color: #17120b !important;
  border-color: rgba(255,255,255,.04) !important;
}
.rwa-accept:hover:not(:disabled) { background: var(--rwa-action-hover) !important; }
.rwa-inp:focus,
.rwa-prev:focus {
  border-color: rgba(214,160,74,.42) !important;
  box-shadow: 0 0 0 2px rgba(214,160,74,.065) !important;
}

/* Preset editor: one dense list row, close to the search-field height. */
.rwa-profile-list { gap: 5px !important; }
.rwa-profile-row {
  min-height: 42px !important;
  height: auto !important;
  padding: 5px 8px !important;
  gap: 8px !important;
  border-radius: 10px !important;
}
.rwa-profile-drag-handle {
  width: 24px !important;
  height: 28px !important;
  min-height: 28px !important;
  font-size: 15px !important;
}
.rwa-profile-row-name {
  margin-bottom: 1px !important;
  font-size: 12px !important;
  line-height: 1.15 !important;
}
.rwa-profile-row-prompt {
  font-size: 9.75px !important;
  line-height: 1.15 !important;
}
.rwa-profile-actions { gap: 5px !important; }
.rwa-profile-actions .rwa-btn {
  height: 26px !important;
  min-height: 26px !important;
  padding: 0 8px !important;
  font-size: 9.5px !important;
  border-radius: 7px !important;
}
.rwa-profile-search { min-height: 38px !important; }

/* Wide command surface: commands and inspector share one horizontal workbench. */
.rwa-popup-main {
  width: min(620px, calc(100vw - 16px)) !important;
  min-width: min(620px, calc(100vw - 16px)) !important;
  max-width: min(620px, calc(100vw - 16px)) !important;
  padding: 10px !important;
  gap: 7px !important;
  border-radius: 14px !important;
  contain: layout paint style;
}
.rwa-header-drag-zone,
.rwa-mini-hdr.rwa-drag-handle { min-height: 34px !important; }
.rwa-mini-action { width: 28px !important; height: 28px !important; }
.rwa-popup-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(250px, .92fr);
  gap: 8px;
  align-items: start;
  min-width: 0;
}
.rwa-command-section,
.rwa-context-section {
  min-width: 0;
  padding: 8px !important;
  border-radius: 11px !important;
}
.rwa-command-head { padding: 0 1px 7px !important; }
.rwa-command-title { font-size: 12px !important; }
.rwa-profile-grid { gap: 5px !important; padding: 0 2px 1px 0 !important; }
.rwa-profile-btn {
  height: 34px !important;
  min-height: 34px !important;
  padding: 0 9px !important;
  border-radius: 8px !important;
}
.rwa-profile-name { font-size: 10.75px !important; }

/* Inspector density: preserve every control, remove vertical ceremony. */
.rwa-context-section-head { gap: 8px !important; }
.rwa-context-subtitle { margin-top: 2px !important; font-size: 9.5px !important; }
.rwa-radar-target { padding: 4px 7px !important; font-size: 9px !important; }
.rwa-token-panel {
  min-height: 25px !important;
  height: 25px !important;
  margin: 6px 0 !important;
  padding: 0 7px !important;
}
.rwa-token-total { font-size: 10.5px !important; }
.rwa-panel-compact { padding: 7px 8px !important; border-radius: 9px !important; }
.rwa-context-primary {
  min-height: 25px !important;
  margin: 0 0 5px !important;
  padding: 0 1px 5px !important;
}
.rwa-context-primary-note { font-size: 8.5px !important; }
.rwa-context-switch-grid { gap: 2px 10px !important; }
.rwa-context-switch-grid > label { min-height: 23px !important; }
.rwa-context-switch-grid > label > span { font-size: 10px !important; }
.rwa-one-shot-context { margin-top: 5px !important; padding-top: 5px !important; }
.rwa-context-chip { min-height: 20px !important; font-size: 8.5px !important; }
.rwa-merged-row { margin-top: 6px !important; padding-top: 6px !important; gap: 8px !important; }
.rwa-depth-inp-mini { min-height: 27px !important; height: 27px !important; }

.rwa-popup-foot {
  padding-top: 7px !important;
  gap: 5px !important;
}
.rwa-popup-foot .rwa-btn {
  min-height: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  font-size: 10px !important;
}

/* Drag should be pure transform work; suppress descendant effects entirely. */
.rwa-popup-main.rwa-dragging-active,
.rwa-popup-main.rwa-dragging-active * {
  transition: none !important;
  animation: none !important;
  text-shadow: none !important;
  filter: none !important;
}
.rwa-popup-main.rwa-dragging-active { box-shadow: 0 8px 22px rgba(0,0,0,.38) !important; }

@media (max-width: 700px) {
  .rwa-popup-main {
    width: calc(100vw - 12px) !important;
    min-width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px) !important;
  }
  .rwa-popup-workbench { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .rwa-settings-nav-item, .rwa-btn, .rwa-inp { transition: none !important; }
}
`;

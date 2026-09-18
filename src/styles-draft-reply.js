export const RWA_DRAFT_REPLY_CSS = `
.rwa-draft-launcher {
  position: fixed;
  z-index: 10003;
  width: 118px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--rwa-primary) 46%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--rwa-panel-bg) 92%, black 8%);
  color: var(--rwa-primary);
  box-shadow: 0 7px 20px rgba(0,0,0,.28), 0 0 14px color-mix(in srgb, var(--rwa-primary) 18%, transparent);
  font: 800 10.5px/1 var(--rwa-host-font, system-ui, sans-serif);
  letter-spacing: .01em;
  cursor: pointer;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
}
.rwa-draft-launcher-icon { font-size: 14px; line-height: 1; }
.rwa-draft-launcher-draggable { cursor: grab; touch-action: none; user-select: none; }
.rwa-draft-launcher-draggable:active { cursor: grabbing; }
.rwa-draft-launcher:hover, .rwa-draft-launcher:focus-visible {
  transform: translateY(-1px);
  border-color: var(--rwa-primary);
  background: color-mix(in srgb, var(--rwa-primary) 13%, var(--rwa-panel-bg));
  box-shadow: 0 9px 24px rgba(0,0,0,.34), 0 0 18px color-mix(in srgb, var(--rwa-primary) 28%, transparent);
  outline: none;
}

.rwa-draft-window,
.rwa-draft-window * {
  box-sizing: border-box;
}
.rwa-draft-window {
  position: fixed;
  z-index: 10004;
  width: min(620px, calc(100vw - 16px));
  max-width: min(620px, calc(100vw - 16px));
  max-height: calc(100vh - 16px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rwa2-border, rgba(255,255,255,.08));
  border-radius: 12px;
  background: var(--rwa2-bg, #111217);
  color: var(--rwa2-text-2, rgba(255,255,255,.74));
  box-shadow: 0 18px 48px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.03);
  font-family: var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  isolation: isolate;
  contain: layout paint style;
}

.rwa-draft-header,
.rwa-draft-footer {
  flex: 0 0 36px;
  height: 36px;
  min-height: 36px;
}
.rwa-draft-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 8px 0 10px;
  border-bottom: 1px solid rgba(255,255,255,.045);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.rwa-draft-header:active { cursor: grabbing; }
.rwa-draft-title {
  min-width: 0;
  color: var(--rwa2-brand, #d19a45);
  font-size: 12px;
  line-height: 1;
  font-weight: 760;
  letter-spacing: .04em;
  white-space: nowrap;
}
.rwa-draft-header-right {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.rwa-draft-persona-chip {
  min-width: 0;
  max-width: 280px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: 1px solid var(--rwa2-brand-border, rgba(209,154,69,.24));
  border-radius: 999px;
  background: var(--rwa2-brand-soft, rgba(209,154,69,.09));
  color: var(--rwa2-brand, #d19a45);
  font-size: 9.5px;
  font-weight: 760;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa-draft-close {
  appearance: none;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--rwa2-muted, rgba(255,255,255,.54));
  font: 700 17px/1 var(--rwa-host-font, system-ui, sans-serif);
  cursor: pointer;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease;
}
.rwa-draft-close:hover {
  background: var(--rwa2-surface-hover, #202127);
  border-color: var(--rwa2-border, rgba(255,255,255,.08));
  color: var(--rwa2-text, rgba(255,255,255,.94));
}

.rwa-draft-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  padding: 11px 14px 12px;
}
.rwa-draft-profile-note {
  min-width: 0;
  margin: 0 0 8px;
  color: var(--rwa2-subtle, rgba(255,255,255,.36));
  font-size: 9.5px;
  line-height: 1.2;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa-draft-mode-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 6px;
  margin: 7px 0 9px;
}
.rwa-draft-mode {
  min-height: 30px;
  border: 1px solid var(--rwa2-border, rgba(255,255,255,.08));
  border-radius: 8px;
  background: var(--rwa2-surface, #17181e);
  color: var(--rwa2-text-2, rgba(255,255,255,.74));
  font: 700 10.5px/1.2 var(--rwa-host-font, system-ui, sans-serif);
  cursor: pointer;
}
.rwa-draft-mode:hover:not(:disabled) {
  background: var(--rwa2-surface-hover, #202127);
  color: var(--rwa2-text, rgba(255,255,255,.94));
}
.rwa-draft-mode:disabled { opacity: .42; cursor: not-allowed; }
.rwa-draft-mode-active {
  border-color: var(--rwa2-brand-border, rgba(209,154,69,.24));
  background: var(--rwa2-brand-soft, rgba(209,154,69,.09));
  color: var(--rwa2-brand, #d19a45);
}
.rwa-draft-direction {
  box-sizing: border-box;
  min-height: 112px !important;
  max-height: 250px;
  resize: vertical;
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 1.55 !important;
}
.rwa-draft-hint,
.rwa-draft-success-note {
  margin-top: 7px;
  color: var(--rwa2-subtle, rgba(255,255,255,.36));
  font-size: 9.5px;
  line-height: 1.45;
}
.rwa-draft-generation { display: grid; gap: 9px; }
.rwa-draft-loading-copy {
  text-align: center;
  color: var(--rwa2-muted, rgba(255,255,255,.54));
  font-size: 10.5px;
  font-weight: 700;
}
.rwa-draft-live,
.rwa-draft-result {
  box-sizing: border-box;
  min-height: 108px;
  max-height: 290px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px !important;
  line-height: 1.55 !important;
}
.rwa-draft-error-title {
  margin-bottom: 8px;
  color: var(--rwa-coral);
  font-size: 11px;
  font-weight: 800;
}
.rwa-draft-source {
  min-height: 44px;
  max-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 10.5px !important;
  line-height: 1.45 !important;
}
.rwa-draft-result-label { margin-top: 12px; }
.rwa-draft-secondary-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 6px;
  margin-top: 9px;
}
.rwa-draft-secondary-actions .rwa-btn {
  min-width: 0;
  min-height: 30px;
  height: 30px;
  padding: 0 8px !important;
  font-size: 9.7px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rwa-draft-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-top: 1px solid rgba(255,255,255,.045);
  background: color-mix(in srgb, var(--rwa2-bg, #111217) 92%, white 1%);
}
.rwa-draft-footer .rwa-btn {
  min-width: 0;
  min-height: 28px;
  height: 28px;
  margin: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-size: 10px !important;
}
.rwa-draft-footer-btn { flex: 1 1 0; }
.rwa-draft-footer-full { flex: 1 1 100%; }
.rwa-draft-footer-single { flex: 0 1 180px; }
.rwa-draft-footer-status {
  min-width: 0;
  flex: 1 1 auto;
  color: var(--rwa2-subtle, rgba(255,255,255,.36));
  font-size: 9.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 620px) {
  .rwa-draft-window {
    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
  }
  .rwa-draft-persona-chip { max-width: min(46vw, 230px); }
  .rwa-draft-body { padding: 10px 12px 11px; }
  .rwa-draft-secondary-actions { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
`;

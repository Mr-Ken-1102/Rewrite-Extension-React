export const RWA_SETTINGS_CSS = `
:host {
  --rwas-brand: #d19a45;
  --rwas-brand-soft: rgba(209,154,69,.10);
  --rwas-brand-border: rgba(209,154,69,.26);
  --rwas-bg: #121218;
  --rwas-sidebar: #0f0f14;
  --rwas-surface: #17171d;
  --rwas-surface-hover: #202027;
  --rwas-border: rgba(255,255,255,.085);
  --rwas-border-strong: rgba(255,255,255,.14);
  --rwas-text: rgba(255,255,255,.94);
  --rwas-text-2: rgba(255,255,255,.74);
  --rwas-muted: rgba(255,255,255,.52);
  --rwas-subtle: rgba(255,255,255,.36);
}

.rwas-settings,
.rwas-settings * {
  box-sizing: border-box;
}

.rwas-settings {
  width: min(960px, calc(100vw - 32px)) !important;
  max-width: min(960px, calc(100vw - 32px)) !important;
  height: min(720px, calc(100vh - 32px)) !important;
  max-height: min(720px, calc(100vh - 32px)) !important;
  min-height: min(600px, calc(100vh - 32px));
  display: flex !important;
  flex-direction: column;
  gap: 0 !important;
  padding: 0 !important;
  border: 1px solid var(--rwas-border) !important;
  border-radius: 16px !important;
  background: var(--rwas-bg) !important;
  color: var(--rwas-text-2);
  box-shadow: 0 24px 72px rgba(0,0,0,.52), inset 0 1px 0 rgba(255,255,255,.035) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  overflow: hidden;
}

.rwas-header {
  flex: 0 0 64px;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 20px;
  border-bottom: 1px solid var(--rwas-border);
  background: #121218;
}

.rwas-brand {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rwas-brand-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rwas-product {
  color: var(--rwas-brand);
  font-size: 11px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.rwas-version {
  min-height: 18px;
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: 1px solid var(--rwas-brand-border);
  border-radius: 999px;
  background: var(--rwas-brand-soft);
  color: var(--rwas-brand);
  font-size: 10px;
  font-weight: 800;
}

.rwas-window-title {
  color: var(--rwas-text);
  font-size: 17px;
  line-height: 1;
  font-weight: 720;
  letter-spacing: -.01em;
}

.rwas-settings .rwas-close {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 0 !important;
  border: 1px solid transparent !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: var(--rwas-muted) !important;
  box-shadow: none !important;
}
.rwas-settings .rwas-close:hover:not(:disabled) {
  border-color: var(--rwas-border) !important;
  background: var(--rwas-surface-hover) !important;
  color: var(--rwas-text) !important;
}

.rwas-shell {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
}

.rwas-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 10px 12px;
  border-right: 1px solid var(--rwas-border);
  background: var(--rwas-sidebar);
}

.rwas-nav-label {
  padding: 0 10px 10px;
  color: var(--rwas-subtle);
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .10em;
  text-transform: uppercase;
}

.rwas-nav {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
}

.rwas-nav-btn {
  appearance: none;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--rwas-muted);
  text-align: left;
  cursor: pointer;
  transition: background-color .10s ease, border-color .10s ease, color .10s ease;
}

.rwas-nav-btn:hover {
  color: var(--rwas-text);
  background: rgba(255,255,255,.035);
}

.rwas-nav-btn.rwas-active {
  color: var(--rwas-text);
  border-color: rgba(209,154,69,.18);
  background: var(--rwas-brand-soft);
}

.rwas-nav-icon {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 7px;
  background: rgba(255,255,255,.035);
}

.rwas-active .rwas-nav-icon {
  color: var(--rwas-brand);
  background: rgba(209,154,69,.09);
}

.rwas-nav-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rwas-nav-copy strong {
  color: inherit;
  font-size: 11.5px;
  line-height: 1.15;
  font-weight: 680;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rwas-nav-copy small {
  color: var(--rwas-subtle);
  font-size: 10px;
  line-height: 1.15;
  font-weight: 520;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rwas-nav-about {
  margin-top: auto;
}

.rwas-workspace {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--rwas-bg);
}

.rwas-page-head {
  flex: 0 0 auto;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.rwas-page-copy {
  min-width: 0;
}

.rwas-page-kicker {
  margin-bottom: 6px;
  color: var(--rwas-brand);
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.rwas-page-title {
  color: var(--rwas-text);
  font-size: 20px;
  line-height: 1.15;
  font-weight: 720;
  letter-spacing: -.018em;
}

.rwas-page-description {
  max-width: 620px;
  margin-top: 6px;
  color: var(--rwas-muted);
  font-size: 11px;
  line-height: 1.45;
}

.rwas-page-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rwas-settings .rwas-page-actions .rwa-btn {
  min-height: 36px !important;
  height: 36px !important;
  margin: 0 !important;
  padding: 0 13px !important;
  border-radius: 9px !important;
  box-shadow: none !important;
  font-size: 10.5px !important;
  font-weight: 650 !important;
}

.rwas-settings .rwas-secondary-action {
  background: var(--rwas-surface) !important;
  border-color: var(--rwas-border) !important;
  color: var(--rwas-text-2) !important;
}

.rwas-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  padding: 20px 24px 28px !important;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  contain: layout paint;
  scroll-behavior: auto !important;
}

.rwas-body::-webkit-scrollbar { width: 7px; }
.rwas-body::-webkit-scrollbar-track { background: transparent; }
.rwas-body::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 99px;
  background: rgba(255,255,255,.10);
  background-clip: padding-box;
}

.rwas-statusbar {
  flex: 0 0 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 20px;
  border-top: 1px solid var(--rwas-border);
  background: #101015;
}

.rwas-save-status {
  color: var(--rwas-subtle);
  font-size: 10px;
  line-height: 1.4;
}

.rwas-settings .rwas-done {
  min-width: 88px !important;
  min-height: 36px !important;
  height: 36px !important;
  margin: 0 !important;
  padding: 0 16px !important;
  border-radius: 9px !important;
  box-shadow: none !important;
  font-size: 11px !important;
  font-weight: 700 !important;
}

.rwas-settings :is(.rwas-close, .rwas-nav-btn, .rwas-page-actions .rwa-btn, .rwas-done):focus-visible {
  outline: 2px solid rgba(209,154,69,.72);
  outline-offset: 2px;
}

@media (max-width: 760px) {
  .rwas-settings {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    height: calc(100vh - 16px) !important;
    max-height: calc(100vh - 16px) !important;
    min-height: 0;
  }

  .rwas-header {
    flex-basis: 56px;
    min-height: 56px;
    padding: 0 14px;
  }

  .rwas-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .rwas-sidebar {
    display: block;
    padding: 8px;
    border-right: 0;
    border-bottom: 1px solid var(--rwas-border);
    overflow-x: auto;
    white-space: nowrap;
  }

  .rwas-nav-label { display: none; }
  .rwas-nav { display: inline-flex; flex: 0 0 auto; flex-direction: row; gap: 4px; }

  .rwas-nav-btn {
    width: auto;
    min-width: 42px;
    min-height: 38px;
    display: inline-flex;
    padding: 5px 8px;
  }

  .rwas-nav-copy small { display: none; }
  .rwas-nav-about { display: inline-flex; margin-top: 0; margin-left: 4px; }
  .rwas-page-head { min-height: 88px; padding: 14px 16px 12px; gap: 12px; }
  .rwas-page-title { font-size: 18px; }
  .rwas-page-description { display: none; }
  .rwas-body { padding: 16px !important; }
  .rwas-statusbar { flex-basis: 52px; min-height: 52px; padding: 8px 12px; }
}

@media (max-width: 520px) {
  .rwas-nav-copy { display: none; }
  .rwas-nav-btn { padding: 5px 7px; }
  .rwas-page-head { align-items: flex-start; flex-direction: column; }
  .rwas-page-actions { width: 100%; }
  .rwas-settings .rwas-page-actions .rwa-btn { flex: 1; min-width: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .rwas-settings *,
  .rwas-nav-btn {
    transition: none !important;
    animation: none !important;
  }
}

@media (prefers-contrast: more) {
  .rwas-settings {
    --rwas-border: rgba(255,255,255,.18);
    --rwas-border-strong: rgba(255,255,255,.28);
    --rwas-muted: rgba(255,255,255,.68);
    --rwas-subtle: rgba(255,255,255,.54);
  }
}
`;

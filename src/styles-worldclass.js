export const RWA_WORLDCLASS_CSS = `
/* v3.0.1 unified interface system: floating command palette + settings workspace. */
@keyframes rwa-activity-sweep {
  0% { transform: translateX(-125%); }
  55% { transform: translateX(150%); }
  100% { transform: translateX(150%); }
}
@keyframes rwa-feature-sweep {
  0% { transform: translateX(-120%); opacity: .35; }
  45% { opacity: .95; }
  70%, 100% { transform: translateX(245%); opacity: .35; }
}
:host {
  --rwa-brand: #ffb020;
  --rwa-brand-strong: #ffc247;
  --rwa-brand-soft: rgba(255, 176, 32, 0.10);
  --rwa-brand-border: rgba(255, 176, 32, 0.28);
  --rwa-wc-bg: rgba(17, 17, 22, 0.975);
  --rwa-wc-bg-solid: #111116;
  --rwa-wc-surface: rgba(255, 255, 255, 0.032);
  --rwa-wc-surface-2: rgba(255, 255, 255, 0.046);
  --rwa-wc-surface-hover: rgba(255, 255, 255, 0.062);
  --rwa-wc-border: rgba(255, 255, 255, 0.085);
  --rwa-wc-border-strong: rgba(255, 255, 255, 0.145);
  --rwa-wc-text: rgba(255, 255, 255, 0.93);
  --rwa-wc-text-2: rgba(255, 255, 255, 0.74);
  --rwa-wc-muted: rgba(255, 255, 255, 0.54);
  --rwa-wc-subtle: rgba(255, 255, 255, 0.36);
  --rwa-wc-danger: #ff626f;
  --rwa-wc-radius-xl: 16px;
  --rwa-wc-radius-lg: 14px;
  --rwa-wc-radius-md: 10px;
  --rwa-wc-radius-sm: 8px;
}

/* --------------------------------------------------------------------------
   Shared extension surfaces
   -------------------------------------------------------------------------- */
.rwa-architect-status {
  min-height: 34px;
  display: grid;
  align-content: center;
  gap: 7px;
  margin: 5px 0 1px;
  color: var(--rwa-wc-subtle);
  font-size: 10.5px;
  line-height: 1.35;
}
.rwa-architect-status-active { color: var(--rwa-wc-muted); }
.rwa-activity-rail {
  position: relative;
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.045);
}
.rwa-activity-runner {
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--rwa-brand), #ff7043, transparent);
  box-shadow: 0 0 12px rgba(255,176,32,.20);
  animation: rwa-activity-sweep 1.35s cubic-bezier(.42,0,.22,1) infinite;
}
.rwa-architect-status-copy {
  min-height: 14px;
  display: block;
}

.rwa-win,
.rwa-err-window {
  border: 1px solid var(--rwa-wc-border) !important;
  border-radius: var(--rwa-wc-radius-xl) !important;
  background: rgba(18, 18, 24, 0.985) !important;
  box-shadow: 0 28px 72px rgba(0,0,0,.56), 0 1px 0 rgba(255,255,255,.04) inset !important;
  backdrop-filter: blur(18px) saturate(112%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(112%) !important;
  overflow: hidden;
}
.rwa-hdr {
  min-height: 60px;
  padding: 14px 18px !important;
  border-bottom: 1px solid var(--rwa-wc-border) !important;
  background: rgba(255,255,255,.012);
}
.rwa-title {
  color: var(--rwa-brand) !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  -webkit-text-fill-color: currentColor !important;
  text-shadow: none !important;
  font-size: 14px !important;
  font-weight: 760 !important;
  letter-spacing: .01em;
}
.rwa-body {
  color: var(--rwa-wc-text-2);
}
.rwa-inp,
.rwa-prev {
  border-color: var(--rwa-wc-border) !important;
  background: rgba(0,0,0,.19) !important;
  color: var(--rwa-wc-text) !important;
  box-shadow: none !important;
}
.rwa-inp:hover,
.rwa-prev:hover { border-color: var(--rwa-wc-border-strong) !important; }
.rwa-inp:focus,
.rwa-prev:focus {
  border-color: rgba(255,176,32,.48) !important;
  background: rgba(0,0,0,.27) !important;
  box-shadow: 0 0 0 3px rgba(255,176,32,.075) !important;
}
.rwa-btn {
  box-shadow: none !important;
  transition: background-color .12s ease, border-color .12s ease, color .12s ease, opacity .12s ease !important;
}
.rwa-btn:hover:not(:disabled) { transform: none !important; }
.rwa-btn:active:not(:disabled) { transform: scale(.985) !important; }
.rwa-accept {
  background: var(--rwa-brand) !important;
  color: #17120a !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
.rwa-accept:hover:not(:disabled) {
  background: var(--rwa-brand-strong) !important;
  color: #17120a !important;
  filter: none !important;
}
.rwa-dng {
  color: var(--rwa-wc-danger) !important;
  border-color: rgba(255,98,111,.25) !important;
}
.rwa-dng:hover:not(:disabled) {
  background: rgba(255,98,111,.07) !important;
  border-color: rgba(255,98,111,.42) !important;
}
.rwa-btn-close,
.rwa-btn-info {
  width: 34px !important;
  height: 34px !important;
  padding: 0 !important;
  border-radius: 9px !important;
  color: var(--rwa-wc-muted) !important;
  background: transparent !important;
  border-color: transparent !important;
}
.rwa-btn-close:hover,
.rwa-btn-info:hover {
  color: var(--rwa-wc-text) !important;
  background: var(--rwa-wc-surface-hover) !important;
  border-color: var(--rwa-wc-border) !important;
}
.rwa-btn-info svg { display: block; }

/* --------------------------------------------------------------------------
   Floating rewrite palette
   -------------------------------------------------------------------------- */
.rwa-popup-main {
  width: min(424px, calc(100vw - 16px));
  min-width: min(424px, calc(100vw - 16px)) !important;
  max-width: min(424px, calc(100vw - 16px));
  padding: 12px !important;
  gap: 10px !important;
  border-radius: var(--rwa-wc-radius-xl) !important;
  border: 1px solid var(--rwa-wc-border) !important;
  background: rgba(17,17,22,.992) !important;
  box-shadow: 0 18px 52px rgba(0,0,0,.54), 0 1px 0 rgba(255,255,255,.045) inset !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  animation-duration: .16s !important;
  contain: layout paint style;
  will-change: transform;
}
.rwa-popup-main.rwa-dragging-active {
  animation: none !important;
  transition: none !important;
  will-change: transform;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: rgba(17,17,22,.994) !important;
  box-shadow: 0 12px 34px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.04) !important;
}
.rwa-popup-main .rwa-glow-button::before { display: none !important; }
.rwa-popup-main .rwa-btn:hover,
.rwa-popup-main .rwa-pb:hover { transform: none !important; }
.rwa-popup-main .rwa-btn:active,
.rwa-popup-main .rwa-pb:active { transform: scale(.985) !important; }

/* Brand / draggable toolbar */
.rwa-header-drag-zone {
  min-height: 38px;
  margin: -2px 0 0 !important;
  padding: 0 2px !important;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.rwa-header-drag-zone:active { cursor: grabbing; }
.rwa-mini-hdr.rwa-drag-handle {
  min-height: 38px;
  padding: 0 !important;
  margin: 0 !important;
}
.rwa-mini-brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.rwa-mini-title {
  font-size: 12px !important;
  line-height: 1;
  font-weight: 800 !important;
  letter-spacing: .052em !important;
  text-transform: uppercase !important;
  color: var(--rwa-brand) !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  -webkit-text-fill-color: currentColor !important;
  text-shadow: 0 0 14px rgba(255,176,32,.10) !important;
}
.rwa-version-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 19px;
  padding: 0 6px;
  border-radius: 999px;
  color: var(--rwa-brand);
  background: var(--rwa-brand-soft);
  border: 1px solid var(--rwa-brand-border);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .035em;
}
.rwa-mini-actions { gap: 4px !important; }
.rwa-mini-action {
  width: 30px !important;
  height: 30px !important;
  border-radius: 8px !important;
  color: var(--rwa-wc-muted) !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
.rwa-mini-action:hover:not(:disabled) {
  color: var(--rwa-wc-text) !important;
  background: var(--rwa-wc-surface-hover) !important;
  border-color: var(--rwa-wc-border) !important;
}
.rwa-mini-action-active {
  color: var(--rwa-brand) !important;
  background: var(--rwa-brand-soft) !important;
}

/* Rewrite command section */
.rwa-command-section {
  padding: 10px;
  border: 1px solid rgba(255,255,255,.064);
  border-radius: 13px;
  background: rgba(255,255,255,.018);
}
.rwa-command-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 9px;
}
.rwa-command-kicker {
  margin-bottom: 3px;
  color: var(--rwa-brand);
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .105em;
  text-transform: uppercase;
}
.rwa-command-title {
  color: var(--rwa-wc-text);
  font-size: 12.5px;
  line-height: 1.25;
  font-weight: 720;
}
.rwa-command-count {
  padding-bottom: 1px;
  color: var(--rwa-wc-subtle);
  font-size: 9.5px;
  line-height: 1;
  white-space: nowrap;
}
.rwa-profile-grid {
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 3px 2px 0 !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.14) transparent;
  overscroll-behavior: contain;
}
.rwa-profile-grid::-webkit-scrollbar { width: 5px; }
.rwa-profile-grid::-webkit-scrollbar-track { background: transparent; }
.rwa-profile-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,.13); border-radius: 99px; }
.rwa-profile-btn {
  height: 40px !important;
  min-height: 40px !important;
  padding: 0 12px !important;
  border-radius: var(--rwa-wc-radius-md) !important;
  border-color: var(--rwa-wc-border) !important;
  background: rgba(255,255,255,.026) !important;
  color: rgba(255,255,255,.80) !important;
  box-shadow: none !important;
  transition: background-color .12s ease, border-color .12s ease, color .12s ease !important;
}
.rwa-profile-btn:hover {
  background: rgba(255,255,255,.052) !important;
  border-color: rgba(255,176,32,.28) !important;
  color: #fff !important;
}
.rwa-profile-name {
  min-width: 0;
  width: 100%;
  font-size: 11.5px !important;
  line-height: 1.2 !important;
  font-weight: 650;
  letter-spacing: .003em;
  text-align: left !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Context inspector */
.rwa-context-section {
  padding: 10px;
  border: 1px solid rgba(255,255,255,.064);
  border-radius: 13px;
  background: rgba(255,255,255,.018);
}
.rwa-context-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rwa-context-heading { min-width: 0; }
.rwa-context-kicker-row { display: flex; align-items: center; gap: 6px; }
.rwa-radar-kicker {
  color: var(--rwa-brand);
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .105em;
  text-transform: uppercase;
}
.rwa-context-subtitle {
  margin-top: 4px;
  color: var(--rwa-wc-muted);
  font-size: 10.5px;
  line-height: 1.25;
}
.rwa-info-icon {
  appearance: none;
  width: 17px;
  height: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--rwa-wc-border);
  border-radius: 50%;
  background: transparent;
  color: var(--rwa-wc-muted);
  font: 700 10px/1 var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  cursor: help;
  opacity: .78 !important;
  filter: none !important;
}
.rwa-info-icon:hover {
  color: var(--rwa-wc-text);
  border-color: var(--rwa-wc-border-strong);
}
.rwa-radar-target {
  min-width: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 5px 8px !important;
  border-radius: 999px !important;
  border: 1px solid var(--rwa-wc-border) !important;
  background: rgba(255,255,255,.026) !important;
  color: var(--rwa-wc-muted) !important;
  font-size: 9.5px !important;
  line-height: 1 !important;
  white-space: nowrap;
  box-shadow: none !important;
}
.rwa-target-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
  box-shadow: 0 0 0 2px rgba(255,255,255,.035);
}
.rwa-token-panel {
  min-height: 28px !important;
  margin: 8px 0 9px;
  padding: 0 9px !important;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 8px;
  background: rgba(0,0,0,.13);
}
.rwa-token-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--rwa-brand);
  box-shadow: 0 0 8px rgba(255,176,32,.26);
}
.rwa-token-total {
  color: rgba(255,255,255,.68) !important;
  font-size: 11px !important;
  line-height: 1 !important;
  font-weight: 620 !important;
  letter-spacing: .002em;
}
.rwa-token-part { display: none !important; }

.rwa-panel-compact {
  padding: 10px 11px !important;
  border-radius: 11px !important;
  border: 1px solid rgba(255,255,255,.055) !important;
  background: rgba(255,255,255,.016) !important;
  box-shadow: none !important;
}
.rwa-context-primary {
  min-height: 34px !important;
  display: grid !important;
  grid-template-columns: minmax(0,1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 0 0 7px !important;
  padding: 0 1px 8px !important;
  border-bottom: 1px solid rgba(255,255,255,.052) !important;
}
.rwa-context-primary > label {
  width: 100%;
  min-height: 28px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 10px !important;
}
.rwa-context-primary-note {
  color: var(--rwa-wc-subtle);
  font-size: 9px;
  line-height: 1.2;
  text-align: right;
}
.rwa-context-switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr)) !important;
  gap: 3px 16px !important;
  align-items: center;
}
.rwa-context-switch-grid > label {
  width: 100%;
  min-height: 30px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 10px !important;
}
.rwa-context-switch-grid > label > span {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: rgba(255,255,255,.72) !important;
}
.rwa-tog-wrap { width: 30px !important; height: 17px !important; }
.rwa-tog-sl { background: rgba(255,255,255,.15) !important; }
.rwa-tog-sl:before { height: 11px !important; width: 11px !important; }
.rwa-tog-wrap input:checked + .rwa-tog-sl {
  background: var(--rwa-brand) !important;
  box-shadow: none !important;
}
.rwa-tog-wrap input:checked + .rwa-tog-sl:before { transform: translateX(13px) !important; }

.rwa-one-shot-context {
  display: flex !important;
  align-items: flex-start !important;
  gap: 8px !important;
  margin-top: 8px !important;
  padding-top: 8px !important;
  border-top: 1px solid rgba(255,255,255,.045);
}
.rwa-one-shot-label {
  padding-top: 4px;
  color: var(--rwa-wc-subtle) !important;
  font-size: 9.5px !important;
  white-space: nowrap;
}
.rwa-one-shot-chips {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.rwa-context-chip {
  min-height: 22px !important;
  padding: 0 7px !important;
  border-radius: 999px !important;
  font-size: 9px !important;
  background: rgba(255,255,255,.025) !important;
  border-color: rgba(255,255,255,.075) !important;
}
.rwa-context-chip:hover {
  border-color: var(--rwa-brand-border) !important;
  color: var(--rwa-brand) !important;
}
.rwa-context-chip-off { opacity: .42; text-decoration: line-through; }

.rwa-merged-row {
  display: grid !important;
  grid-template-columns: minmax(0,1fr) 92px !important;
  gap: 12px !important;
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px solid rgba(255,255,255,.052);
  align-items: center;
}
.rwa-length-side {
  display: grid !important;
  grid-template-columns: 30px auto minmax(70px,1fr) 38px;
  align-items: center;
  gap: 7px !important;
  min-width: 0;
}
.rwa-length-side > label { min-width: 30px; }
.rwa-len-lbl,
.rwa-depth-lbl {
  color: var(--rwa-wc-muted) !important;
  font-size: 9.5px !important;
  font-weight: 700 !important;
}
.rwa-len-val {
  min-width: 38px !important;
  font-size: 10px !important;
  color: var(--rwa-brand) !important;
  text-align: right;
}
.rwa-len-range { min-width: 0; }
.rwa-range::-webkit-slider-thumb {
  background: var(--rwa-brand) !important;
  box-shadow: 0 0 0 3px rgba(255,176,32,.10) !important;
}
.rwa-depth-side {
  display: grid !important;
  grid-template-columns: auto 44px;
  gap: 7px;
  align-items: center;
  min-width: 0 !important;
  padding-left: 10px;
  border-left: 1px solid rgba(255,255,255,.055);
}
.rwa-depth-inp-mini {
  width: 44px !important;
  min-height: 30px !important;
  height: 30px !important;
  margin: 0 !important;
  padding: 4px 5px !important;
  border-radius: 8px !important;
  text-align: center;
  font-size: 10px !important;
  background: rgba(0,0,0,.18) !important;
}

/* Popup command bar */
.rwa-popup-foot {
  grid-template-columns: 32px 32px minmax(0,1.15fr) minmax(0,1fr) !important;
  gap: 6px !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
  border-top: 0 !important;
}
.rwa-popup-foot .rwa-btn {
  min-height: 36px !important;
  height: 36px !important;
  padding: 0 10px !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  font-size: 10.5px !important;
  font-weight: 650 !important;
  background: rgba(255,255,255,.028) !important;
  border-color: var(--rwa-wc-border) !important;
  color: rgba(255,255,255,.72) !important;
}
.rwa-popup-foot .rwa-btn-custom {
  color: var(--rwa-brand) !important;
  border-color: var(--rwa-brand-border) !important;
  background: var(--rwa-brand-soft) !important;
}
.rwa-popup-foot .rwa-btn:hover:not(:disabled) {
  background: var(--rwa-wc-surface-hover) !important;
  border-color: var(--rwa-wc-border-strong) !important;
  color: #fff !important;
}
.rwa-popup-foot .rwa-btn-custom:hover:not(:disabled) {
  background: rgba(255,176,32,.14) !important;
  border-color: rgba(255,176,32,.40) !important;
  color: var(--rwa-brand-strong) !important;
}
.rwa-popup-foot .rwa-btn:disabled { opacity: .18 !important; }
.rwa-btn-icon-square { padding: 0 !important; }

/* --------------------------------------------------------------------------
   Settings: sidebar navigation + content workspace
   -------------------------------------------------------------------------- */
.rwa-settings-win {
  width: min(920px, calc(100vw - 32px)) !important;
  max-width: min(920px, calc(100vw - 32px)) !important;
  height: min(740px, calc(100vh - 32px)) !important;
  max-height: min(740px, calc(100vh - 32px)) !important;
  min-height: min(600px, calc(100vh - 32px));
  padding: 0 !important;
  gap: 0 !important;
}
.rwa-settings-hdr {
  min-height: 72px !important;
  height: 72px;
  flex: 0 0 72px;
  padding: 0 20px !important;
  border-bottom: 1px solid var(--rwa-wc-border) !important;
  background: rgba(255,255,255,.012);
}
.rwa-settings-brand { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.rwa-settings-brand-line { display: flex; align-items: center; gap: 8px; }
.rwa-settings-product {
  color: var(--rwa-brand);
  font-size: 11px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .075em;
  text-transform: uppercase;
}
.rwa-settings-window-title {
  color: var(--rwa-wc-text);
  font-size: 17px;
  line-height: 1;
  font-weight: 730;
  letter-spacing: -.012em;
}
.rwa-settings-about-active {
  color: var(--rwa-brand) !important;
  background: var(--rwa-brand-soft) !important;
  border-color: var(--rwa-brand-border) !important;
}

.rwa-settings-shell {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 196px minmax(0,1fr);
}
.rwa-settings-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 10px 12px;
  border-right: 1px solid var(--rwa-wc-border);
  background: rgba(0,0,0,.115);
}
.rwa-settings-nav-label {
  padding: 0 10px 10px;
  color: var(--rwa-wc-subtle);
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.rwa-settings-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.rwa-settings-nav-btn {
  appearance: none;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  display: grid;
  grid-template-columns: 26px minmax(0,1fr);
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--rwa-wc-muted);
  text-align: left;
  cursor: pointer;
  transition: background-color .12s ease, border-color .12s ease, color .12s ease;
}
.rwa-settings-nav-btn:hover {
  color: var(--rwa-wc-text);
  background: var(--rwa-wc-surface);
}
.rwa-settings-nav-btn.rwa-active {
  color: var(--rwa-wc-text);
  background: var(--rwa-brand-soft);
  border-color: rgba(255,176,32,.17);
}
.rwa-settings-nav-icon {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  color: currentColor;
  background: rgba(255,255,255,.035);
}
.rwa-settings-nav-btn.rwa-active .rwa-settings-nav-icon {
  color: var(--rwa-brand);
  background: rgba(255,176,32,.085);
}
.rwa-settings-nav-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.rwa-settings-nav-copy strong {
  color: inherit;
  font-size: 11px;
  line-height: 1.15;
  font-weight: 690;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa-settings-nav-copy small {
  color: var(--rwa-wc-subtle);
  font-size: 9px;
  line-height: 1.15;
  font-weight: 520;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rwa-settings-nav-about {
  margin-top: auto;
  border-top-color: transparent;
}

.rwa-settings-workspace {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,.006);
}
.rwa-settings-page-head {
  flex: 0 0 auto;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}
.rwa-settings-page-kicker {
  margin-bottom: 6px;
  color: var(--rwa-brand);
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.rwa-settings-page-title {
  color: var(--rwa-wc-text);
  font-size: 20px;
  line-height: 1.15;
  font-weight: 740;
  letter-spacing: -.018em;
}
.rwa-settings-page-description {
  max-width: 620px;
  margin-top: 7px;
  color: var(--rwa-wc-muted);
  font-size: 11px;
  line-height: 1.45;
}
.rwa-settings-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  padding: 20px 24px 26px !important;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}
.rwa-settings-body::-webkit-scrollbar { width: 7px; }
.rwa-settings-body::-webkit-scrollbar-track { background: transparent; }
.rwa-settings-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.10); border-radius: 99px; border: 2px solid transparent; background-clip: padding-box; }

.rwa-settings-foot {
  flex: 0 0 auto;
  min-height: 64px;
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  gap: 12px !important;
  padding: 11px 20px !important;
  margin: 0 !important;
  border-top: 1px solid var(--rwa-wc-border);
  background: rgba(0,0,0,.10);
}
.rwa-settings-foot-leading,
.rwa-settings-foot-trailing {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rwa-settings-foot-leading:empty { display: none; }
.rwa-settings-foot .rwa-btn {
  width: auto !important;
  min-width: 90px;
  min-height: 38px;
  height: 38px;
  margin: 0 !important;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 10.5px;
  font-weight: 650;
}
.rwa-settings-foot-four,
.rwa-settings-foot-two { grid-template-columns: none !important; }

/* Settings content normalization */
.rwa-settings-body .rwa-lbl,
.rwa-settings-section-title,
.rwa-section-kicker {
  display: block;
  margin: 2px 0 12px !important;
  color: var(--rwa-wc-text) !important;
  font-size: 12px !important;
  line-height: 1.3;
  font-weight: 720 !important;
  letter-spacing: .005em !important;
  text-transform: none !important;
}
.rwa-settings-body .rwa-lbl::after,
.rwa-settings-section-title::after {
  content: '';
  display: block;
  width: 28px;
  height: 2px;
  margin-top: 8px;
  border-radius: 99px;
  background: var(--rwa-brand);
  opacity: .72;
}
.rwa-settings-body .rwa-inp {
  min-height: 40px;
  border-radius: 9px !important;
  font-size: 11.5px !important;
}
.rwa-form-row,
.rwa-form-grid {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) !important;
  gap: 10px 16px !important;
  align-items: center;
  margin-bottom: 14px !important;
}
.rwa-form-row > span,
.rwa-form-grid > span {
  color: var(--rwa-wc-text-2) !important;
  font-size: 11px !important;
  line-height: 1.35;
}
.rwa-form-row .rwa-inp,
.rwa-form-grid .rwa-inp { margin: 0 !important; }
.rwa-form-row-compact { margin-top: 10px !important; }
.rwa-setting-toggle-row {
  min-height: 48px;
  margin: 0 !important;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa-setting-toggle-row:last-child { border-bottom: 0; }
.rwa-setting-toggle-row > div > div {
  color: var(--rwa-wc-text-2);
  font-size: 11.5px !important;
}
.rwa-setting-toggle-row small {
  margin-top: 4px;
  color: var(--rwa-wc-muted);
  font-size: 9.5px !important;
  line-height: 1.4;
}
.rwa-request-note {
  margin: -4px 0 14px 186px !important;
  color: var(--rwa-wc-muted) !important;
  font-size: 9.5px !important;
}
.rwa-full-width { min-height: 40px !important; }

/* API cards */
.rwa-api-connection-block { margin-bottom: 18px; }
.rwa-connection-card {
  padding: 14px !important;
  border: 1px solid rgba(5,196,107,.20) !important;
  border-radius: 11px !important;
  background: rgba(5,196,107,.035) !important;
}
.rwa-connection-card-error {
  border-color: rgba(255,98,111,.28) !important;
  background: rgba(255,98,111,.035) !important;
}
.rwa-connection-card-head { gap: 16px !important; }
.rwa-connection-eyebrow {
  color: var(--rwa-wc-subtle) !important;
  font-size: 8.5px !important;
  letter-spacing: .11em !important;
}
.rwa-connection-name {
  color: var(--rwa-brand) !important;
  font-size: 12px !important;
}
.rwa-connection-note {
  color: var(--rwa-wc-muted) !important;
  font-size: 10px !important;
  line-height: 1.5 !important;
}
.rwa-api-preset-grid { gap: 8px !important; }
.rwa-api-preset {
  padding: 10px 11px !important;
  border-radius: 9px !important;
  background: rgba(255,255,255,.02) !important;
}
.rwa-api-preset strong { color: var(--rwa-brand) !important; }
.rwa-api-preset:hover { background: var(--rwa-wc-surface-hover) !important; }

/* Profiles workspace */
.rwa-profile-search {
  min-height: 42px !important;
  margin: 0 0 8px !important;
  padding-left: 13px !important;
}
.rwa-profile-summary {
  margin: 0 0 14px !important;
  color: var(--rwa-wc-muted) !important;
  font-size: 10px !important;
  line-height: 1.45 !important;
}
.rwa-profile-list {
  display: flex;
  flex-direction: column;
  gap: 8px !important;
  padding-bottom: 10px;
}
.rwa-profile-row {
  display: grid !important;
  grid-template-columns: 28px minmax(0,1fr) auto;
  align-items: center !important;
  gap: 11px !important;
  min-height: 66px !important;
  margin: 0 !important;
  padding: 9px 10px !important;
  border: 1px solid rgba(255,255,255,.07) !important;
  border-radius: 11px !important;
  background: rgba(255,255,255,.018) !important;
  cursor: default !important;
  transition: border-color .12s ease, background-color .12s ease, opacity .12s ease !important;
}
.rwa-profile-row:hover {
  border-color: rgba(255,255,255,.13) !important;
  background: rgba(255,255,255,.028) !important;
}
.rwa-profile-row-dragging {
  border-style: dashed !important;
  border-color: var(--rwa-brand-border) !important;
  background: var(--rwa-brand-soft) !important;
  opacity: .5 !important;
}
.rwa-profile-row-target {
  border-color: rgba(255,176,32,.42) !important;
  background: rgba(255,176,32,.06) !important;
}
.rwa-profile-drag-handle {
  appearance: none;
  width: 28px !important;
  height: 34px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 7px !important;
  background: transparent !important;
  color: rgba(255,255,255,.28) !important;
  font-size: 17px !important;
  cursor: grab !important;
  touch-action: none;
}
.rwa-profile-drag-handle:hover:not(:disabled) {
  color: var(--rwa-brand) !important;
  background: var(--rwa-brand-soft) !important;
}
.rwa-profile-copy { min-width: 0; overflow: hidden; }
.rwa-profile-row-name {
  margin-bottom: 4px !important;
  font-size: 12px !important;
  line-height: 1.2;
  font-weight: 700 !important;
}
.rwa-profile-row-prompt {
  color: var(--rwa-wc-muted) !important;
  font-size: 10px !important;
  line-height: 1.3;
}
.rwa-profile-actions {
  display: grid;
  grid-template-columns: repeat(3, 54px) !important;
  gap: 6px !important;
}
.rwa-profile-actions .rwa-btn {
  width: 54px !important;
  min-width: 54px !important;
  height: 30px !important;
  padding: 0 6px !important;
  border-radius: 7px !important;
  font-size: 9.5px !important;
}

/* About + Credits */
.rwa-about-container,
.rwa-credits-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.rwa-about-identity {
  display: grid;
  grid-template-columns: 44px minmax(0,1fr) auto;
  align-items: center;
  gap: 13px;
  min-height: 70px;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.013));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa-about-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #17120a;
  background: var(--rwa-brand);
  box-shadow: 0 7px 18px rgba(0,0,0,.20);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .04em;
}
.rwa-about-identity-copy { min-width: 0; }
.rwa-about-title {
  margin: 0 0 4px;
  color: var(--rwa-wc-text);
  font-size: 14px;
  line-height: 1.2;
  font-weight: 760;
  letter-spacing: -.01em;
}
.rwa-about-subtitle {
  margin: 0;
  color: var(--rwa-wc-muted);
  font-size: 10.4px;
  line-height: 1.45;
}
.rwa-about-status {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 0 9px;
  border: 1px solid rgba(5,196,107,.18);
  border-radius: 999px;
  color: rgba(150,235,190,.82);
  background: rgba(5,196,107,.035);
  font-size: 9.2px;
  font-weight: 680;
  white-space: nowrap;
}

.rwa-about-release {
  min-width: 0;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(209,154,69,.17);
  border-radius: 12px;
  background:
    radial-gradient(circle at 88% 0%, rgba(209,154,69,.075), transparent 36%),
    linear-gradient(180deg, rgba(209,154,69,.030), rgba(255,255,255,.010));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa-about-release-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rwa-about-release-badge {
  flex: 0 0 auto;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(209,154,69,.28);
  border-radius: 999px;
  background: rgba(209,154,69,.08);
  color: var(--rwa-brand);
  font-size: 9.2px;
  font-weight: 800;
  letter-spacing: .04em;
}
.rwa-about-feature-rail {
  position: relative;
  height: 3px;
  margin: 11px 0 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.04);
}
.rwa-about-feature-runner {
  position: absolute;
  inset: 0 auto 0 0;
  width: 32%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, rgba(209,154,69,.40), var(--rwa-brand), rgba(255,112,67,.70), transparent);
  box-shadow: 0 0 12px rgba(209,154,69,.18);
  animation: rwa-feature-sweep 2.8s cubic-bezier(.42,0,.24,1) infinite;
}
.rwa-about-highlight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 9px;
}
.rwa-about-highlight-card {
  min-width: 0;
  min-height: 104px;
  padding: 11px 12px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 10px;
  background: rgba(255,255,255,.016);
}
.rwa-about-highlight-card strong {
  display: block;
  margin-bottom: 5px;
  color: var(--rwa-wc-text-2);
  font-size: 10.3px;
  line-height: 1.35;
  font-weight: 740;
}
.rwa-about-highlight-card span {
  display: block;
  color: var(--rwa-wc-muted);
  font-size: 9.7px;
  line-height: 1.52;
}

.rwa-about-section {
  min-width: 0;
  margin-top: 20px;
}
.rwa-about-section-kicker {
  margin-bottom: 7px;
  color: var(--rwa-brand);
  font-size: 8.4px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .12em;
}
.rwa-about-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 11px;
}
.rwa-about-section-title {
  margin: 0;
  color: var(--rwa-wc-text);
  font-size: 13.5px;
  line-height: 1.3;
  font-weight: 750;
  letter-spacing: -.008em;
}
.rwa-about-section-note {
  margin: 4px 0 0;
  color: var(--rwa-wc-muted);
  font-size: 10px;
  line-height: 1.48;
}
.rwa-about-baseline {
  flex: 0 0 auto;
  min-height: 25px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 999px;
  background: rgba(255,255,255,.018);
  color: var(--rwa-wc-subtle);
  font-size: 9px;
  font-weight: 680;
  white-space: nowrap;
}

.rwa-about-evolution-list {
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.072);
  border-radius: 11px;
  background: rgba(255,255,255,.012);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.014);
}
.rwa-about-evolution-row {
  display: grid;
  grid-template-columns: 34px 170px minmax(0,1fr);
  align-items: start;
  gap: 13px;
  min-height: 58px;
  padding: 12px 13px;
}
.rwa-about-evolution-row + .rwa-about-evolution-row {
  border-top: 1px solid rgba(255,255,255,.052);
}
.rwa-about-evolution-index {
  color: var(--rwa-brand);
  font-size: 9px;
  line-height: 1.5;
  font-weight: 820;
  letter-spacing: .07em;
}
.rwa-about-evolution-title {
  color: var(--rwa-wc-text-2);
  font-size: 10.6px;
  line-height: 1.48;
  font-weight: 730;
}
.rwa-about-evolution-detail {
  color: var(--rwa-wc-muted);
  font-size: 10px;
  line-height: 1.52;
}

.rwa-credits-container {
  display: grid;
  gap: 12px;
}
.rwa-credits-hero {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 7px;
  padding: 18px 20px 16px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% -20%, rgba(209,154,69,.11), transparent 48%),
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.012));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
}
.rwa-credits-mark {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 1px;
  border-radius: 13px;
  color: #17120a;
  background: var(--rwa-brand);
  box-shadow: 0 10px 24px rgba(0,0,0,.24);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .04em;
}
.rwa-credits-eyebrow {
  color: var(--rwa-brand);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .13em;
  text-transform: uppercase;
}
.rwa-credits-title {
  margin: 1px 0 0;
  color: var(--rwa-wc-text);
  font-size: 14px;
  line-height: 1.28;
  font-weight: 760;
  letter-spacing: -.01em;
}
.rwa-credits-note {
  max-width: 540px;
  margin: 0;
  color: var(--rwa-wc-muted);
  font-size: 10.2px;
  line-height: 1.52;
}

.rwa-credit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  grid-auto-rows: 1fr;
  gap: 12px;
  align-items: stretch;
}
.rwa-credit-card {
  position: relative;
  min-width: 0;
  height: 100%;
  padding: 15px 16px 16px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,.020), rgba(255,255,255,.012));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa-credit-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 15px;
  right: 15px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
}
.rwa-credit-card-special {
  border-color: rgba(209,154,69,.25);
  background: linear-gradient(180deg, rgba(209,154,69,.055), rgba(209,154,69,.024));
}
.rwa-credit-card-special::before {
  background: linear-gradient(90deg, transparent, rgba(209,154,69,.30), transparent);
}
.rwa-credit-label {
  margin-bottom: 8px;
  color: var(--rwa-wc-subtle);
  font-size: 8.4px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .115em;
  text-transform: uppercase;
}
.rwa-credit-card-special .rwa-credit-label { color: rgba(224,177,100,.72); }
.rwa-credit-name {
  margin-bottom: 8px;
  color: var(--rwa-wc-text-2);
  font-size: 11.2px;
  line-height: 1.32;
  font-weight: 760;
}
.rwa-credit-card-special .rwa-credit-name { color: var(--rwa-brand); }
.rwa-credit-card p {
  margin: 0;
  color: var(--rwa-wc-muted);
  font-size: 10.1px;
  line-height: 1.58;
}

/* --------------------------------------------------------------------------
   Responsive behavior
   -------------------------------------------------------------------------- */
@media (max-width: 760px) {
  .rwa-about-identity {
    grid-template-columns: 44px minmax(0,1fr);
  }
  .rwa-about-status {
    grid-column: 2;
    justify-self: start;
  }
  .rwa-about-release-head {
    flex-direction: column;
    gap: 8px;
  }
  .rwa-about-highlight-grid {
    grid-template-columns: 1fr;
  }
  .rwa-about-section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .rwa-about-evolution-row {
    grid-template-columns: 28px minmax(0,1fr);
    gap: 4px 10px;
  }
  .rwa-about-evolution-detail {
    grid-column: 2;
  }
  .rwa-credit-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
  .rwa-credits-hero {
    padding: 16px 14px 14px;
  }

  .rwa-settings-win {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
    height: calc(100vh - 16px) !important;
    max-height: calc(100vh - 16px) !important;
    min-height: 0;
  }
  .rwa-settings-hdr { height: 64px; min-height: 64px !important; flex-basis: 64px; padding: 0 14px !important; }
  .rwa-settings-shell { grid-template-columns: 1fr; grid-template-rows: auto minmax(0,1fr); }
  .rwa-settings-sidebar {
    display: block;
    padding: 8px;
    border-right: 0;
    border-bottom: 1px solid var(--rwa-wc-border);
    overflow-x: auto;
    white-space: nowrap;
  }
  .rwa-settings-nav-label { display: none; }
  .rwa-settings-nav { display: inline-flex; flex-direction: row; gap: 4px; }
  .rwa-settings-nav-btn {
    width: auto;
    min-width: 42px;
    min-height: 38px;
    display: inline-flex;
    grid-template-columns: none;
    padding: 5px 8px;
  }
  .rwa-settings-nav-copy small { display: none; }
  .rwa-settings-nav-about { display: inline-flex; margin-top: 0; margin-left: 4px; }
  .rwa-settings-page-head { padding: 16px 16px 13px; }
  .rwa-settings-page-title { font-size: 18px; }
  .rwa-settings-body { padding: 16px !important; }
  .rwa-settings-foot { padding: 10px 12px !important; }
  .rwa-form-row,
  .rwa-form-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
  .rwa-request-note { margin-left: 0 !important; }
}

@media (max-width: 460px) {
  .rwa-popup-main {
    width: calc(100vw - 12px);
    min-width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px);
    padding: 10px !important;
  }
  .rwa-command-section,
  .rwa-context-section { padding: 9px; }
  .rwa-profile-btn { height: 38px !important; min-height: 38px !important; }
  .rwa-context-section-head { align-items: flex-start; }
  .rwa-context-subtitle { display: none; }
  .rwa-merged-row { grid-template-columns: 1fr !important; }
  .rwa-depth-side { grid-template-columns: 1fr 48px; padding-left: 0; border-left: 0; }
  .rwa-context-primary { grid-template-columns: 1fr; }
  .rwa-context-primary-note { display: none; }
  .rwa-settings-nav-copy { display: none; }
  .rwa-settings-nav-btn { padding: 5px 7px; }
  .rwa-settings-foot { align-items: stretch; flex-direction: column; }
  .rwa-settings-foot-leading,
  .rwa-settings-foot-trailing { width: 100%; }
  .rwa-settings-foot .rwa-btn { flex: 1; min-width: 0; }
  .rwa-profile-row { grid-template-columns: 26px minmax(0,1fr); }
  .rwa-profile-actions { grid-column: 2; grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
  .rwa-profile-actions .rwa-btn { width: 100% !important; min-width: 0 !important; }
}

@media (prefers-reduced-motion: reduce) {
  .rwa-activity-runner,
  .rwa-about-feature-runner { animation: none !important; transform: none !important; width: 100%; opacity: .55; }

  .rwa-popup-main,
  .rwa-popup-main *,
  .rwa-settings-win,
  .rwa-settings-win * {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
`;

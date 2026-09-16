export const RWA_WORLDCLASS_CSS = `
/* v3.0.1 visual system pass: calm floating-tool palette, 4px rhythm, compositor drag. */
:host {
  --rwa-wc-bg: rgba(17, 17, 22, 0.965);
  --rwa-wc-surface: rgba(255, 255, 255, 0.032);
  --rwa-wc-surface-hover: rgba(255, 255, 255, 0.055);
  --rwa-wc-border: rgba(255, 255, 255, 0.085);
  --rwa-wc-border-strong: rgba(255, 255, 255, 0.14);
  --rwa-wc-text: rgba(255, 255, 255, 0.92);
  --rwa-wc-muted: rgba(255, 255, 255, 0.52);
  --rwa-wc-subtle: rgba(255, 255, 255, 0.34);
  --rwa-wc-radius-lg: 14px;
  --rwa-wc-radius-md: 10px;
}

/* Floating palette shell */
.rwa-popup-main {
  width: min(424px, calc(100vw - 16px));
  min-width: min(424px, calc(100vw - 16px)) !important;
  max-width: min(424px, calc(100vw - 16px));
  padding: 12px !important;
  gap: 8px !important;
  border-radius: var(--rwa-wc-radius-lg) !important;
  border: 1px solid var(--rwa-wc-border) !important;
  background: var(--rwa-wc-bg) !important;
  box-shadow: 0 18px 52px rgba(0,0,0,.54), 0 1px 0 rgba(255,255,255,.045) inset !important;
  backdrop-filter: blur(16px) saturate(112%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(112%) !important;
  animation-duration: .16s !important;
  will-change: transform;
}
.rwa-popup-main.rwa-dragging-active {
  animation: none !important;
  transition: none !important;
  will-change: transform;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: rgba(17,17,22,.992) !important;
  box-shadow: 0 12px 34px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.04) !important;
}
.rwa-popup-main .rwa-glow-button::before { display: none !important; }
.rwa-popup-main .rwa-btn:hover,
.rwa-popup-main .rwa-pb:hover { transform: none !important; }
.rwa-popup-main .rwa-btn:active,
.rwa-popup-main .rwa-pb:active { transform: scale(.985) !important; }

/* Title bar: one clear brand line, quiet utility actions, full-width drag target. */
.rwa-header-drag-zone {
  min-height: 36px;
  margin: -2px 0 0 !important;
  padding: 0 2px !important;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.rwa-header-drag-zone:active { cursor: grabbing; }
.rwa-mini-hdr.rwa-drag-handle {
  min-height: 36px;
  padding: 0 !important;
  margin: 0 !important;
}
.rwa-mini-brand { display: flex; align-items: center; gap: 7px; min-width: 0; }
.rwa-mini-title {
  font-size: 11.5px !important;
  line-height: 1;
  font-weight: 760 !important;
  letter-spacing: .055em !important;
  text-transform: uppercase !important;
  color: var(--rwa-wc-text) !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  -webkit-text-fill-color: currentColor !important;
  text-shadow: none !important;
}
.rwa-version-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  color: var(--rwa-primary);
  background: rgba(255,140,0,.09);
  border: 1px solid rgba(255,140,0,.18);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .04em;
}
.rwa-mini-actions { gap: 4px !important; }
.rwa-mini-action {
  width: 28px !important;
  height: 28px !important;
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
.rwa-mini-action-active { color: var(--rwa-primary) !important; background: rgba(255,140,0,.08) !important; }

/* Rewrite actions: readable two-column palette instead of narrow truncated chips. */
.rwa-profile-grid {
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 2px 4px 0 !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.12) transparent;
  overscroll-behavior: contain;
}
.rwa-profile-grid::-webkit-scrollbar { width: 5px; }
.rwa-profile-grid::-webkit-scrollbar-track { background: transparent; }
.rwa-profile-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 99px; }
.rwa-profile-btn {
  height: 40px !important;
  min-height: 40px !important;
  padding: 0 12px !important;
  border-radius: var(--rwa-wc-radius-md) !important;
  border-color: var(--rwa-wc-border) !important;
  background: var(--rwa-wc-surface) !important;
  color: rgba(255,255,255,.78) !important;
  box-shadow: none !important;
  transition: background-color .12s ease, border-color .12s ease, color .12s ease !important;
}
.rwa-profile-btn:hover {
  background: var(--rwa-wc-surface-hover) !important;
  border-color: rgba(255,140,0,.30) !important;
  color: #fff !important;
}
.rwa-profile-name {
  min-width: 0;
  width: 100%;
  font-size: 11.5px !important;
  line-height: 1.2 !important;
  font-weight: 650;
  letter-spacing: .005em;
  text-align: left !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Context is a secondary inspector: lower contrast, stronger alignment, fewer competing accents. */
.rwa-bottom-controls { margin-top: 2px; }
.rwa-radar-container { border-top: 1px solid rgba(255,255,255,.065); padding-top: 10px; }
.rwa-radar-header { min-height: 26px !important; gap: 8px !important; align-items: center !important; }
.rwa-radar-title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.rwa-radar-kicker {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: .075em;
  color: rgba(255,255,255,.72);
}
.rwa-info-icon { opacity: .42; filter: grayscale(1); }
.rwa-radar-target {
  min-width: 0 !important;
  padding: 4px 8px !important;
  border-radius: 999px !important;
  border: 1px solid var(--rwa-wc-border) !important;
  background: rgba(255,255,255,.025) !important;
  color: var(--rwa-wc-muted) !important;
  font-size: 9.5px !important;
  line-height: 1 !important;
  white-space: nowrap;
  box-shadow: none !important;
}
.rwa-token-panel {
  min-height: 18px !important;
  padding: 1px 1px 7px !important;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--rwa-wc-muted) !important;
}
.rwa-token-total { color: var(--rwa-wc-muted) !important; font-size: 9.5px !important; font-weight: 560 !important; }
.rwa-token-part { display: none !important; }
.rwa-panel-compact {
  padding: 10px !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255,255,255,.065) !important;
  background: rgba(255,255,255,.022) !important;
  box-shadow: none !important;
}
.rwa-context-primary {
  min-height: 30px !important;
  margin: 0 0 8px !important;
  padding: 0 2px 8px !important;
  border-bottom: 1px solid rgba(255,255,255,.055) !important;
}
.rwa-context-primary > label,
.rwa-context-switch-grid > label {
  width: 100%;
  min-height: 28px;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 10px !important;
}
.rwa-context-switch-grid {
  grid-template-columns: repeat(2, minmax(0,1fr)) !important;
  gap: 4px 16px !important;
  align-items: center;
}
.rwa-context-switch-grid > label > span { font-size: 11px !important; font-weight: 600 !important; color: rgba(255,255,255,.72) !important; }
.rwa-tog-wrap { width: 30px !important; height: 17px !important; }
.rwa-tog-sl:before { height: 11px !important; width: 11px !important; }
.rwa-tog-wrap input:checked + .rwa-tog-sl:before { transform: translateX(13px) !important; }

.rwa-one-shot-context {
  margin-top: 8px !important;
  padding-top: 8px !important;
  border-top: 1px solid rgba(255,255,255,.045);
  gap: 5px !important;
}
.rwa-one-shot-label { color: var(--rwa-wc-subtle) !important; font-size: 9px !important; }
.rwa-context-chip {
  min-height: 22px !important;
  padding: 0 7px !important;
  border-radius: 999px !important;
  font-size: 9px !important;
  background: rgba(255,255,255,.025) !important;
  border-color: rgba(255,255,255,.075) !important;
}

.rwa-merged-row {
  grid-template-columns: minmax(0,1fr) 92px !important;
  gap: 12px !important;
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px solid rgba(255,255,255,.055);
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
.rwa-len-lbl, .rwa-depth-lbl { color: var(--rwa-wc-muted) !important; font-size: 9.5px !important; font-weight: 700 !important; }
.rwa-len-val { min-width: 38px !important; font-size: 10px !important; color: var(--rwa-primary) !important; text-align: right; }
.rwa-len-range { min-width: 0; }
.rwa-depth-side { display: grid !important; grid-template-columns: auto 44px; gap: 6px; align-items: center; min-width: 0 !important; }
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

/* Footer forms one command bar with clear primary/secondary weight. */
.rwa-popup-foot {
  grid-template-columns: 32px 32px minmax(0,1.15fr) minmax(0,1fr) !important;
  gap: 6px !important;
  margin-top: 2px !important;
  padding-top: 10px !important;
  border-top: 1px solid rgba(255,255,255,.065);
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
  color: var(--rwa-primary) !important;
  border-color: rgba(255,140,0,.24) !important;
  background: rgba(255,140,0,.055) !important;
}
.rwa-popup-foot .rwa-btn:hover:not(:disabled) { background: var(--rwa-wc-surface-hover) !important; border-color: var(--rwa-wc-border-strong) !important; color: #fff !important; }
.rwa-popup-foot .rwa-btn-custom:hover:not(:disabled) { background: rgba(255,140,0,.095) !important; border-color: rgba(255,140,0,.34) !important; color: var(--rwa-primary) !important; }
.rwa-popup-foot .rwa-btn:disabled { opacity: .18 !important; }
.rwa-btn-icon-square { padding: 0 !important; }

@media (max-width: 460px) {
  .rwa-popup-main { width: calc(100vw - 12px); min-width: calc(100vw - 12px) !important; max-width: calc(100vw - 12px); padding: 10px !important; }
  .rwa-profile-btn { height: 38px !important; min-height: 38px !important; }
  .rwa-merged-row { grid-template-columns: 1fr !important; }
  .rwa-depth-side { grid-template-columns: 1fr 48px; }
}

@media (prefers-reduced-motion: reduce) {
  .rwa-popup-main, .rwa-popup-main * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;

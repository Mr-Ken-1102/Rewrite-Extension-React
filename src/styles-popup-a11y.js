export const RWA_POPUP_A11Y_CSS = `
/* Readability, target-size and keyboard-focus contract.
   Loaded after popup layout/context so these cross-cutting rules stay authoritative. */

.rwa2-version,
.rwa2-context-chip,
.rwa2-token-trigger,
.rwa2-token-popover-row,
.rwa2-token-popover-note,
.rwa2-token-popover-empty,
.rwa2-context-depth,
.rwa2-context-length-head > span {
  font-size: 11px !important;
}

.rwa2-performance-key { font-size: 10px; }
.rwa2-performance-meta { font-size: 11px; }
.rwa2-profile-name { font-size: 13px; }
.rwa2-context-detail-label { font-size: 10px; }

.rwa2-context-chip {
  min-height: 26px;
  padding: 0 9px;
}

.rwa2-brand-title { font-size: 12.5px; }
.rwa2-popup .rwa2-auto-profile,
.rwa2-popup .rwa2-action { font-size: 11.5px !important; }
.rwa2-multi-notice { font-size: 11px; }
.rwa2-tooltip { font-size: 11px; line-height: 1.45; }

.rwa2-popup :is(
  .rwa2-icon-button,
  .rwa2-profile-btn,
  .rwa2-performance-item,
  .rwa2-context-chip,
  .rwa2-token-trigger,
  .rwa2-context-toggle,
  .rwa2-action,
  .rwa2-depth-input
):focus-visible {
  outline: 2px solid rgba(209, 154, 69, .72);
  outline-offset: 2px;
}

.rwa2-popup .rwa-tog-wrap input:focus-visible + .rwa-tog-sl {
  outline: 2px solid rgba(209, 154, 69, .72);
  outline-offset: 2px;
}

.rwa2-range:focus-visible {
  outline: 2px solid rgba(209, 154, 69, .72);
  outline-offset: 2px;
  border-radius: 999px;
}

@media (prefers-contrast: more) {
  .rwa2-popup {
    --rwa2-border: rgba(255,255,255,.18);
    --rwa2-border-strong: rgba(255,255,255,.28);
    --rwa2-muted: rgba(255,255,255,.68);
    --rwa2-subtle: rgba(255,255,255,.54);
  }
}
`;

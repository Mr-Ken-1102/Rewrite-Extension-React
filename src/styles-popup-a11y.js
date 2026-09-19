export const RWA_POPUP_A11Y_CSS = `
/* Readability, target-size and keyboard-focus contract.
   Loaded after popup layout/context so these cross-cutting rules stay authoritative. */

.rwa2-version,
.rwa2-region-label,
.rwa2-section-meta,
.rwa2-recipe-title,
.rwa2-recipe-chip,
.rwa2-live-token,
.rwa2-inspector-total,
.rwa2-inspector-depth,
.rwa2-inspector-length-head > span {
  font-size: 11px !important;
}

.rwa2-live-key { font-size: 11px; }
.rwa2-live-label { font-size: 11px; }
.rwa2-profile-name { font-size: 13px; }
.rwa2-token-cell { font-size: 11px; }
.rwa2-inspector-note,
.rwa2-inspector-empty,
.rwa2-inspector-subtitle { font-size: 11px; }

.rwa2-recipe-chip {
  min-height: 27px;
  padding: 0 9px;
}

.rwa2-brand-title { font-size: 12.5px; }
.rwa2-section-title { font-size: 12.5px; }
.rwa2-popup .rwa2-auto-profile,
.rwa2-popup .rwa2-action { font-size: 11.5px !important; }
.rwa2-multi-notice { font-size: 11px; }
.rwa2-tooltip { font-size: 11px; line-height: 1.45; }

.rwa2-popup :is(
  .rwa2-icon-button,
  .rwa2-identity-chip-profile,
  .rwa2-profile-btn,
  .rwa2-live-control,
  .rwa2-live-token,
  .rwa2-recipe-chip,
  .rwa2-inspector-close,
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

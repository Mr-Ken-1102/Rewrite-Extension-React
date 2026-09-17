export const RWA_POPUP_A11Y_CSS = `
/* Phase D.1: readability and keyboard-focus contract.
   Loaded after popup layout/context so these cross-cutting rules are authoritative. */

.rwa2-version,
.rwa2-kicker,
.rwa2-region-label,
.rwa2-section-meta,
.rwa2-target-chip,
.rwa2-free-note,
.rwa2-one-shot-label,
.rwa2-chip,
.rwa2-control-label,
.rwa2-length-value {
  font-size: 10px !important;
}

.rwa2-profile-name {
  font-size: 12px;
}

.rwa2-token-status {
  font-size: 12px;
  line-height: 1.2;
}

.rwa2-free-note {
  line-height: 1.3;
}

.rwa2-chip {
  min-height: 22px;
  padding: 0 7px;
}

.rwa2-popup :is(
  .rwa2-icon-button,
  .rwa2-info,
  .rwa2-auto-profile,
  .rwa2-profile-btn,
  .rwa2-chip,
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

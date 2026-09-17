export const RWA_RESULT_CSS = `
.rwar-window {
  width: min(600px, calc(100vw - 24px)) !important;
  max-width: min(600px, calc(100vw - 24px)) !important;
  max-height: min(760px, calc(100vh - 24px)) !important;
  border-radius: 15px !important;
  background: #121218 !important;
  box-shadow: 0 22px 64px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.035) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.rwar-window .rwa-hdr {
  min-height: 54px !important;
  padding: 11px 16px !important;
}

.rwar-window .rwa-title {
  font-size: 13px !important;
  color: #d19a45 !important;
}

.rwar-body {
  height: auto !important;
  min-height: 0 !important;
  max-height: calc(100vh - 96px) !important;
  padding: 16px 18px 14px !important;
  overflow-y: auto !important;
  contain: layout paint;
}

.rwar-section {
  min-width: 0;
  margin: 0 0 12px;
}

.rwar-label {
  margin: 0 !important;
  color: #d19a45 !important;
  font-size: 9.5px !important;
  line-height: 1.2;
  font-weight: 800 !important;
  letter-spacing: .045em;
  text-transform: uppercase;
}

.rwar-section-head {
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.rwar-original,
.rwar-selected,
.rwar-result-preview,
.rwar-merged {
  margin: 6px 0 0 !important;
  padding: 11px 13px !important;
  border-radius: 9px !important;
  line-height: 1.55 !important;
  resize: none !important;
}

.rwar-original {
  max-height: 96px !important;
  color: rgba(255,255,255,.68) !important;
}

.rwar-selected {
  max-height: 180px !important;
  color: rgba(255,255,255,.84) !important;
}

.rwar-result-preview {
  min-height: 84px;
  max-height: 190px !important;
  color: rgba(255,255,255,.88) !important;
  font-size: 12.5px !important;
}

.rwar-merged {
  max-height: 260px !important;
}

.rwar-message-piece + .rwar-message-piece {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.055);
}

.rwar-message-label { margin-bottom: 5px !important; }
.rwar-message-text { white-space: pre-wrap; font-size: 12px; line-height: 1.55; }

.rwar-word-delta {
  flex: 0 0 auto;
  color: rgba(209,154,69,.88);
  font-size: 10px;
  line-height: 1;
  font-weight: 720;
  white-space: nowrap;
}

.rwar-diff-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -1px 0 6px;
  color: rgba(255,255,255,.44);
  font-size: 9px;
}
.rwar-added::before,
.rwar-removed::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  vertical-align: 1px;
}
.rwar-added::before { background: var(--rwa-accent); }
.rwar-removed::before { background: var(--rwa-coral); }
.rwar-diff-add { color: var(--rwa-accent); font-weight: 700; }
.rwar-diff-remove { color: var(--rwa-coral); text-decoration: line-through; opacity: .64; }

.rwar-diff-loading {
  min-height: 58px;
  display: grid;
  align-content: center;
  gap: 9px;
  text-align: center;
  color: rgba(255,255,255,.48);
  font-size: 10px;
}

.rwar-raw-section {
  margin-bottom: 0;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.055);
}

.rwar-recovery-note {
  color: rgba(255,255,255,.42);
  font-size: 9.5px;
  line-height: 1;
  white-space: nowrap;
}

.rwar-raw {
  min-height: 92px !important;
  max-height: 190px !important;
  margin: 6px 0 0 !important;
  padding: 11px 13px !important;
  border-radius: 9px !important;
  resize: vertical !important;
  white-space: pre-wrap;
  font-family: inherit !important;
  font-size: 11.5px !important;
  line-height: 1.5 !important;
}

.rwar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.055);
}

.rwar-actions-primary,
.rwar-actions-tools {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.rwar-actions-tools { margin-left: auto; }

.rwar-actions .rwa-btn,
.rwar-loading-actions .rwa-btn {
  min-height: 34px !important;
  height: 34px !important;
  margin: 0 !important;
  padding: 0 11px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  font-size: 10.5px !important;
  white-space: nowrap;
}

.rwar-actions .rwar-accept { min-width: 96px; }

/* Replace All has broader scope than Accept, so it stays deliberately secondary.
   The legacy green treatment competed with the primary confirmation action. */
.rwar-actions .rwa-replace {
  background: rgba(255,255,255,.025) !important;
  color: rgba(255,255,255,.78) !important;
  border-color: rgba(255,255,255,.12) !important;
  box-shadow: none !important;
}
.rwar-actions .rwa-replace:hover:not(:disabled) {
  background: rgba(255,255,255,.055) !important;
  color: rgba(255,255,255,.94) !important;
  border-color: rgba(209,154,69,.28) !important;
}

.rwar-progress,
.rwar-apply-report {
  margin: 0 0 12px !important;
  padding: 9px 11px !important;
  font-size: 10.5px !important;
  line-height: 1.45 !important;
  resize: none !important;
}
.rwar-progress-active { color: #d19a45 !important; }
.rwar-apply-report { border-color: rgba(209,154,69,.30) !important; }

.rwar-writing {
  padding: 4px 0 12px;
}
.rwar-writing-copy {
  margin-top: 8px;
  color: rgba(255,255,255,.42);
  font-size: 9.5px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .09em;
  text-align: center;
  text-transform: uppercase;
}
.rwar-loading-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.055);
}

@media (max-width: 620px) {
  .rwar-body { padding: 14px !important; }
  .rwar-actions { align-items: stretch; flex-direction: column; }
  .rwar-actions-primary,
  .rwar-actions-tools { width: 100%; }
  .rwar-actions-primary .rwa-btn,
  .rwar-actions-tools .rwa-btn { flex: 1 1 0; min-width: 0; }
  .rwar-actions-tools { margin-left: 0; }
}

@media (max-width: 440px) {
  .rwar-actions-primary,
  .rwar-actions-tools { flex-wrap: wrap; }
  .rwar-actions .rwa-btn { flex: 1 1 calc(50% - 4px); }
}

@media (prefers-reduced-motion: reduce) {
  .rwar-window *, .rwar-window { transition: none !important; animation-duration: .001ms !important; }
}
`;

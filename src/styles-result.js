export const RWA_RESULT_CSS = `
@keyframes rwar-result-arrive {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes rwar-ready-sweep {
  0% { transform: translateX(-130%); opacity: .25; }
  45% { opacity: 1; }
  72%, 100% { transform: translateX(320%); opacity: .2; }
}
@keyframes rwar-working-sweep {
  0% { transform: translateX(-125%); opacity: .35; }
  55% { transform: translateX(150%); opacity: 1; }
  100% { transform: translateX(150%); opacity: .35; }
}

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
  box-sizing: border-box !important;
  height: 46px !important;
  min-height: 46px !important;
  padding: 7px 14px !important;
}

.rwar-window .rwa-btn-close {
  width: 30px !important;
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 !important;
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

.rwar-ready-rail {
  position: relative;
  height: 3px;
  margin: -3px 0 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.04);
}
.rwar-ready-rail > span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 30%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #d19a45, #ff7043, transparent);
  box-shadow: 0 0 10px rgba(209,154,69,.20);
  animation: rwar-ready-sweep 1.85s cubic-bezier(.42,0,.24,1) 1;
}
.rwar-window-ready .rwar-section,
.rwar-window-ready .rwar-actions {
  animation: rwar-result-arrive .22s cubic-bezier(.16,1,.3,1) both;
}
.rwar-window-ready .rwar-actions { animation-delay: .04s; }

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
  font-size: 13px !important;
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
.rwar-message-text { white-space: pre-wrap; font-size: 13px; line-height: 1.55; }

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
  font-size: 13px !important;
  line-height: 1.55 !important;
}

.rwar-actions {
  box-sizing: border-box;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.055);
}

.rwar-actions-primary,
.rwar-actions-tools {
  display: contents;
}

.rwar-actions .rwa-btn,
.rwar-loading-actions .rwa-btn {
  min-width: 0;
  min-height: 34px !important;
  height: 34px !important;
  flex: 1 1 0;
  margin: 0 !important;
  padding: 0 9px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  font-size: 10px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rwar-actions .rwar-accept { flex-grow: 1.08; }
.rwar-actions .rwar-native-editor { flex-grow: 1.72; }
.rwar-actions .rwar-rewrite-again {
  flex-grow: 1.34;
  border-color: rgba(209,154,69,.28) !important;
  background: rgba(209,154,69,.055) !important;
  color: #d19a45 !important;
  font-weight: 720 !important;
}
.rwar-actions .rwar-rewrite-again:hover:not(:disabled) {
  border-color: rgba(209,154,69,.46) !important;
  background: rgba(209,154,69,.10) !important;
  color: #e3ad58 !important;
}

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

.rwar-stream-status {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 8px;
  padding: 5px 8px;
  border: 1px solid rgba(209,154,69,.22);
  border-radius: 999px;
  background: rgba(209,154,69,.06);
  color: rgba(255,255,255,.72);
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
}
.rwar-stream-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d19a45;
  box-shadow: 0 0 0 0 rgba(209,154,69,.35);
  animation: rwar-stream-pulse 1.15s ease-out infinite;
}
@keyframes rwar-stream-pulse {
  0% { box-shadow: 0 0 0 0 rgba(209,154,69,.35); }
  70% { box-shadow: 0 0 0 5px rgba(209,154,69,0); }
  100% { box-shadow: 0 0 0 0 rgba(209,154,69,0); }
}

.rwar-streaming-section {
  margin-bottom: 10px;
}
.rwar-streaming-result {
  min-height: 96px !important;
  max-height: 220px !important;
}

.rwar-writing {
  padding: 4px 0 12px;
}
.rwar-working-rail {
  position: relative;
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.045);
}
.rwar-working-rail > span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #d19a45, #ff7043, transparent);
  box-shadow: 0 0 12px rgba(209,154,69,.20);
  animation: rwar-working-sweep 1.35s cubic-bezier(.42,0,.22,1) infinite;
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
  .rwar-actions { flex-wrap: wrap; }
  .rwar-actions .rwa-btn { flex: 1 1 calc(33.333% - 5px); }
  .rwar-actions .rwar-native-editor { flex-basis: calc(50% - 4px); }
  .rwar-actions .rwar-accept { flex-basis: calc(50% - 4px); }
}

@media (max-width: 440px) {
  .rwar-actions .rwa-btn,
  .rwar-actions .rwar-native-editor,
  .rwar-actions .rwar-accept { flex: 1 1 calc(50% - 4px); }
}

@media (prefers-reduced-motion: reduce) {
  .rwar-window *, .rwar-window { transition: none !important; animation-duration: .001ms !important; }
  .rwar-ready-rail > span,
  .rwar-working-rail > span {
    animation: none !important;
    transform: none !important;
    width: 100%;
    opacity: .55;
  }
}
`;

export const RWA_DRAFT_REPLY_CSS = `
.rwa-draft-launcher {
  position: fixed;
  z-index: 10003;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--rwa-primary) 46%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--rwa-panel-bg) 92%, black 8%);
  color: var(--rwa-primary);
  box-shadow: 0 7px 20px rgba(0,0,0,.28), 0 0 14px color-mix(in srgb, var(--rwa-primary) 18%, transparent);
  font: 800 15px/1 var(--rwa-host-font, system-ui, sans-serif);
  cursor: pointer;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
}
.rwa-draft-launcher:hover, .rwa-draft-launcher:focus-visible {
  transform: translateY(-1px);
  border-color: var(--rwa-primary);
  background: color-mix(in srgb, var(--rwa-primary) 13%, var(--rwa-panel-bg));
  box-shadow: 0 9px 24px rgba(0,0,0,.34), 0 0 18px color-mix(in srgb, var(--rwa-primary) 28%, transparent);
  outline: none;
}
.rwa-draft-window { width: min(620px, calc(100vw - 24px)) !important; }
.rwa-draft-body { padding: 16px 18px 18px !important; overflow-y: auto; }
.rwa-draft-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
  margin-bottom: 12px;
}
.rwa-draft-persona-chip {
  min-width: 0;
  max-width: 62%;
  padding: 5px 9px;
  border: 1px solid color-mix(in srgb, var(--rwa-primary) 32%, transparent);
  border-radius: 999px;
  color: var(--rwa-primary);
  background: color-mix(in srgb, var(--rwa-primary) 7%, transparent);
  font-size: 10.5px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa-draft-profile-note {
  min-width: 0;
  color: rgba(255,255,255,.5);
  font-size: 9.5px;
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
  min-height: 32px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  background: rgba(255,255,255,.025);
  color: rgba(255,255,255,.65);
  font: 700 10.5px/1.2 var(--rwa-host-font, system-ui, sans-serif);
  cursor: pointer;
}
.rwa-draft-mode:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.86); }
.rwa-draft-mode-active {
  border-color: color-mix(in srgb, var(--rwa-primary) 55%, transparent);
  background: color-mix(in srgb, var(--rwa-primary) 10%, transparent);
  color: var(--rwa-primary);
}
.rwa-draft-direction {
  box-sizing: border-box;
  min-height: 118px !important;
  max-height: 260px;
  resize: vertical;
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 1.55 !important;
}
.rwa-draft-hint, .rwa-draft-success-note {
  margin-top: 7px;
  color: rgba(255,255,255,.48);
  font-size: 9.5px;
  line-height: 1.45;
}
.rwa-draft-edit-actions, .rwa-draft-error-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 7px;
  margin-top: 14px;
}
.rwa-draft-edit-actions .rwa-btn, .rwa-draft-error-actions .rwa-btn { width: 100%; min-height: 34px; }
.rwa-draft-generation { display: grid; gap: 10px; }
.rwa-draft-loading-copy {
  text-align: center;
  color: rgba(255,255,255,.58);
  font-size: 10.5px;
  font-weight: 700;
}
.rwa-draft-live, .rwa-draft-result {
  box-sizing: border-box;
  min-height: 112px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px !important;
  line-height: 1.55 !important;
}
.rwa-draft-single-action { display: flex; justify-content: center; margin-top: 2px; }
.rwa-draft-single-action .rwa-btn { min-width: 148px; }
.rwa-draft-error-title {
  margin-bottom: 8px;
  color: var(--rwa-coral);
  font-size: 11px;
  font-weight: 800;
}
.rwa-draft-source {
  min-height: 46px;
  max-height: 104px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 10.5px !important;
  line-height: 1.45 !important;
}
.rwa-draft-result-label { margin-top: 13px; }
.rwa-draft-actions {
  display: grid;
  grid-template-columns: 1.45fr 1.2fr .82fr .82fr .8fr .72fr;
  gap: 6px;
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.055);
}
.rwa-draft-actions .rwa-btn {
  min-width: 0;
  min-height: 34px;
  height: 34px;
  padding: 0 8px !important;
  font-size: 9.7px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 620px) {
  .rwa-draft-body { padding: 14px !important; }
  .rwa-draft-meta { align-items: flex-start; flex-direction: column; }
  .rwa-draft-persona-chip { max-width: 100%; }
  .rwa-draft-actions { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .rwa-draft-primary { grid-column: 1 / -1; }
}
`;

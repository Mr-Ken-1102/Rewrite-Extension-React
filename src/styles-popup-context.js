export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-performance-strip {
  min-height:42px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  align-items:stretch;
  margin:0;
  padding:4px 5px;
  border:1px solid rgba(226,161,59,.26);
  border-radius:11px;
  background:linear-gradient(180deg,rgba(226,161,59,.025),rgba(255,255,255,.006)),var(--rwa2-surface);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-performance-item {
  appearance:none;
  position:relative;
  min-width:0;
  min-height:32px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  padding:0 8px;
  border:0;
  background:transparent;
  color:var(--rwa2-muted);
  font:inherit;
  cursor:pointer;
  transition:color .12s ease,background-color .12s ease,opacity .12s ease;
}
.rwa2-performance-item + .rwa2-performance-item { border-left:1px solid rgba(255,255,255,.12); }
.rwa2-performance-item:hover:not(:disabled),
.rwa2-performance-item:focus-visible { background:rgba(226,161,59,.035); color:var(--rwa2-text); outline:none; }
.rwa2-performance-item:disabled { opacity:.34; cursor:not-allowed; }
.rwa2-performance-dot { width:5px; height:5px; flex:0 0 5px; border-radius:50%; background:rgba(255,255,255,.28); }
.rwa2-performance-on .rwa2-performance-dot { background:var(--rwa2-brand); box-shadow:0 0 8px rgba(226,161,59,.32); }
.rwa2-performance-key { min-width:0; overflow:hidden; color:rgba(255,255,255,.60); font-size:9px; line-height:1; font-weight:720; letter-spacing:.045em; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-performance-meta { flex:0 0 auto; color:rgba(255,255,255,.74); font-size:10px; line-height:1; font-weight:530; white-space:nowrap; }
.rwa2-performance-on .rwa2-performance-key,
.rwa2-performance-on .rwa2-performance-meta { color:var(--rwa2-brand); }
.rwa2-performance-divider { display:none; }

.rwa2-context-deck {
  position:relative;
  min-width:0;
  display:grid;
  gap:9px;
  overflow:visible;
  padding:10px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:13px;
  background:linear-gradient(180deg,rgba(255,255,255,.016),rgba(255,255,255,.005)),rgba(18,20,25,.78);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.02);
}
.rwa2-context-chips {
  min-width:0;
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  align-items:stretch;
  gap:7px;
  padding:0;
  border:0;
  overflow:visible;
}
.rwa2-context-chip {
  appearance:none;
  min-width:0;
  min-height:35px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:0 8px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:999px;
  background:rgba(255,255,255,.012);
  color:rgba(255,255,255,.43);
  font:580 10.5px/1 var(--rwa-host-font,system-ui,sans-serif);
  white-space:nowrap;
  cursor:pointer;
  transition:border-color .12s ease,background-color .12s ease,color .12s ease,transform .12s ease,opacity .12s ease;
}
.rwa2-context-chip:hover:not(:disabled),
.rwa2-context-chip:focus-visible { border-color:rgba(226,161,59,.35); background:rgba(226,161,59,.045); color:var(--rwa2-text); outline:none; }
.rwa2-context-chip:active:not(:disabled) { transform:translateY(1px); }
.rwa2-context-chip-icon { width:17px; height:17px; flex:0 0 17px; display:inline-grid; place-items:center; }
.rwa2-context-chip-on { border-color:rgba(226,161,59,.48); background:rgba(226,161,59,.055); color:var(--rwa2-brand); box-shadow:inset 0 0 0 1px rgba(226,161,59,.025); }
.rwa2-context-chip-off { color:rgba(255,255,255,.38); }
.rwa2-context-chip:disabled { opacity:.28; cursor:not-allowed; }

.rwa2-context-adjust-row {
  min-height:54px;
  display:grid;
  grid-template-columns:minmax(0,.78fr) 1px minmax(0,1.22fr);
  align-items:center;
  gap:10px;
  padding:7px 10px;
  border:1px solid rgba(255,255,255,.095);
  border-radius:11px;
  background:rgba(255,255,255,.008);
}
.rwa2-context-adjust-row::before { content:""; grid-column:2; width:1px; height:30px; background:rgba(255,255,255,.10); justify-self:center; }
.rwa2-context-depth {
  grid-column:1;
  min-width:0;
  display:grid;
  grid-template-columns:22px minmax(0,1fr) 54px;
  align-items:center;
  gap:8px;
  color:var(--rwa2-text-2);
  font-size:10.5px;
  font-weight:540;
}
.rwa2-adjust-icon { width:20px; height:20px; display:inline-grid; place-items:center; color:var(--rwa2-brand); }
.rwa2-adjust-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-depth-select-wrap { position:relative; width:54px; }
.rwa2-depth-input {
  appearance:none;
  -webkit-appearance:none;
  width:54px;
  min-width:54px;
  height:31px;
  margin:0;
  padding:0 22px 0 11px;
  border:1px solid var(--rwa2-border);
  border-radius:9px;
  outline:none;
  background:var(--rwa2-surface);
  color:var(--rwa2-text);
  font:640 10.5px/1 system-ui,sans-serif;
  cursor:pointer;
}
.rwa2-depth-input:focus { border-color:var(--rwa2-brand-border); }
.rwa2-depth-chevron { position:absolute; right:9px; top:50%; transform:translateY(-52%); color:var(--rwa2-brand); font-size:10px; pointer-events:none; }

.rwa2-context-length {
  grid-column:3;
  min-width:0;
  display:grid;
  grid-template-columns:auto minmax(70px,1fr) auto;
  align-items:center;
  gap:9px;
}
.rwa2-length-label { display:inline-flex; align-items:center; gap:7px; color:var(--rwa2-text-2); font-size:10.5px; font-weight:540; white-space:nowrap; }
.rwa2-range {
  min-width:0;
  width:100%;
  height:18px;
  margin:0;
  appearance:none;
  -webkit-appearance:none;
  background:transparent;
  cursor:pointer;
  outline:none;
}
.rwa2-range::-webkit-slider-runnable-track {
  height:5px;
  border-radius:99px;
  background:linear-gradient(90deg,rgba(226,161,59,.92),rgba(226,161,59,.92) 56%,rgba(255,255,255,.14) 56%,rgba(255,255,255,.14));
}
.rwa2-range::-webkit-slider-thumb {
  width:14px;
  height:14px;
  margin-top:-4.5px;
  appearance:none;
  -webkit-appearance:none;
  border:1px solid rgba(255,255,255,.16);
  border-radius:50%;
  background:var(--rwa2-brand);
  box-shadow:0 0 10px rgba(226,161,59,.20);
}
.rwa2-length-auto {
  appearance:none;
  min-width:47px;
  height:31px;
  padding:0 9px;
  border:1px solid var(--rwa2-border);
  border-radius:999px;
  background:var(--rwa2-surface);
  color:rgba(255,255,255,.70);
  font:560 10px/1 var(--rwa-host-font,system-ui,sans-serif);
  cursor:pointer;
}
.rwa2-length-auto:hover,
.rwa2-length-auto:focus-visible { border-color:var(--rwa2-brand-border); color:var(--rwa2-brand); outline:none; }
.rwa2-length-auto-active { color:var(--rwa2-text); background:rgba(255,255,255,.02); }

.rwa2-tooltip-token {
  width:min(286px,calc(100vw - 16px));
  max-width:min(286px,calc(100vw - 16px));
  display:grid;
  gap:7px;
  padding:10px 12px 11px;
  border-color:rgba(226,161,59,.30);
  border-radius:10px;
  background:radial-gradient(circle at 100% 0%,rgba(226,161,59,.07),transparent 42%),#15181d;
  box-shadow:0 16px 38px rgba(0,0,0,.54),inset 2px 0 0 rgba(226,161,59,.42),inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-tooltip-token-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.rwa2-tooltip-token-head > span { color:var(--rwa2-brand); font-size:11.2px; line-height:1.15; font-weight:760; }
.rwa2-tooltip-token-head > strong { color:rgba(255,255,255,.76); font-size:10.5px; font-weight:720; }
.rwa2-tooltip-token-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 12px; }
.rwa2-tooltip-token-row { min-width:0; display:flex; align-items:center; justify-content:space-between; gap:6px; color:rgba(255,255,255,.72); font-size:11px; line-height:1.35; }
.rwa2-tooltip-token-row > span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rwa2-tooltip-token-row > strong { flex:0 0 auto; color:rgba(255,255,255,.86); font-weight:700; font-variant-numeric:tabular-nums; }
.rwa2-tooltip-token-note { color:var(--rwa2-subtle); font-size:10.5px; line-height:1.35; }

`;

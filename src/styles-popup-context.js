export const RWA_POPUP_CONTEXT_CSS = `
.rwa2-performance-strip {
  min-height: 25px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  margin: 0 0 5px;
  padding: 0 0 4px;
  border-bottom: 1px solid rgba(209,154,69,.10);
}
.rwa2-performance-item {
  appearance: none;
  position: relative;
  min-width: 0;
  min-height: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 5px;
  border: 0;
  background: transparent;
  color: var(--rwa2-muted);
  font: inherit;
  cursor: pointer;
  transition: color .10s ease, background-color .10s ease, opacity .10s ease;
}
.rwa2-performance-item + .rwa2-performance-item { border-left: 1px solid rgba(209,154,69,.11); }
.rwa2-performance-item:hover:not(:disabled),
.rwa2-performance-item:focus-visible {
  background: rgba(209,154,69,.025);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-performance-item:disabled { opacity: .34; cursor: not-allowed; }
.rwa2-performance-dot {
  width: 4px;
  height: 4px;
  flex: 0 0 4px;
  border-radius: 50%;
  background: rgba(255,255,255,.20);
}
.rwa2-performance-on .rwa2-performance-dot {
  background: var(--rwa2-brand);
  box-shadow: 0 0 7px rgba(209,154,69,.25);
}
.rwa2-performance-key {
  min-width: 0;
  overflow: hidden;
  color: var(--rwa2-subtle);
  font-size: 8.5px;
  line-height: 1;
  font-weight: 820;
  letter-spacing: .06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-performance-meta {
  flex: 0 0 auto;
  color: var(--rwa2-muted);
  font-size: 9px;
  line-height: 1;
  font-weight: 640;
  white-space: nowrap;
}
.rwa2-performance-on .rwa2-performance-key,
.rwa2-performance-on .rwa2-performance-meta { color: var(--rwa2-brand); }
.rwa2-performance-divider { display: none; }

.rwa2-context-deck {
  position: relative;
  min-width: 0;
  overflow: visible;
  border: 1px solid rgba(209,154,69,.10);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,.008)),
    var(--rwa2-surface);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
}
.rwa2-context-identity-row {
  min-width: 0;
  min-height: 29px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-bottom: 1px solid rgba(255,255,255,.045);
}
.rwa2-identity-chip {
  min-width: 0;
  max-width: min(72%, 300px);
  height: 21px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border: 1px solid var(--rwa2-brand-border);
  border-radius: 999px;
  background: rgba(209,154,69,.035);
  color: var(--rwa2-brand);
  font: 690 10.5px/1 var(--rwa-host-font, system-ui, sans-serif);
}
.rwa2-identity-persona {
  border-color: rgba(139,183,223,.24);
  background: rgba(139,183,223,.075);
  color: #8bb7df;
}
.rwa2-identity-profile-ready {
  border-color: rgba(209,154,69,.42);
  background: rgba(209,154,69,.065);
  box-shadow: 0 0 10px rgba(209,154,69,.12), inset 0 0 0 1px rgba(209,154,69,.035);
}
.rwa2-identity-persona.rwa2-identity-profile-ready {
  border-color: rgba(139,183,223,.42);
  background: rgba(139,183,223,.095);
  box-shadow: 0 0 10px rgba(139,183,223,.13), inset 0 0 0 1px rgba(139,183,223,.04);
}
.rwa2-identity-profile-mark { flex: 0 0 auto; font-size: 9px; line-height: 1; }
.rwa2-identity-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rwa2-token-trigger {
  appearance: none;
  min-height: 21px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,.66);
  font: 690 10px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: help;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease;
}
.rwa2-token-trigger:hover,
.rwa2-token-trigger:focus-visible {
  border-color: rgba(209,154,69,.16);
  background: rgba(209,154,69,.032);
  color: var(--rwa2-brand);
  outline: none;
}
.rwa2-context-chips {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  border-bottom: 1px solid rgba(255,255,255,.045);
  overflow: visible;
}
.rwa2-context-chip {
  appearance: none;
  min-height: 24px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 7px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 999px;
  background: rgba(255,255,255,.012);
  color: var(--rwa2-muted);
  font: 650 10px/1 var(--rwa-host-font, system-ui, sans-serif);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .10s ease, background-color .10s ease, color .10s ease, opacity .10s ease;
}
.rwa2-context-chip:hover:not(:disabled),
.rwa2-context-chip:focus-visible {
  border-color: var(--rwa2-brand-border);
  background: rgba(209,154,69,.035);
  color: var(--rwa2-text);
  outline: none;
}
.rwa2-context-chip-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: rgba(255,255,255,.20);
}
.rwa2-context-chip-on {
  border-color: rgba(209,154,69,.24);
  background: rgba(209,154,69,.045);
  color: var(--rwa2-brand);
}
.rwa2-context-chip-on .rwa2-context-chip-dot {
  background: var(--rwa2-brand);
  box-shadow: 0 0 6px rgba(209,154,69,.20);
}
.rwa2-context-chip-off { color: var(--rwa2-subtle); }
.rwa2-context-chip-overridden { border-style: solid; }
.rwa2-context-chip:disabled { opacity: .30; cursor: not-allowed; }

.rwa2-context-adjust-row {
  display: grid;
  grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr);
  align-items: center;
  gap: 12px;
  padding: 5px 7px 6px;
}
.rwa2-context-depth {
  min-height: 29px;
  display: grid;
  grid-template-columns: minmax(0,1fr) 48px;
  align-items: center;
  gap: 7px;
  color: var(--rwa2-muted);
  font-size: 9.5px;
  font-weight: 650;
}
.rwa2-depth-input {
  width: 48px;
  min-width: 48px;
  height: 26px;
  margin: 0;
  padding: 3px 5px;
  border: 1px solid var(--rwa2-border);
  border-radius: 7px;
  outline: none;
  background: rgba(0,0,0,.16);
  color: var(--rwa2-text);
  font: 650 10px/1 system-ui, sans-serif;
  text-align: center;
}
.rwa2-depth-input:focus { border-color: var(--rwa2-brand-border); }
.rwa2-context-length { min-width: 0; }
.rwa2-context-length-head {
  min-height: 21px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}
.rwa2-context-length-head > span {
  color: var(--rwa2-text-2);
  font-size: 9.5px;
  font-weight: 700;
}
.rwa2-range {
  min-width: 0;
  width: 100%;
  height: 15px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}
.rwa2-range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 99px;
  background: rgba(255,255,255,.13);
}
.rwa2-range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  margin-top: -4.5px;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 50%;
  background: var(--rwa2-brand);
  box-shadow: none;
}
.rwa2-range:disabled { cursor: not-allowed; opacity: .45; }

.rwa2-popup .rwa-tog-wrap { width: 30px !important; height: 17px !important; flex: 0 0 30px !important; }
.rwa2-popup .rwa-tog-sl { background: rgba(255,255,255,.15) !important; box-shadow: none !important; }
.rwa2-popup .rwa-tog-sl:before { width: 11px !important; height: 11px !important; left: 3px !important; bottom: 3px !important; }
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl { background: var(--rwa2-brand) !important; box-shadow: none !important; }
.rwa2-popup .rwa-tog-wrap input:checked + .rwa-tog-sl:before { transform: translateX(13px) !important; }

.rwa2-tooltip-token {
  width: min(286px, calc(100vw - 16px));
  max-width: min(286px, calc(100vw - 16px));
  display: grid;
  gap: 7px;
  padding: 10px 12px 11px;
  border-color: rgba(209,154,69,.28);
  border-radius: 10px;
  background: radial-gradient(circle at 100% 0%, rgba(209,154,69,.07), transparent 42%), #17181e;
  box-shadow: 0 16px 38px rgba(0,0,0,.54), inset 2px 0 0 rgba(209,154,69,.42), inset 0 1px 0 rgba(255,255,255,.025);
}
.rwa2-tooltip-token-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rwa2-tooltip-token-head > span { color: var(--rwa2-brand); font-size: 11.2px; line-height: 1.15; font-weight: 760; }
.rwa2-tooltip-token-head > strong { color: rgba(255,255,255,.76); font-size: 10.5px; font-weight: 720; }
.rwa2-tooltip-token-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 4px 12px; }
.rwa2-tooltip-token-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: rgba(255,255,255,.72);
  font-size: 11px;
  line-height: 1.35;
}
.rwa2-tooltip-token-row > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwa2-tooltip-token-row > strong { flex: 0 0 auto; color: rgba(255,255,255,.86); font-weight: 700; font-variant-numeric: tabular-nums; }
.rwa2-tooltip-token-note { color: var(--rwa2-subtle); font-size: 10.5px; line-height: 1.35; }

`;

import {
  POPUP_COMPACT_BREAKPOINTS,
  POPUP_NORMAL_BREAKPOINTS,
  POPUP_NORMAL_MIN_CELL,
} from './popupGeometry';

export const RWA_POPUP_RESPONSIVE_CSS = `
.rwa2-cols-4 { grid-template-columns:repeat(4,minmax(${POPUP_NORMAL_MIN_CELL}px,1fr)); }

@media (max-width:${POPUP_NORMAL_BREAKPOINTS.fourToThree - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4 { grid-template-columns:repeat(3,minmax(${POPUP_NORMAL_MIN_CELL}px,1fr)); }
}
@media (max-width:${POPUP_NORMAL_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-3 { grid-template-columns:repeat(2,minmax(${POPUP_NORMAL_MIN_CELL}px,1fr)); }
  .rwa2-context-chips { grid-template-columns:repeat(3,minmax(0,1fr)); }
}
@media (max-width:${POPUP_NORMAL_BREAKPOINTS.twoToOne - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-3,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-2 { grid-template-columns:minmax(0,1fr); }
  .rwa2-context-chips { grid-template-columns:repeat(2,minmax(0,1fr)); }
}

@media (max-width:${POPUP_COMPACT_BREAKPOINTS.sixToFive - 1}px) { .rwa2-profile-grid-compact.rwa2-cols-6 { grid-template-columns:repeat(5,minmax(0,1fr)); } }
@media (max-width:${POPUP_COMPACT_BREAKPOINTS.fiveToFour - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5 { grid-template-columns:repeat(4,minmax(0,1fr)); }
}
@media (max-width:${POPUP_COMPACT_BREAKPOINTS.fourToThree - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5,
  .rwa2-profile-grid-compact.rwa2-cols-4 { grid-template-columns:repeat(3,minmax(0,1fr)); }
}
@media (max-width:${POPUP_COMPACT_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5,
  .rwa2-profile-grid-compact.rwa2-cols-4,
  .rwa2-profile-grid-compact.rwa2-cols-3 { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media (max-width:${POPUP_COMPACT_BREAKPOINTS.twoToOne - 1}px) { .rwa2-profile-grid-compact { grid-template-columns:minmax(0,1fr); } }

@media (max-width:459px) {
  .rwa2-context-adjust-row { grid-template-columns:minmax(0,1fr); gap:8px; }
  .rwa2-context-adjust-row::before { display:none; }
  .rwa2-context-depth,
  .rwa2-context-length { grid-column:1; }
}

@media (max-width:419px) {
  .rwa2-popup {
    width:calc(100vw - 12px);
    min-width:calc(100vw - 12px);
    max-width:calc(100vw - 12px);
    padding-left:8px;
    padding-right:8px;
  }
  .rwa2-brand-title { font-size:15px; }
  .rwa2-version { padding-inline:7px; }
  .rwa2-toolbar-actions { gap:4px; }
  .rwa2-icon-button { width:28px; height:28px; }
  .rwa2-trim-button { width:28px; min-width:28px; height:28px; padding:0; }
  .rwa2-performance-item { gap:4px; padding-inline:4px; }
  .rwa2-performance-key { letter-spacing:.03em; }
  .rwa2-profile-icon { width:18px; flex-basis:18px; }
  .rwa2-popup .rwa2-profile-btn { gap:7px !important; padding-inline:9px !important; }
  .rwa2-actionbar { grid-template-columns:50px 50px minmax(0,1fr) 32px; gap:4px; }
  .rwa2-popup .rwa2-action { font-size:10px !important; gap:4px !important; padding-inline:6px !important; }
}

@media (max-width:359px) {
  .rwa2-performance-meta { display:none; }
  .rwa2-context-chips { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .rwa2-status-row { gap:6px; }
  .rwa2-identity-chip { max-width:66%; padding-inline:9px; }
  .rwa2-token-trigger { font-size:11px; padding-left:8px; }
}

@media (prefers-reduced-motion:reduce) {
  .rwa2-popup *,
  .rwa2-tooltip { transition:none !important; animation:none !important; }
}

`;

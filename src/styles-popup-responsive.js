import {
  POPUP_COMPACT_BREAKPOINTS,
  POPUP_NORMAL_BREAKPOINTS,
  POPUP_NORMAL_MIN_CELL,
} from './popupGeometry';

export const RWA_POPUP_RESPONSIVE_CSS = `
@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.fourToThree - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4 {
    grid-template-columns: repeat(3, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr));
  }
}

@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-3 {
    grid-template-columns: repeat(2, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr));
  }
}

@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.twoToOne - 1}px) {
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-4,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-3,
  .rwa2-profile-grid:not(.rwa2-profile-grid-compact).rwa2-cols-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.sixToFive - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.fiveToFour - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.fourToThree - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5,
  .rwa2-profile-grid-compact.rwa2-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa2-profile-grid-compact.rwa2-cols-6,
  .rwa2-profile-grid-compact.rwa2-cols-5,
  .rwa2-profile-grid-compact.rwa2-cols-4,
  .rwa2-profile-grid-compact.rwa2-cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.twoToOne - 1}px) {
  .rwa2-profile-grid-compact { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 559px) {
  .rwa2-context-identity { grid-column: 1 / -1; }
  .rwa2-context-sources { grid-column: span 8; border-left: 0; border-top: 1px solid rgba(255,255,255,.055); }
  .rwa2-context-modifiers { grid-column: span 4; border-top: 1px solid rgba(255,255,255,.055); }
  .rwa2-undo { grid-column: 1 / span 2; }
  .rwa2-redo { grid-column: 3 / span 2; }
  .rwa2-custom { grid-column: 5 / span 4; }
  .rwa2-settings { grid-column: 9 / span 4; }
}

@media (max-width: 419px) {
  .rwa2-popup { width: calc(100vw - 12px); min-width: calc(100vw - 12px); max-width: calc(100vw - 12px); padding-left: 10px; padding-right: 10px; }
  .rwa2-context-identity,
  .rwa2-context-sources,
  .rwa2-context-modifiers { grid-column: 1 / -1; border-left: 0; }
  .rwa2-context-sources,
  .rwa2-context-modifiers { border-top: 1px solid rgba(255,255,255,.055); }
  .rwa2-free-note { display: none; }
  .rwa2-target-chip { max-width: 128px; }
  .rwa2-actionbar { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .rwa2-undo { grid-column: 1; }
  .rwa2-redo { grid-column: 2; }
  .rwa2-custom { grid-column: 1 / span 2; grid-row: 2; }
  .rwa2-settings { grid-column: 3 / span 2; grid-row: 2; }
}

@media (prefers-reduced-motion: reduce) {
  .rwa2-popup *,
  .rwa2-tooltip { transition: none !important; animation: none !important; }
}
`;

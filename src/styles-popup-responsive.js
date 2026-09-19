import {
  POPUP_COMPACT_BREAKPOINTS,
  POPUP_NORMAL_BREAKPOINTS,
  POPUP_NORMAL_MIN_CELL,
} from './popupGeometry';

export const RWA_POPUP_RESPONSIVE_CSS = `
.rwa2-cols-4 { grid-template-columns: repeat(4, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr)); }

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

@media (max-width: 459px) {
  .rwa2-context-adjust-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
}

@media (max-width: 419px) {
  .rwa2-popup {
    width: calc(100vw - 12px);
    min-width: calc(100vw - 12px);
    max-width: calc(100vw - 12px);
    padding-left: 8px;
    padding-right: 8px;
  }
  .rwa2-performance-item {
    gap: 4px;
    padding-inline: 5px;
  }
  .rwa2-performance-key { letter-spacing: .04em; }
  .rwa2-actionbar { gap: 4px; }
  .rwa2-popup .rwa2-custom {
    flex: 1 1 auto;
    width: auto !important;
    margin-left: 0 !important;
  }
}

@media (max-width: 359px) {
  .rwa2-performance-meta { display: none; }
  .rwa2-performance-item { padding-inline: 3px; }
}

@media (prefers-reduced-motion: reduce) {
  .rwa2-popup *,
  .rwa2-tooltip,
  .rwa2-context-collapse {
    transition: none !important;
    animation: none !important;
  }
}
`;

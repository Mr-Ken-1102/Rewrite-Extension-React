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
  .rwa2-context-control-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 7px;
  }
  .rwa2-context-adjust {
    padding-left: 0;
    padding-top: 7px;
    border-left: 0;
    border-top: 1px solid rgba(255,255,255,.045);
  }
  .rwa2-token-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 419px) {
  .rwa2-identity-chip { max-width: 112px; }
  .rwa2-popup {
    width: calc(100vw - 12px);
    min-width: calc(100vw - 12px);
    max-width: calc(100vw - 12px);
    padding-left: 8px;
    padding-right: 8px;
  }
  .rwa2-performance-item {
    gap: 4px;
    padding-left: 6px;
    padding-right: 6px;
  }
  .rwa2-performance-meta { font-size: 0 !important; }
  .rwa2-performance-meta::after {
    content: attr(data-short);
    font-size: 11px;
  }
  .rwa2-context-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
  .rwa2-token-trigger {
    width: 100%;
    max-width: none;
    justify-content: space-between;
  }
  .rwa2-context-source-grid { grid-template-columns: minmax(0,1fr); }
  .rwa2-actionbar {
    flex-wrap: wrap;
    gap: 4px;
  }
  .rwa2-popup .rwa2-custom {
    flex: 1 1 150px;
    width: auto !important;
    margin-left: 0 !important;
  }
  .rwa2-popup .rwa2-settings {
    flex: 0 1 96px;
    width: auto !important;
  }
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

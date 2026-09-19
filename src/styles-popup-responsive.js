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

@media (max-width: 559px) {
  .rwa2-token-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rwa2-inspector-controls { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .rwa2-inspector-parameters {
    padding-left: 0;
    padding-top: 8px;
    border-left: 0;
    border-top: 1px solid rgba(255,255,255,.045);
  }
}

@media (max-width: 459px) {
  .rwa2-live-rail {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 3px;
  }
  .rwa2-live-controls {
    justify-content: space-between;
  }
  .rwa2-live-token {
    width: 100%;
    max-width: none;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,.04);
    border-radius: 5px;
  }
  .rwa2-recipe {
    align-items: flex-start;
  }
}

@media (max-width: 419px) {
  .rwa2-identity-chip { max-width: 128px; }
  .rwa2-popup {
    width: calc(100vw - 12px);
    min-width: calc(100vw - 12px);
    max-width: calc(100vw - 12px);
    padding-left: 8px;
    padding-right: 8px;
  }
  .rwa2-live-label { display: none; }
  .rwa2-recipe-title { display: none; }
  .rwa2-inspector-source-grid { grid-template-columns: minmax(0,1fr); }
  .rwa2-token-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
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
  .rwa2-inspector {
    transition: none !important;
    animation: none !important;
  }
}
`;

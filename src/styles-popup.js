import {
  POPUP_COMPACT_BREAKPOINTS,
  POPUP_DESKTOP_WIDTH,
  POPUP_GRID_COLUMNS,
  POPUP_GRID_GAP,
  POPUP_NORMAL_BREAKPOINTS,
  POPUP_NORMAL_MIN_CELL,
  POPUP_OUTER_PADDING_X,
  POPUP_PROFILE_ROW_GAP,
} from './popupGeometry';

export const RWA_POPUP_CSS = `
/* v3.0.1 popup geometry contract.
   This layer owns popup dimensions and grid placement. Visual treatment remains
   in the shared design layers until Phase D retires legacy popup overrides. */

.rwa-popup-main {
  width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px)) !important;
  min-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px)) !important;
  max-width: min(${POPUP_DESKTOP_WIDTH}px, calc(100vw - 16px)) !important;
  padding: 8px ${POPUP_OUTER_PADDING_X}px !important;
  gap: 8px !important;
}

/* Transitional Phase-B wrapper becomes geometry-neutral in Phase C. */
.rwa-popup-workbench {
  display: contents !important;
}

.rwa-header-drag-zone,
.rwa-mini-hdr.rwa-drag-handle {
  min-height: 36px !important;
}

.rwa-rewrite-section,
.rwa-context-rail,
.rwa-popup-foot {
  width: 100%;
  min-width: 0;
}

.rwa-rewrite-section {
  padding: 0 !important;
}

.rwa-command-head {
  min-height: 28px !important;
  padding: 0 2px 6px !important;
  align-items: center !important;
}

.rwa-profile-grid {
  display: grid !important;
  gap: ${POPUP_PROFILE_ROW_GAP}px !important;
  margin: 0 !important;
  padding: 0 !important;
  min-width: 0;
  scrollbar-gutter: stable;
}

.rwa-profile-grid.rwa-profile-cols-1 { grid-template-columns: minmax(0, 1fr) !important; }
.rwa-profile-grid.rwa-profile-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.rwa-profile-grid.rwa-profile-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
.rwa-profile-grid.rwa-profile-cols-4 { grid-template-columns: repeat(4, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr)) !important; }
.rwa-profile-grid.rwa-profile-grid-compact.rwa-profile-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
.rwa-profile-grid.rwa-profile-grid-compact.rwa-profile-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }

.rwa-profile-btn {
  min-height: 32px !important;
  height: 32px !important;
}

/* 12-column context rail: 4 / 5 / 3. */
.rwa-context-rail {
  display: grid !important;
  grid-template-columns: repeat(${POPUP_GRID_COLUMNS}, minmax(0, 1fr)) !important;
  column-gap: ${POPUP_GRID_GAP}px !important;
  row-gap: ${POPUP_GRID_GAP}px !important;
  align-items: stretch;
  min-height: 92px;
  padding: 0 !important;
}

.rwa-context-region {
  min-width: 0;
}

.rwa-context-identity {
  grid-column: span 4;
}

.rwa-context-sources {
  grid-column: span 5;
}

.rwa-context-modifiers {
  grid-column: span 3;
}

.rwa-context-identity,
.rwa-context-sources,
.rwa-context-modifiers {
  padding: 8px;
}

.rwa-context-identity .rwa-token-panel {
  margin-bottom: 0 !important;
}

.rwa-context-sources .rwa-panel-compact {
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
}

.rwa-context-modifiers .rwa-merged-row {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}

.rwa-context-modifiers .rwa-length-side,
.rwa-context-modifiers .rwa-depth-side {
  min-width: 0 !important;
  width: 100%;
}

.rwa-context-modifiers .rwa-depth-side {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  align-items: center;
  gap: 8px;
}

.rwa-context-modifiers .rwa-depth-inp-mini {
  width: 56px !important;
  min-width: 56px !important;
}

.rwa-popup-foot {
  display: grid !important;
  grid-template-columns: repeat(${POPUP_GRID_COLUMNS}, minmax(0, 1fr)) !important;
  gap: ${POPUP_GRID_GAP}px !important;
  min-height: 36px;
  padding-top: 0 !important;
  align-items: center;
}

.rwa-popup-foot .rwa-btn {
  min-width: 0 !important;
  width: 100% !important;
  min-height: 36px !important;
  height: 36px !important;
  margin: 0 !important;
}

.rwa-popup-foot .rwa-btn-undo { grid-column: 1 / span 1; }
.rwa-popup-foot .rwa-btn-redo { grid-column: 2 / span 1; }
.rwa-popup-foot .rwa-btn-custom { grid-column: 5 / span 4; }
.rwa-popup-foot .rwa-btn-settings { grid-column: 9 / span 4; }

/* Normal-mode readable-cell clamping. */
@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.fourToThree - 1}px) {
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-4 {
    grid-template-columns: repeat(3, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr)) !important;
  }
}

@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-4,
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-3 {
    grid-template-columns: repeat(2, minmax(${POPUP_NORMAL_MIN_CELL}px, 1fr)) !important;
  }
}

@media (max-width: ${POPUP_NORMAL_BREAKPOINTS.twoToOne - 1}px) {
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-4,
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-3,
  .rwa-profile-grid:not(.rwa-profile-grid-compact).rwa-profile-cols-2 {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}

/* Compact mode may use denser cells, but still degrades deterministically. */
@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.sixToFive - 1}px) {
  .rwa-profile-grid-compact.rwa-profile-cols-6 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
}

@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.fiveToFour - 1}px) {
  .rwa-profile-grid-compact.rwa-profile-cols-6,
  .rwa-profile-grid-compact.rwa-profile-cols-5 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}

@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.fourToThree - 1}px) {
  .rwa-profile-grid-compact.rwa-profile-cols-6,
  .rwa-profile-grid-compact.rwa-profile-cols-5,
  .rwa-profile-grid-compact.rwa-profile-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
}

@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.threeToTwo - 1}px) {
  .rwa-profile-grid-compact.rwa-profile-cols-6,
  .rwa-profile-grid-compact.rwa-profile-cols-5,
  .rwa-profile-grid-compact.rwa-profile-cols-4,
  .rwa-profile-grid-compact.rwa-profile-cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}

@media (max-width: ${POPUP_COMPACT_BREAKPOINTS.twoToOne - 1}px) {
  .rwa-profile-grid-compact { grid-template-columns: minmax(0, 1fr) !important; }
}

/* Context becomes two compact rows before it ever overflows horizontally. */
@media (max-width: 559px) {
  .rwa-context-identity { grid-column: 1 / -1; }
  .rwa-context-sources { grid-column: span 8; }
  .rwa-context-modifiers { grid-column: span 4; }

  .rwa-popup-foot .rwa-btn-undo { grid-column: 1 / span 2; }
  .rwa-popup-foot .rwa-btn-redo { grid-column: 3 / span 2; }
  .rwa-popup-foot .rwa-btn-custom { grid-column: 5 / span 4; }
  .rwa-popup-foot .rwa-btn-settings { grid-column: 9 / span 4; }
}

@media (max-width: 419px) {
  .rwa-context-identity,
  .rwa-context-sources,
  .rwa-context-modifiers {
    grid-column: 1 / -1;
  }
}
`;

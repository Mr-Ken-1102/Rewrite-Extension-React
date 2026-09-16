export const POPUP_DESKTOP_WIDTH = 688;
export const POPUP_VIEWPORT_GUTTER = 8;
export const POPUP_OUTER_PADDING_X = 12;
export const POPUP_GRID_COLUMNS = 12;
export const POPUP_GRID_GAP = 8;
export const POPUP_NORMAL_MIN_CELL = 156;
export const POPUP_COMPACT_MIN_CELL = 104;
export const POPUP_PROFILE_ROW_HEIGHT = 32;
export const POPUP_COMPACT_ROW_HEIGHT = 28;
export const POPUP_PROFILE_ROW_GAP = 6;
export const POPUP_FIXED_HEIGHT = 232;
export const POPUP_TRANSIENT_ROW_HEIGHT = 38;

export const POPUP_NORMAL_BREAKPOINTS = Object.freeze({
  fourToThree: 688,
  threeToTwo: 524,
  twoToOne: 360,
});

export const POPUP_COMPACT_BREAKPOINTS = Object.freeze({
  sixToFive: 704,
  fiveToFour: 592,
  fourToThree: 480,
  threeToTwo: 368,
  twoToOne: 256,
});

export function getProfileViewportHeight(rows, compact = false) {
  const visibleRows = Math.max(1, Number(rows) || 3);
  const rowHeight = compact ? POPUP_COMPACT_ROW_HEIGHT : POPUP_PROFILE_ROW_HEIGHT;
  return (visibleRows * rowHeight) + (Math.max(0, visibleRows - 1) * POPUP_PROFILE_ROW_GAP);
}

export function estimatePopupHeight({ visibleRows, compact = false, hasAutoProfile = false, multiMessage = false }) {
  return POPUP_FIXED_HEIGHT
    + getProfileViewportHeight(visibleRows, compact)
    + (hasAutoProfile ? POPUP_TRANSIENT_ROW_HEIGHT : 0)
    + (multiMessage ? POPUP_TRANSIENT_ROW_HEIGHT : 0);
}

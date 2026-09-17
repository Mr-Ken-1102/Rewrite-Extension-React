export const POPUP_DESKTOP_WIDTH = 620;
export const POPUP_VIEWPORT_GUTTER = 8;
export const POPUP_OUTER_PADDING_X = 10;
export const POPUP_GRID_COLUMNS = 12;
export const POPUP_GRID_GAP = 6;
export const POPUP_NORMAL_MIN_CELL = 140;
export const POPUP_COMPACT_MIN_CELL = 100;
export const POPUP_PROFILE_ROW_HEIGHT = 30;
export const POPUP_COMPACT_ROW_HEIGHT = 27;
export const POPUP_PROFILE_ROW_GAP = 5;
export const POPUP_FIXED_HEIGHT = 240;
export const POPUP_TRANSIENT_ROW_HEIGHT = 34;

export const POPUP_NORMAL_BREAKPOINTS = Object.freeze({
  fourToThree: 598,
  threeToTwo: 452,
  twoToOne: 306,
});

export const POPUP_COMPACT_BREAKPOINTS = Object.freeze({
  sixToFive: 636,
  fiveToFour: 528,
  fourToThree: 420,
  threeToTwo: 312,
  twoToOne: 220,
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

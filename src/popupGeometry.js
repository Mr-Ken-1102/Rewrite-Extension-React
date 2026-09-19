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
export const POPUP_FIXED_HEIGHT = 270;
export const POPUP_TRANSIENT_ROW_HEIGHT = 34;
export const POPUP_FAST_REWRITE_HEIGHT = 35;
export const POPUP_PRESET_INSPECTOR_HEIGHT = 76;
export const POPUP_STACKED_CONTEXT_EXTRA = 78;
export const POPUP_WRAPPED_ACTIONBAR_EXTRA = 36;

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

export function getResponsivePopupExtra(viewportWidth) {
  const width = Number(viewportWidth) || POPUP_DESKTOP_WIDTH;
  return (width <= 459 ? POPUP_STACKED_CONTEXT_EXTRA : 0)
    + (width <= 419 ? POPUP_WRAPPED_ACTIONBAR_EXTRA : 0);
}

export function estimatePopupHeight({
  visibleRows,
  compact = false,
  hasAutoProfile = false,
  multiMessage = false,
  viewportWidth = POPUP_DESKTOP_WIDTH,
}) {
  return POPUP_FIXED_HEIGHT
    + getProfileViewportHeight(visibleRows, compact)
    + (hasAutoProfile ? POPUP_TRANSIENT_ROW_HEIGHT : 0)
    + (multiMessage ? POPUP_TRANSIENT_ROW_HEIGHT : 0)
    // The Fast Rewrite status row and preset inspector are permanently reserved.
    // Keeping their geometry stable prevents toggle/hover-driven popup jumps.
    + POPUP_FAST_REWRITE_HEIGHT
    + POPUP_PRESET_INSPECTOR_HEIGHT
    + getResponsivePopupExtra(viewportWidth);
}

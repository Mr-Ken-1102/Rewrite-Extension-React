export const POPUP_DESKTOP_WIDTH = 488;
export const POPUP_VIEWPORT_GUTTER = 8;
export const POPUP_OUTER_PADDING_X = 10;
export const POPUP_GRID_COLUMNS = 12;
export const POPUP_GRID_GAP = 6;
export const POPUP_NORMAL_MIN_CELL = 110;
export const POPUP_COMPACT_MIN_CELL = 92;
export const POPUP_PROFILE_ROW_HEIGHT = 30;
export const POPUP_COMPACT_ROW_HEIGHT = 27;
export const POPUP_PROFILE_ROW_GAP = 5;
export const POPUP_FIXED_HEIGHT = 124;
export const POPUP_TRANSIENT_ROW_HEIGHT = 34;
export const POPUP_PERFORMANCE_STRIP_HEIGHT = 35;
export const POPUP_CONTEXT_SUMMARY_HEIGHT = 36;
export const POPUP_CONTEXT_DETAIL_HEIGHT = 76;
export const POPUP_NARROW_CONTEXT_EXTRA = 60;
export const POPUP_WRAPPED_ACTIONBAR_EXTRA = 30;

export const POPUP_NORMAL_BREAKPOINTS = Object.freeze({
  fourToThree: 478,
  threeToTwo: 355,
  twoToOne: 245,
});

export const POPUP_COMPACT_BREAKPOINTS = Object.freeze({
  sixToFive: 488,
  fiveToFour: 424,
  fourToThree: 360,
  threeToTwo: 296,
  twoToOne: 220,
});

export function getProfileViewportHeight(rows, compact = false) {
  const visibleRows = Math.max(1, Number(rows) || 5);
  const rowHeight = compact ? POPUP_COMPACT_ROW_HEIGHT : POPUP_PROFILE_ROW_HEIGHT;
  return (visibleRows * rowHeight) + (Math.max(0, visibleRows - 1) * POPUP_PROFILE_ROW_GAP);
}

export function getResponsivePopupExtra(viewportWidth, contextOpen = false) {
  const width = Number(viewportWidth) || POPUP_DESKTOP_WIDTH;
  return (contextOpen && width <= 459 ? POPUP_NARROW_CONTEXT_EXTRA : 0)
    + (width <= 419 ? POPUP_WRAPPED_ACTIONBAR_EXTRA : 0);
}

export function estimatePopupHeight({
  visibleRows,
  compact = false,
  multiMessage = false,
  contextOpen = false,
  viewportWidth = POPUP_DESKTOP_WIDTH,
}) {
  return POPUP_FIXED_HEIGHT
    + getProfileViewportHeight(visibleRows, compact)
    + (multiMessage ? POPUP_TRANSIENT_ROW_HEIGHT : 0)
    + POPUP_PERFORMANCE_STRIP_HEIGHT
    + POPUP_CONTEXT_SUMMARY_HEIGHT
    + (contextOpen ? POPUP_CONTEXT_DETAIL_HEIGHT : 0)
    + getResponsivePopupExtra(viewportWidth, contextOpen);
}

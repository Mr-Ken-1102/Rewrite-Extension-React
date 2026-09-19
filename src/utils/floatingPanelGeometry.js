export const FLOATING_PANEL_GUTTER = 8;

export function getVisualViewportBounds(windowLike = globalThis.window) {
  const visual = windowLike?.visualViewport;
  const left = Number(visual?.offsetLeft) || 0;
  const top = Number(visual?.offsetTop) || 0;
  const width = Math.max(1, Number(visual?.width) || Number(windowLike?.innerWidth) || 1);
  const height = Math.max(1, Number(visual?.height) || Number(windowLike?.innerHeight) || 1);
  return { left, top, right: left + width, bottom: top + height, width, height };
}

export function clampFloatingPanelPosition(
  position,
  size,
  bounds,
  gutter = FLOATING_PANEL_GUTTER,
) {
  const width = Math.max(1, Number(size?.width) || 1);
  const height = Math.max(1, Number(size?.height) || 1);
  const minLeft = bounds.left + gutter;
  const minTop = bounds.top + gutter;
  const maxLeft = Math.max(minLeft, bounds.right - width - gutter);
  const maxTop = Math.max(minTop, bounds.bottom - height - gutter);
  const left = Math.max(minLeft, Math.min(Number(position?.left) || minLeft, maxLeft));
  const top = Math.max(minTop, Math.min(Number(position?.top) || minTop, maxTop));
  return { left, top };
}

export function defaultFloatingPanelPosition(
  size,
  bounds,
  gutter = FLOATING_PANEL_GUTTER,
) {
  const width = Math.max(1, Number(size?.width) || 1);
  const topInset = Math.max(gutter, Math.min(48, Math.round(bounds.height * 0.06)));
  return clampFloatingPanelPosition(
    {
      left: bounds.left + ((bounds.width - width) / 2),
      top: bounds.top + topInset,
    },
    size,
    bounds,
    gutter,
  );
}


export const DRAFT_REPLY_BOTTOM_GAP = 24;

export function defaultDraftReplyPanelPosition(
  size,
  bounds,
  anchor = null,
  gutter = FLOATING_PANEL_GUTTER,
) {
  void anchor;
  const width = Math.max(1, Number(size?.width) || 1);
  const height = Math.max(1, Number(size?.height) || 1);
  const bottomGap = Math.max(gutter, DRAFT_REPLY_BOTTOM_GAP);

  return clampFloatingPanelPosition(
    {
      left: bounds.left + ((bounds.width - width) / 2),
      top: bounds.bottom - height - bottomGap,
    },
    size,
    bounds,
    gutter,
  );
}

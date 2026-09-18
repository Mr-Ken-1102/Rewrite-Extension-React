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


export function defaultDraftReplyPanelPosition(
  size,
  bounds,
  anchor = null,
  gutter = FLOATING_PANEL_GUTTER,
) {
  const width = Math.max(1, Number(size?.width) || 1);
  const height = Math.max(1, Number(size?.height) || 1);
  const rootRect = (() => {
    try { return anchor?.root?.getBoundingClientRect?.() || null; } catch { return null; }
  })();
  const shellRect = (() => {
    try { return anchor?.shell?.getBoundingClientRect?.() || null; } catch { return null; }
  })();

  const areaLeft = rootRect && Number.isFinite(rootRect.left)
    ? Math.max(bounds.left, rootRect.left)
    : bounds.left;
  const areaRight = rootRect && Number.isFinite(rootRect.right)
    ? Math.min(bounds.right, rootRect.right)
    : bounds.right;
  const areaWidth = Math.max(1, areaRight - areaLeft);
  const preferredTop = bounds.top + Math.max(72, Math.min(140, Math.round(bounds.height * 0.14)));
  const maxAboveComposer = shellRect && Number.isFinite(shellRect.top)
    ? shellRect.top - height - 20
    : Number.POSITIVE_INFINITY;
  const top = maxAboveComposer >= bounds.top + gutter
    ? Math.min(preferredTop, maxAboveComposer)
    : preferredTop;

  return clampFloatingPanelPosition(
    {
      left: areaLeft + ((areaWidth - width) / 2),
      top,
    },
    size,
    bounds,
    gutter,
  );
}

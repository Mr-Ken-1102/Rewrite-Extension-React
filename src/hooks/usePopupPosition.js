import { useEffect, useMemo, useState } from 'react';
import {
  estimatePopupHeight,
  POPUP_DESKTOP_WIDTH,
  POPUP_VIEWPORT_GUTTER,
} from '../popupGeometry';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const ANCHOR_GAP = 12;

function getViewportSize() {
  return {
    width: Math.max(1, Number(window.innerWidth) || POPUP_DESKTOP_WIDTH),
    height: Math.max(1, Number(window.innerHeight) || 600),
  };
}

function useViewportSize() {
  const [viewport, setViewport] = useState(getViewportSize);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setViewport(getViewportSize());
      });
    };

    window.addEventListener('resize', update, { passive: true });
    window.visualViewport?.addEventListener?.('resize', update, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener?.('resize', update);
    };
  }, []);

  return viewport;
}

function textareaSourceRect(selection, viewportHeight) {
  if (selection?.source !== 'textarea' || !selection?.el?.isConnected) return null;
  try {
    const rect = selection.el.getBoundingClientRect?.();
    if (!rect) return null;
    if (![rect.top, rect.bottom, rect.left, rect.right].every(Number.isFinite)) return null;
    if (rect.bottom <= 0 || rect.top >= viewportHeight) return null;
    return rect;
  } catch {
    return null;
  }
}

export function usePopupPosition({
  popupPosition,
  selection,
  sortedProfilesLength,
  colCount,
  rows,
  compact,
  popupPos,
  pinnedPos,
  hasAutoProfile,
}) {
  const viewport = useViewportSize();

  return useMemo(() => {
    let finalLeft = '0px';
    let finalTop = '0px';
    let finalVisibility = 'hidden';

    if (popupPosition && selection) {
      const panelWidth = Math.min(
        POPUP_DESKTOP_WIDTH,
        Math.max(280, viewport.width - (POPUP_VIEWPORT_GUTTER * 2)),
      );
      const maxLeft = Math.max(POPUP_VIEWPORT_GUTTER, viewport.width - panelWidth - POPUP_VIEWPORT_GUTTER);

      if (pinnedPos) {
        finalLeft = `${clamp(Number(pinnedPos.left) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(Number(pinnedPos.top) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, Math.max(POPUP_VIEWPORT_GUTTER, viewport.height - 60))}px`;
        finalVisibility = 'visible';
      } else if (popupPosition.isDragged) {
        finalLeft = `${clamp(Number(popupPosition.left) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(Number(popupPosition.top) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, Math.max(POPUP_VIEWPORT_GUTTER, viewport.height - 60))}px`;
        finalVisibility = 'visible';
      } else {
        const actualRows = Math.ceil(sortedProfilesLength / Math.max(1, colCount));
        const visibleRows = Math.min(actualRows || 1, Math.max(1, rows || 3));
        const multiMessage = Array.isArray(selection?.segments) && selection.segments.length > 1;
        const estimatedHeight = Math.min(
          viewport.height - (POPUP_VIEWPORT_GUTTER * 2),
          estimatePopupHeight({
            visibleRows,
            compact,
            hasAutoProfile,
            multiMessage,
            viewportWidth: viewport.width,
          }),
        );

        const anchorX = Number.isFinite(Number(popupPosition.anchorX))
          ? Number(popupPosition.anchorX)
          : Number(popupPosition.right ?? popupPosition.left ?? POPUP_VIEWPORT_GUTTER);
        const anchorY = Number.isFinite(Number(popupPosition.anchorY))
          ? Number(popupPosition.anchorY)
          : Number(popupPosition.bottom ?? popupPosition.top ?? POPUP_VIEWPORT_GUTTER);

        const rightCandidate = anchorX + ANCHOR_GAP;
        const leftCandidate = anchorX - panelWidth - ANCHOR_GAP;
        let left;
        if (rightCandidate <= maxLeft) left = rightCandidate;
        else if (leftCandidate >= POPUP_VIEWPORT_GUTTER) left = leftCandidate;
        else left = clamp(anchorX - (panelWidth / 2), POPUP_VIEWPORT_GUTTER, maxLeft);

        const belowCandidate = anchorY + ANCHOR_GAP;
        const aboveCandidate = anchorY - estimatedHeight - ANCHOR_GAP;
        const maxTop = Math.max(POPUP_VIEWPORT_GUTTER, viewport.height - estimatedHeight - POPUP_VIEWPORT_GUTTER);
        const sourceRect = textareaSourceRect(selection, viewport.height);
        const sourceBelowCandidate = sourceRect ? sourceRect.bottom + ANCHOR_GAP : null;
        const sourceAboveCandidate = sourceRect ? sourceRect.top - estimatedHeight - ANCHOR_GAP : null;
        let top;
        if (popupPos === 'above') top = aboveCandidate;
        else if (popupPos === 'below') top = belowCandidate;
        else if (sourceRect && sourceBelowCandidate <= maxTop) top = sourceBelowCandidate;
        else if (sourceRect && sourceAboveCandidate >= POPUP_VIEWPORT_GUTTER) top = sourceAboveCandidate;
        else if (belowCandidate <= maxTop) top = belowCandidate;
        else if (aboveCandidate >= POPUP_VIEWPORT_GUTTER) top = aboveCandidate;
        else top = clamp(anchorY - (estimatedHeight / 2), POPUP_VIEWPORT_GUTTER, maxTop);

        finalLeft = `${clamp(left, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(top, POPUP_VIEWPORT_GUTTER, maxTop)}px`;
        finalVisibility = 'visible';
      }
    }

    return { finalLeft, finalTop, finalVisibility };
  }, [
    popupPosition,
    selection,
    sortedProfilesLength,
    colCount,
    rows,
    compact,
    popupPos,
    pinnedPos,
    hasAutoProfile,
    viewport.width,
    viewport.height,
  ]);
}

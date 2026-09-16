import { useMemo } from 'react';
import {
  estimatePopupHeight,
  POPUP_DESKTOP_WIDTH,
  POPUP_VIEWPORT_GUTTER,
} from '../popupGeometry';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

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
  return useMemo(() => {
    let finalLeft = '0px';
    let finalTop = '0px';
    let finalVisibility = 'hidden';

    if (popupPosition && selection) {
      const panelWidth = Math.min(
        POPUP_DESKTOP_WIDTH,
        Math.max(280, window.innerWidth - (POPUP_VIEWPORT_GUTTER * 2)),
      );
      const maxLeft = Math.max(POPUP_VIEWPORT_GUTTER, window.innerWidth - panelWidth - POPUP_VIEWPORT_GUTTER);

      if (pinnedPos) {
        finalLeft = `${clamp(Number(pinnedPos.left) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(Number(pinnedPos.top) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, Math.max(POPUP_VIEWPORT_GUTTER, window.innerHeight - 60))}px`;
        finalVisibility = 'visible';
      } else if (popupPosition.isDragged) {
        finalLeft = `${clamp(Number(popupPosition.left) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(Number(popupPosition.top) || POPUP_VIEWPORT_GUTTER, POPUP_VIEWPORT_GUTTER, Math.max(POPUP_VIEWPORT_GUTTER, window.innerHeight - 60))}px`;
        finalVisibility = 'visible';
      } else {
        const actualRows = Math.ceil(sortedProfilesLength / Math.max(1, colCount));
        const visibleRows = Math.min(actualRows || 1, Math.max(1, rows || 3));
        const multiMessage = Array.isArray(selection?.segments) && selection.segments.length > 1;
        const estimatedHeight = Math.min(
          window.innerHeight - (POPUP_VIEWPORT_GUTTER * 2),
          estimatePopupHeight({
            visibleRows,
            compact,
            hasAutoProfile,
            multiMessage,
          }),
        );
        let top = popupPosition.bottom + 12;

        if (popupPos === 'above') top = popupPosition.top - estimatedHeight - 12;
        else if (popupPos !== 'below' && top + estimatedHeight > window.innerHeight) top = popupPosition.top - estimatedHeight - 12;

        finalLeft = `${clamp(popupPosition.left, POPUP_VIEWPORT_GUTTER, maxLeft)}px`;
        finalTop = `${clamp(top, POPUP_VIEWPORT_GUTTER, Math.max(POPUP_VIEWPORT_GUTTER, window.innerHeight - estimatedHeight - POPUP_VIEWPORT_GUTTER))}px`;
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
  ]);
}

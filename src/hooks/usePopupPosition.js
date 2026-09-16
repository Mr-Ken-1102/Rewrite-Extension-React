import { useMemo } from 'react';

export function usePopupPosition({ popupPosition, selection, sortedProfilesLength, colCount, rows, popupPos, pinnedPos }) {
  return useMemo(() => {
    let finalLeft = '0px';
    let finalTop = '0px';
    let finalVisibility = 'hidden';

    if (popupPosition && selection) {
      if (pinnedPos) {
        const width = Math.max(200, colCount * 95);
        finalLeft = `${Math.max(10, Math.min(Number(pinnedPos.left) || 10, window.innerWidth - width - 10))}px`;
        finalTop = `${Math.max(10, Math.min(Number(pinnedPos.top) || 10, window.innerHeight - 60))}px`;
        finalVisibility = 'visible';
      } else if (popupPosition.isDragged) {
        finalLeft = `${popupPosition.left}px`;
        finalTop = `${popupPosition.top}px`;
        finalVisibility = 'visible';
      } else {
        const actualRows = Math.ceil(sortedProfilesLength / colCount);
        const visibleRows = Math.min(actualRows, Math.max(1, rows || 3));
        const estimatedWidth = Math.max(200, colCount * 95) + 24;
        const estimatedHeight = (visibleRows * 42) + 105;
        let top = popupPosition.bottom + 12;

        if (popupPos === 'above') top = popupPosition.top - estimatedHeight - 12;
        else if (popupPos !== 'below' && top + estimatedHeight > window.innerHeight) top = popupPosition.top - estimatedHeight - 12;

        finalLeft = `${Math.max(12, Math.min(popupPosition.left, window.innerWidth - estimatedWidth - 12))}px`;
        finalTop = `${Math.max(12, Math.min(top, window.innerHeight - estimatedHeight - 12))}px`;
        finalVisibility = 'visible';
      }
    }

    return { finalLeft, finalTop, finalVisibility };
  }, [popupPosition, selection, sortedProfilesLength, colCount, rows, popupPos, pinnedPos]);
}

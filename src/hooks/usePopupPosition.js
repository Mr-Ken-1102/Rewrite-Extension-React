import { useMemo } from 'react';

export function usePopupPosition({ popupPosition, selection, sortedProfilesLength, colCount, rows, popupPos, pinnedPos }) {
  return useMemo(() => {
    let finalLeft = '0px';
    let finalTop = '0px';
    let finalVisibility = 'hidden';

    if (popupPosition && selection) {
      const panelWidth = Math.min(620, Math.max(280, window.innerWidth - 16));

      if (pinnedPos) {
        finalLeft = `${Math.max(8, Math.min(Number(pinnedPos.left) || 8, window.innerWidth - panelWidth - 8))}px`;
        finalTop = `${Math.max(8, Math.min(Number(pinnedPos.top) || 8, window.innerHeight - 60))}px`;
        finalVisibility = 'visible';
      } else if (popupPosition.isDragged) {
        finalLeft = `${popupPosition.left}px`;
        finalTop = `${popupPosition.top}px`;
        finalVisibility = 'visible';
      } else {
        const actualRows = Math.ceil(sortedProfilesLength / Math.max(1, colCount));
        const visibleRows = Math.min(actualRows, Math.max(1, rows || 3));
        const commandHeight = (visibleRows * 34) + 70;
        const inspectorHeight = 224;
        const estimatedHeight = Math.min(window.innerHeight - 16, Math.max(commandHeight, inspectorHeight) + 82);
        let top = popupPosition.bottom + 12;

        if (popupPos === 'above') top = popupPosition.top - estimatedHeight - 12;
        else if (popupPos !== 'below' && top + estimatedHeight > window.innerHeight) top = popupPosition.top - estimatedHeight - 12;

        finalLeft = `${Math.max(8, Math.min(popupPosition.left, window.innerWidth - panelWidth - 8))}px`;
        finalTop = `${Math.max(8, Math.min(top, window.innerHeight - estimatedHeight - 8))}px`;
        finalVisibility = 'visible';
      }
    }

    return { finalLeft, finalTop, finalVisibility };
  }, [popupPosition, selection, sortedProfilesLength, colCount, rows, popupPos, pinnedPos]);
}

import { useCallback, useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const restoreInlineStyle = (node, snapshot) => {
  if (!node || !snapshot) return;
  for (const [key, value] of Object.entries(snapshot)) node.style[key] = value;
};

export function useProfileReorder({
  orderedProfiles,
  disabled,
  itemRefs,
  scrollContainerRef,
  onCommit,
}) {
  const cleanupRef = useRef(null);
  const scrollFrameRef = useRef(0);
  const dragStateRef = useRef(null);

  const beginPointerDrag = useCallback((event, draggedId) => {
    if (disabled || (event.button !== undefined && event.button !== 0)) return;

    event.preventDefault();
    event.stopPropagation();
    cleanupRef.current?.(false);

    const handle = event.currentTarget;
    const draggedNode = itemRefs.current.get(draggedId);
    if (!draggedNode?.isConnected) return;

    const pointerId = event.pointerId;
    const container = scrollContainerRef?.current || handle.closest('.rwa-settings-body');
    const containerRect = container?.getBoundingClientRect() || null;
    const draggedRect = draggedNode.getBoundingClientRect();
    const itemCenters = orderedProfiles
      .filter((profile) => profile.id !== draggedId)
      .map((profile) => {
        const node = itemRefs.current.get(profile.id);
        if (!node?.isConnected) return null;
        const rect = node.getBoundingClientRect();
        return { id: profile.id, node, center: rect.top + (rect.height / 2) };
      })
      .filter(Boolean);

    const baseIds = orderedProfiles.map((profile) => profile.id);
    const profileMap = new Map(orderedProfiles.map((profile) => [profile.id, profile]));
    const state = {
      draggedId,
      pointerId,
      handle,
      draggedNode,
      container,
      containerRect,
      itemCenters,
      baseIds,
      profileMap,
      originY: event.clientY,
      latestY: event.clientY,
      scrollStart: container?.scrollTop || 0,
      insertionIndex: baseIds.indexOf(draggedId),
      scrollVelocity: 0,
      markerNode: null,
      markerEdge: null,
      markerPreviousBoxShadow: '',
      finished: false,
      draggedStyle: {
        transform: draggedNode.style.transform,
        transition: draggedNode.style.transition,
        willChange: draggedNode.style.willChange,
        position: draggedNode.style.position,
        zIndex: draggedNode.style.zIndex,
        boxShadow: draggedNode.style.boxShadow,
      },
      handleCursor: handle.style.cursor,
    };
    dragStateRef.current = state;

    const clearMarker = () => {
      const current = dragStateRef.current;
      if (!current?.markerNode) return;
      current.markerNode.style.boxShadow = current.markerPreviousBoxShadow;
      current.markerNode.removeAttribute('data-rwa-drop-edge');
      current.markerNode = null;
      current.markerEdge = null;
      current.markerPreviousBoxShadow = '';
    };

    const showMarker = (node, edge) => {
      const current = dragStateRef.current;
      if (!current || !node) return;
      if (current.markerNode === node && current.markerEdge === edge) return;
      clearMarker();
      current.markerNode = node;
      current.markerEdge = edge;
      current.markerPreviousBoxShadow = node.style.boxShadow;
      node.setAttribute('data-rwa-drop-edge', edge);
      node.style.boxShadow = edge === 'before'
        ? 'inset 0 2px 0 var(--rwa-brand)'
        : 'inset 0 -2px 0 var(--rwa-brand)';
    };

    const scheduleScroll = () => {
      const current = dragStateRef.current;
      if (!current || current.finished || current.scrollVelocity === 0 || scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(scrollTick);
    };

    const updateVisual = (clientY) => {
      const current = dragStateRef.current;
      if (!current || current.finished) return;

      current.latestY = clientY;
      const scrollDelta = (current.container?.scrollTop || 0) - current.scrollStart;
      const translateY = Math.round(clientY - current.originY + scrollDelta);
      current.draggedNode.style.transform = `translate3d(0, ${translateY}px, 0)`;

      let insertionIndex = 0;
      while (
        insertionIndex < current.itemCenters.length
        && clientY > (current.itemCenters[insertionIndex].center - scrollDelta)
      ) {
        insertionIndex += 1;
      }
      current.insertionIndex = insertionIndex;

      if (current.itemCenters.length === 0) {
        clearMarker();
      } else if (insertionIndex >= current.itemCenters.length) {
        const last = current.itemCenters[current.itemCenters.length - 1];
        showMarker(last.node, 'after');
      } else {
        showMarker(current.itemCenters[insertionIndex].node, 'before');
      }

      const rect = current.containerRect;
      if (!rect) {
        current.scrollVelocity = 0;
        return;
      }

      const edge = Math.min(72, Math.max(44, rect.height * 0.12));
      if (clientY < rect.top + edge) {
        current.scrollVelocity = -clamp((rect.top + edge - clientY) * 0.22, 4, 16);
      } else if (clientY > rect.bottom - edge) {
        current.scrollVelocity = clamp((clientY - (rect.bottom - edge)) * 0.22, 4, 16);
      } else {
        current.scrollVelocity = 0;
      }

      if (current.scrollVelocity === 0 && scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = 0;
      } else {
        scheduleScroll();
      }
    };

    function scrollTick() {
      scrollFrameRef.current = 0;
      const current = dragStateRef.current;
      if (!current || current.finished || !current.container || current.scrollVelocity === 0) return;

      const before = current.container.scrollTop;
      current.container.scrollTop += current.scrollVelocity;
      if (current.container.scrollTop === before) {
        current.scrollVelocity = 0;
        return;
      }

      updateVisual(current.latestY);
    }

    const cleanup = (commit) => {
      const current = dragStateRef.current;
      if (!current || current.finished) return;
      current.finished = true;

      current.handle.removeEventListener('pointermove', onPointerMove);
      current.handle.removeEventListener('pointerup', onPointerUp);
      current.handle.removeEventListener('pointercancel', onPointerCancel);
      current.handle.removeEventListener('lostpointercapture', onLostPointerCapture);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = 0;
      }

      try {
        if (pointerId !== undefined && current.handle.hasPointerCapture?.(pointerId)) {
          current.handle.releasePointerCapture(pointerId);
        }
      } catch { /* best effort */ }

      clearMarker();
      restoreInlineStyle(current.draggedNode, current.draggedStyle);
      current.handle.style.cursor = current.handleCursor;

      if (commit && current.draggedId) {
        const remainingIds = current.baseIds.filter((id) => id !== current.draggedId);
        const slot = clamp(current.insertionIndex, 0, remainingIds.length);
        remainingIds.splice(slot, 0, current.draggedId);
        const changed = remainingIds.some((id, index) => id !== current.baseIds[index]);

        if (changed) {
          onCommit(remainingIds.map((id, index) => ({
            ...current.profileMap.get(id),
            order: index,
          })));
        }
      }

      dragStateRef.current = null;
      cleanupRef.current = null;
    };

    const onPointerMove = (moveEvent) => {
      const current = dragStateRef.current;
      if (!current || (pointerId !== undefined && moveEvent.pointerId !== pointerId)) return;
      if (moveEvent.pointerType === 'mouse' && moveEvent.buttons === 0) {
        cleanup(true);
        return;
      }

      moveEvent.preventDefault();
      const samples = moveEvent.getCoalescedEvents?.();
      const latest = samples?.length ? samples[samples.length - 1] : moveEvent;
      updateVisual(latest.clientY);
    };

    const onPointerUp = (upEvent) => {
      if (pointerId !== undefined && upEvent.pointerId !== pointerId) return;
      cleanup(true);
    };
    const onPointerCancel = () => cleanup(false);
    const onWindowBlur = () => cleanup(false);
    const onVisibilityChange = () => { if (document.hidden) cleanup(false); };
    const onLostPointerCapture = () => cleanup(false);

    cleanupRef.current = cleanup;

    {
      draggedNode.style.transition = 'none';
      draggedNode.style.willChange = 'transform';
      draggedNode.style.position = draggedNode.style.position || 'relative';
      draggedNode.style.zIndex = '3';
      draggedNode.style.boxShadow = '0 12px 28px rgba(0, 0, 0, .34)';
      handle.style.cursor = 'grabbing';
      try { handle.setPointerCapture?.(pointerId); } catch { /* best effort */ }
      handle.addEventListener('pointermove', onPointerMove, { passive: false });
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerCancel);
      handle.addEventListener('lostpointercapture', onLostPointerCapture, { once: true });
      window.addEventListener('blur', onWindowBlur);
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
  }, [disabled, itemRefs, onCommit, orderedProfiles, scrollContainerRef]);

  useEffect(() => () => {
    cleanupRef.current?.(false);
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  return beginPointerDrag;
}

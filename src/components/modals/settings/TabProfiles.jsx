import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { Button } from '../../ui/Button';
import { ConfirmModal } from '../ConfirmModal';

export const TabProfiles = ({ openEditProfile, scrollContainerRef }) => {
  const profiles = usePersistentStore((state) => state.profiles);
  const updateProfiles = usePersistentStore((state) => state.updateProfiles);

  const [query, setQuery] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const itemRefs = useRef(new Map());
  const cleanupDragRef = useRef(null);
  const moveFrameRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const pendingYRef = useRef(0);
  const dragStateRef = useRef(null);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => ((a.order || 0) - (b.order || 0)) || String(a.id).localeCompare(String(b.id))),
    [profiles],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProfiles = useMemo(() => {
    if (!normalizedQuery) return sortedProfiles;
    return sortedProfiles.filter((profile) => `${profile.name}\n${profile.prompt}`.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, sortedProfiles]);
  const dragDisabled = !!normalizedQuery;

  useEffect(() => () => {
    cleanupDragRef.current?.(false);
    if (moveFrameRef.current) window.cancelAnimationFrame(moveFrameRef.current);
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const beginPointerDrag = (event, id) => {
    if (dragDisabled || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    cleanupDragRef.current?.(false);

    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    const container = scrollContainerRef?.current || handle.closest('.rwa-settings-body');
    const itemCenters = visibleProfiles.map((profile) => {
      const node = itemRefs.current.get(profile.id);
      if (!node?.isConnected) return null;
      const rect = node.getBoundingClientRect();
      return { id: profile.id, center: rect.top + (rect.height / 2) };
    }).filter(Boolean);
    const containerRect = container?.getBoundingClientRect() || null;
    const state = {
      id,
      targetId: id,
      pointerId,
      handle,
      container,
      containerRect,
      itemCenters,
      scrollStart: container?.scrollTop || 0,
      scrollVelocity: 0,
      finished: false,
    };
    dragStateRef.current = state;
    pendingYRef.current = event.clientY;
    setDraggedId(id);
    setDragOverId(id);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    try { handle.setPointerCapture?.(pointerId); } catch { /* best effort */ }

    const scrollTick = () => {
      scrollFrameRef.current = 0;
      const current = dragStateRef.current;
      if (!current || current.finished || !current.container || current.scrollVelocity === 0) return;
      current.container.scrollTop += current.scrollVelocity;
      updateTarget();
      if (current.scrollVelocity !== 0) scrollFrameRef.current = window.requestAnimationFrame(scrollTick);
    };

    const updateTarget = () => {
      moveFrameRef.current = 0;
      const current = dragStateRef.current;
      if (!current || current.finished) return;
      const y = pendingYRef.current;
      const scrollDelta = (current.container?.scrollTop || 0) - current.scrollStart;
      let closest = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const item of current.itemCenters) {
        const distance = Math.abs(y - (item.center - scrollDelta));
        if (distance < bestDistance) {
          bestDistance = distance;
          closest = item.id;
        }
      }
      if (closest && closest !== current.targetId) {
        current.targetId = closest;
        setDragOverId(closest);
      }

      const rect = current.containerRect;
      if (rect) {
        const edge = Math.min(72, Math.max(44, rect.height * 0.12));
        if (y < rect.top + edge) current.scrollVelocity = -Math.max(4, Math.min(16, (rect.top + edge - y) * 0.22));
        else if (y > rect.bottom - edge) current.scrollVelocity = Math.max(4, Math.min(16, (y - (rect.bottom - edge)) * 0.22));
        else current.scrollVelocity = 0;
      }

      if (current.scrollVelocity !== 0 && !scrollFrameRef.current) {
        scrollFrameRef.current = window.requestAnimationFrame(scrollTick);
      }
    };

    const scheduleTargetUpdate = () => {
      if (!moveFrameRef.current) moveFrameRef.current = window.requestAnimationFrame(updateTarget);
    };

    const onPointerMove = (moveEvent) => {
      const current = dragStateRef.current;
      if (!current || (pointerId !== undefined && moveEvent.pointerId !== pointerId)) return;
      moveEvent.preventDefault();
      const samples = moveEvent.getCoalescedEvents?.();
      const latest = samples?.length ? samples[samples.length - 1] : moveEvent;
      pendingYRef.current = latest.clientY;
      scheduleTargetUpdate();
    };

    const cleanup = (commit) => {
      const current = dragStateRef.current;
      if (!current || current.finished) return;
      current.finished = true;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      current.handle?.removeEventListener?.('lostpointercapture', onLostPointerCapture);
      if (moveFrameRef.current) {
        window.cancelAnimationFrame(moveFrameRef.current);
        moveFrameRef.current = 0;
      }
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = 0;
      }
      try {
        if (pointerId !== undefined && current.handle?.hasPointerCapture?.(pointerId)) current.handle.releasePointerCapture(pointerId);
      } catch { /* best effort */ }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (commit && current.id && current.targetId && current.id !== current.targetId) {
        const next = [...sortedProfiles];
        const from = next.findIndex((profile) => profile.id === current.id);
        const to = next.findIndex((profile) => profile.id === current.targetId);
        if (from >= 0 && to >= 0) {
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          updateProfiles(next.map((profile, index) => ({ ...profile, order: index })));
        }
      }

      dragStateRef.current = null;
      cleanupDragRef.current = null;
      setDraggedId(null);
      setDragOverId(null);
    };

    const onPointerUp = (upEvent) => {
      if (pointerId !== undefined && upEvent.pointerId !== pointerId) return;
      cleanup(true);
    };
    const onPointerCancel = () => cleanup(false);
    const onWindowBlur = () => cleanup(false);
    const onVisibilityChange = () => { if (document.hidden) cleanup(false); };
    const onLostPointerCapture = () => cleanup(false);

    cleanupDragRef.current = cleanup;
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    handle.addEventListener?.('lostpointercapture', onLostPointerCapture, { once: true });
  };

  const handleDelete = () => {
    if (deleteConfirmId === null) return;
    const updated = profiles
      .filter((profile) => profile.id !== deleteConfirmId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((profile, index) => ({ ...profile, order: index }));
    updateProfiles(updated);
    setDeleteConfirmId(null);
  };

  const toggleHidden = (id) => {
    updateProfiles(profiles.map((profile) => (
      profile.id === id ? { ...profile, hidden: profile.hidden !== true } : profile
    )));
  };

  return (
    <>
      <div className="rwa-section-kicker">Profiles List — Drag ≡ to Reorder Presets</div>

      <input
        type="search"
        className="rwa-inp rwa-profile-search"
        placeholder="Search profiles…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search profiles"
      />
      <div className="rwa-profile-summary">
        {visibleProfiles.length}/{profiles.length} shown. Hidden profiles stay editable here but do not appear in the rewrite popup.
        {dragDisabled ? ' Clear search to reorder.' : ''}
      </div>

      <div className="rwa-profile-list">
        {visibleProfiles.map((profile) => {
          const isDraggingThis = draggedId === profile.id;
          const isDropTarget = dragOverId === profile.id && draggedId !== profile.id;
          return (
            <div
              key={profile.id}
              ref={(node) => {
                if (node) itemRefs.current.set(profile.id, node);
                else itemRefs.current.delete(profile.id);
              }}
              className={`rwa-item rwa-profile-row ${isDraggingThis ? 'rwa-profile-row-dragging' : ''} ${isDropTarget ? 'rwa-profile-row-target' : ''}`}
              style={{ opacity: profile.hidden ? 0.55 : 1 }}
            >
              <button
                type="button"
                className="rwa-hnd rwa-profile-drag-handle"
                title={dragDisabled ? 'Clear search to reorder' : 'Drag to reorder'}
                aria-label={`Reorder ${profile.name}`}
                disabled={dragDisabled}
                onPointerDown={(event) => beginPointerDrag(event, profile.id)}
              >≡</button>

              <div className="rwa-profile-copy">
                <div className="rwa-profile-row-name" style={{ color: profile.color || 'var(--rwa-primary)' }}>
                  {profile.name}{profile.hidden ? ' · hidden' : ''}
                </div>
                <div className="rwa-profile-row-prompt">{profile.prompt}</div>
              </div>

              <div className="rwa-profile-actions">
                <Button onClick={() => toggleHidden(profile.id)} title={profile.hidden ? 'Show this profile in the popup' : 'Hide this profile from the popup'} aria-label={`${profile.hidden ? 'Show' : 'Hide'} ${profile.name} in popup`}>
                  {profile.hidden ? 'Show' : 'Hide'}
                </Button>
                <Button onClick={() => openEditProfile(profile)}>Edit</Button>
                <Button variant="rwa-dng" onClick={() => setDeleteConfirmId(profile.id)}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>

      {visibleProfiles.length === 0 && (
        <div className="rwa-prev" style={{ fontSize: '11px', opacity: 0.7 }}>No profiles match this search.</div>
      )}

      {deleteConfirmId !== null && (
        <ConfirmModal
          message={`Are you sure you want to delete the profile "${profiles.find((profile) => profile.id === deleteConfirmId)?.name || 'this preset'}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </>
  );
};

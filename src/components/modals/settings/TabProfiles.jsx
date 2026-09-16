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
  const [isGhostCaptured, setIsGhostCaptured] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const GAP = 6;
  const ghostTimerRef = useRef(null);

  useEffect(() => () => {
    if (ghostTimerRef.current !== null) window.clearTimeout(ghostTimerRef.current);
  }, []);

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

  const handleDragStart = (event, id) => {
    if (dragDisabled) {
      event.preventDefault();
      return;
    }
    setDraggedId(id);
    setDragOverId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    if (ghostTimerRef.current !== null) window.clearTimeout(ghostTimerRef.current);
    ghostTimerRef.current = window.setTimeout(() => {
      ghostTimerRef.current = null;
      setIsGhostCaptured(true);
    }, 0);
  };

  const handleDragEnter = (event, id) => {
    event.preventDefault();
    if (!dragDisabled && draggedId !== null && dragOverId !== id) setDragOverId(id);
  };

  const handleContainerDragOver = (event) => {
    if (dragDisabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const container = scrollContainerRef?.current || event.currentTarget.closest('.rwa-settings-body');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const buffer = 70;
    const scrollSpeed = 15;
    if (event.clientY < rect.top + buffer) container.scrollTop -= scrollSpeed;
    else if (event.clientY > rect.bottom - buffer) container.scrollTop += scrollSpeed;
  };

  const handleDragEnd = () => {
    if (ghostTimerRef.current !== null) {
      window.clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = null;
    }
    setDraggedId(null);
    setDragOverId(null);
    setIsGhostCaptured(false);
  };

  const handleDrop = (event) => {
    if (dragDisabled) return;
    event.preventDefault();
    if (!draggedId || !dragOverId || draggedId === dragOverId) {
      handleDragEnd();
      return;
    }
    const next = [...sortedProfiles];
    const from = next.findIndex((profile) => profile.id === draggedId);
    const to = next.findIndex((profile) => profile.id === dragOverId);
    if (from < 0 || to < 0) {
      handleDragEnd();
      return;
    }
    const [dragged] = next.splice(from, 1);
    next.splice(to, 0, dragged);
    updateProfiles(next.map((profile, index) => ({ ...profile, order: index })));
    handleDragEnd();
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
      <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--rwa-primary)', marginBottom: '10px' }}>
        Profiles List — Drag ≡ to Reorder Presets
      </div>

      <input
        type="search"
        className="rwa-inp"
        placeholder="Search profiles…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search profiles"
        style={{ margin: '0 0 8px', fontSize: '12px' }}
      />
      <div style={{ fontSize: '10px', opacity: 0.55, marginBottom: '10px' }}>
        {visibleProfiles.length}/{profiles.length} shown. Hidden profiles stay editable here but do not appear in the rewrite popup.
        {dragDisabled ? ' Clear search to reorder.' : ''}
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', paddingBottom: '20px', minHeight: '50px' }}
        onDragOver={handleContainerDragOver}
        onDrop={handleDrop}
      >
        {visibleProfiles.map((profile) => {
          const globalIndex = sortedProfiles.findIndex((item) => item.id === profile.id);
          const draggedIndex = sortedProfiles.findIndex((item) => item.id === draggedId);
          const dragOverIndex = sortedProfiles.findIndex((item) => item.id === dragOverId);
          const isDraggingThis = draggedId === profile.id;
          let translateY = '0px';

          if (!dragDisabled && draggedIndex >= 0 && dragOverIndex >= 0 && !isDraggingThis) {
            if (draggedIndex < dragOverIndex && globalIndex > draggedIndex && globalIndex <= dragOverIndex) {
              translateY = `calc(-100% - ${GAP}px)`;
            } else if (draggedIndex > dragOverIndex && globalIndex < draggedIndex && globalIndex >= dragOverIndex) {
              translateY = `calc(100% + ${GAP}px)`;
            }
          }

          return (
            <div
              key={profile.id}
              className="rwa-item"
              draggable={!dragDisabled}
              onDragStart={(event) => handleDragStart(event, profile.id)}
              onDragEnter={(event) => handleDragEnter(event, profile.id)}
              onDragEnd={handleDragEnd}
              style={{
                transform: `translateY(${translateY})`,
                transition: isDraggingThis ? 'none' : 'transform 0.3s cubic-bezier(0.2, 1, 0.2, 1)',
                opacity: (isDraggingThis && isGhostCaptured) ? 0.3 : (profile.hidden ? 0.55 : 1),
                borderStyle: isDraggingThis ? 'dashed' : 'solid',
                borderColor: isDraggingThis ? 'var(--rwa-primary)' : 'rgba(255, 255, 255, 0.05)',
                background: isDraggingThis ? 'rgba(255, 140, 0, 0.03)' : 'transparent',
                zIndex: isDraggingThis ? 2 : 1,
                position: 'relative',
                marginBottom: `${GAP}px`,
                padding: '8px 12px',
              }}
            >
              <div className="rwa-hnd" title={dragDisabled ? 'Clear search to reorder' : 'Drag to reorder'}>≡</div>

              <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: profile.color || 'var(--rwa-primary)', marginBottom: '4px' }}>
                  {profile.name}{profile.hidden ? ' · hidden' : ''}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.prompt}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <Button
                  onClick={() => toggleHidden(profile.id)}
                  title={profile.hidden ? 'Show this profile in the popup' : 'Hide this profile from the popup'}
                  aria-label={`${profile.hidden ? 'Show' : 'Hide'} ${profile.name} in popup`}
                  style={{ fontSize: '10.5px', padding: '4px 9px', borderRadius: '6px' }}
                >
                  {profile.hidden ? 'Show' : 'Hide'}
                </Button>
                <Button
                  onClick={() => openEditProfile(profile)}
                  style={{ fontSize: '10.5px', padding: '4px 9px', borderRadius: '6px' }}
                >
                  Edit
                </Button>
                <Button
                  variant="rwa-dng"
                  onClick={() => setDeleteConfirmId(profile.id)}
                  style={{ fontSize: '10.5px', padding: '4px 9px', borderRadius: '6px' }}
                >
                  Delete
                </Button>
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

import { useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useProfileReorder } from '../../../hooks/useProfileReorder';
import { Button } from '../../ui/Button';
import { ConfirmModal } from '../ConfirmModal';

export const TabProfiles = ({ openEditProfile, scrollContainerRef }) => {
  const profiles = usePersistentStore((state) => state.profiles);
  const config = usePersistentStore((state) => state.config);
  const updateProfiles = usePersistentStore((state) => state.updateProfiles);
  const vi = config.uiLanguage === 'vi';
  const text = (en, viText) => (vi ? viText : en);

  const [query, setQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const itemRefs = useRef(new Map());

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

  const beginPointerDrag = useProfileReorder({
    orderedProfiles: sortedProfiles,
    disabled: dragDisabled,
    itemRefs,
    scrollContainerRef,
    onCommit: updateProfiles,
  });

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
      <div className="rwa-section-kicker">{text('Profiles List — Drag ≡ to Reorder Presets', 'Danh sách thiết lập — kéo ≡ để sắp xếp')}</div>

      <input
        type="search"
        className="rwa-inp rwa-profile-search"
        placeholder={text('Search profiles…', 'Tìm thiết lập…')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={text('Search profiles', 'Tìm thiết lập')}
      />
      <div className="rwa-profile-summary">
        {vi
          ? `${visibleProfiles.length}/${profiles.length} đang hiển thị. Thiết lập bị ẩn vẫn có thể chỉnh sửa tại đây nhưng không xuất hiện trong popup viết lại.${dragDisabled ? ' Xóa nội dung tìm kiếm để sắp xếp.' : ''}`
          : `${visibleProfiles.length}/${profiles.length} shown. Hidden profiles stay editable here but do not appear in the rewrite popup.${dragDisabled ? ' Clear search to reorder.' : ''}`}
      </div>

      <div className="rwa-profile-list">
        {visibleProfiles.map((profile) => (
          <div
            key={profile.id}
            ref={(node) => {
              if (node) itemRefs.current.set(profile.id, node);
              else itemRefs.current.delete(profile.id);
            }}
            className="rwa-item rwa-profile-row"
            style={{ opacity: profile.hidden ? 0.55 : 1 }}
          >
            <button
              type="button"
              className="rwa-hnd rwa-profile-drag-handle"
              title={dragDisabled ? text('Clear search to reorder', 'Xóa tìm kiếm để sắp xếp') : text('Drag to reorder', 'Kéo để sắp xếp')}
              aria-label={text(`Reorder ${profile.name}`, `Sắp xếp lại ${profile.name}`)}
              disabled={dragDisabled}
              onPointerDown={(event) => beginPointerDrag(event, profile.id)}
            >≡</button>

            <div className="rwa-profile-copy">
              <div className="rwa-profile-row-name" style={{ color: profile.color || 'var(--rwa-primary)' }}>
                {profile.name}{profile.hidden ? text(' · hidden', ' · đã ẩn') : ''}
              </div>
              <div className="rwa-profile-row-prompt">{profile.prompt}</div>
            </div>

            <div className="rwa-profile-actions">
              <Button onClick={() => toggleHidden(profile.id)} title={profile.hidden ? text('Show this profile in the popup', 'Hiện thiết lập này trong popup') : text('Hide this profile from the popup', 'Ẩn thiết lập này khỏi popup')} aria-label={text(`${profile.hidden ? 'Show' : 'Hide'} ${profile.name} in popup`, `${profile.hidden ? 'Hiện' : 'Ẩn'} ${profile.name} trong popup`)}>
                {profile.hidden ? text('Show', 'Hiện') : text('Hide', 'Ẩn')}
              </Button>
              <Button onClick={() => openEditProfile(profile)}>{text('Edit', 'Sửa')}</Button>
              <Button variant="rwa-dng" onClick={() => setDeleteConfirmId(profile.id)}>{text('Delete', 'Xóa')}</Button>
            </div>
          </div>
        ))}
      </div>

      {visibleProfiles.length === 0 && (
        <div className="rwa-prev" style={{ fontSize: '11px', opacity: 0.7 }}>{text('No profiles match this search.', 'Không có thiết lập nào khớp tìm kiếm.')}</div>
      )}

      {deleteConfirmId !== null && (
        <ConfirmModal
          message={text(
            `Are you sure you want to delete the profile "${profiles.find((profile) => profile.id === deleteConfirmId)?.name || 'this preset'}"?`,
            `Bạn có chắc muốn xóa thiết lập "${profiles.find((profile) => profile.id === deleteConfirmId)?.name || 'này'}" không?`,
          )}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </>
  );
};

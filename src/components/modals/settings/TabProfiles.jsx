import React, { useState, useEffect } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { Button } from '../../ui/Button';
import { ConfirmModal } from '../ConfirmModal';

export const TabProfiles = ({ openEditProfile }) => {
  const { profiles, updateProfiles } = usePersistentStore();
  
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isGhostCaptured, setIsGhostCaptured] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);

  // Biến toàn cục để đồng bộ khoảng cách
  const GAP = 6; 

  // =========================================================================
  // [BẢN VÁ LỖI TỐI THƯỢNG]: TIÊU DIỆT TRIỆT ĐỂ CON TRỎ GẠCH CHÉO
  // Phủ sóng toàn bộ trình duyệt, ép hệ điều hành luôn giữ con trỏ "Move"
  // =========================================================================
  useEffect(() => {
    const forceMoveCursor = (e) => {
      e.preventDefault(); // Chặn mọi hành vi từ chối thả của trình duyệt
      e.dataTransfer.dropEffect = "move"; // Ép con trỏ luôn là hình bàn tay/mũi tên di chuyển
    };

    if (draggedIndex !== null) {
      // Khi đang kéo, bất kể chuột bay ra ngoài giao diện plugin hay lọt vào khe hở
      // window sẽ tóm gọn sự kiện và ép nó hợp lệ
      window.addEventListener('dragover', forceMoveCursor, { passive: false });
      window.addEventListener('dragenter', forceMoveCursor, { passive: false });
    }

    return () => {
      window.removeEventListener('dragover', forceMoveCursor);
      window.removeEventListener('dragenter', forceMoveCursor);
    };
  }, [draggedIndex]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
    
    setTimeout(() => setIsGhostCaptured(true), 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Vẫn giữ lại Auto-scroll để cuộn danh sách bằng cách kéo sát mép
  const handleContainerDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move"; 

    const container = document.querySelector('.rwa-body') || document.documentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const buffer = 70; 
      const scrollSpeed = 15; 

      if (e.clientY < rect.top + buffer) {
        container.scrollTop -= scrollSpeed;
      } else if (e.clientY > rect.bottom - buffer) {
        container.scrollTop += scrollSpeed;
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsGhostCaptured(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      handleDragEnd();
      return;
    }

    const newProfiles = [...profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedItem = newProfiles[draggedIndex];
    newProfiles.splice(draggedIndex, 1);
    newProfiles.splice(dragOverIndex, 0, draggedItem);

    const updated = newProfiles.map((p, i) => ({ ...p, order: i }));
    updateProfiles(updated);

    handleDragEnd();
  };

  const handleDelete = () => {
    if (deleteConfirmIndex !== null) {
      const newProfiles = [...profiles];
      newProfiles.splice(deleteConfirmIndex, 1);
      const updated = newProfiles.map((p, i) => ({ ...p, order: i }));
      updateProfiles(updated);
      setDeleteConfirmIndex(null);
    }
  };

  const sortedProfiles = [...profiles].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <div style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--rwa-primary)", marginBottom: "14px" }}>
        Profiles List — Drag ≡ to Reorder Presets
      </div>

      <div 
        style={{ display: "flex", flexDirection: "column", paddingBottom: "20px", minHeight: "50px" }}
        onDragOver={handleContainerDragOver}
        onDrop={handleDrop}
      >
        {sortedProfiles.map((pr, index) => {
          
          let translateY = "0px";
          const isDraggingThis = draggedIndex === index;

          if (draggedIndex !== null && dragOverIndex !== null && !isDraggingThis) {
            if (draggedIndex < dragOverIndex && index > draggedIndex && index <= dragOverIndex) {
              translateY = `calc(-100% - ${GAP}px)`; 
            } else if (draggedIndex > dragOverIndex && index < draggedIndex && index >= dragOverIndex) {
              translateY = `calc(100% + ${GAP}px)`; 
            }
          }

          return (
            <div 
              key={pr.id} 
              className="rwa-item"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              style={{ 
                transform: `translateY(${translateY})`,
                transition: isDraggingThis ? "none" : "transform 0.3s cubic-bezier(0.2, 1, 0.2, 1)",
                opacity: (isDraggingThis && isGhostCaptured) ? 0.3 : 1, 
                borderStyle: isDraggingThis ? "dashed" : "solid",
                borderColor: isDraggingThis ? "var(--rwa-primary)" : "rgba(255, 255, 255, 0.05)",
                background: isDraggingThis ? "rgba(255, 140, 0, 0.03)" : "transparent",
                zIndex: isDraggingThis ? 2 : 1,
                position: "relative",
                marginBottom: `${GAP}px`, 
                padding: "8px 12px" 
              }}
            >
              <div className="rwa-hnd">≡</div>
              
              <div style={{ flex: 1, overflow: "hidden", pointerEvents: "none" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: pr.color || "var(--rwa-primary)", marginBottom: "4px" }}>
                  {pr.name}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {pr.prompt}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <Button 
                  onClick={() => openEditProfile(pr, index)}
                  style={{ fontSize: "10.5px", padding: "4px 12px", borderRadius: "6px" }}
                >
                  Edit
                </Button>
                <Button 
                  variant="rwa-dng" 
                  onClick={() => setDeleteConfirmIndex(index)}
                  style={{ fontSize: "10.5px", padding: "4px 12px", borderRadius: "6px" }}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {deleteConfirmIndex !== null && (
        <ConfirmModal 
          message={`Are you sure you want to delete the profile "${profiles[deleteConfirmIndex]?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmIndex(null)}
        />
      )}
    </>
  );
};
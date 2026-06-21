import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';

const ToastItem = ({ toast }) => {
  const [show, setShow] = useState(false);
  // Gọi hàm xóa toast từ store (Giả định store có hàm removeToast)
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    // 1. Sau 10ms: Thêm class rwa-toast-show để trượt lên
    const showTimer = setTimeout(() => setShow(true), 10);
    
    // 2. Sau 3000ms: Gỡ class rwa-toast-show để trượt xuống / mờ dần
    const hideTimer = setTimeout(() => {
      setShow(false);
      // 3. Đợi thêm 400ms cho animation hoàn tất rồi mới gỡ hoàn toàn khỏi React Node (DOM)
      setTimeout(() => {
        if (removeToast) removeToast(toast.id);
      }, 400);
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, removeToast]);

  const iconMap = { ok: "✓", err: "✕", warn: "⚠️" };
  const classMap = { ok: "rwa-toast-icon-ok", err: "rwa-toast-icon-err", warn: "rwa-toast-icon-warn" };
  
  return (
    <div className={`rwa-toast-container ${show ? 'rwa-toast-show' : ''}`}>
      <span className={classMap[toast.variant] || classMap.warn}>
        {iconMap[toast.variant] || iconMap.warn}
      </span>
      <span>{toast.message}</span>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  
  return (
    <>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </>
  );
};
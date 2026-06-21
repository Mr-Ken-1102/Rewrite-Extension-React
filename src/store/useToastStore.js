import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  
  // variant: 'ok' | 'err' | 'warn'
  showToast: (message, variant = 'ok') => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }]
    }));

    // [BẢN VÁ]: KHÔNG DÙNG setTimeout ở đây nữa.
    // Việc tính toán thời gian tồn tại (3000ms) và animation fade-out (400ms) 
    // giờ đây được quản lý 100% bên trong useEffect của ToastContainer.jsx
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
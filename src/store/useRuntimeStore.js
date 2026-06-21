import { create } from 'zustand';

export const useRuntimeStore = create((set, get) => ({
  marinara: null, 
  hostElement: null,
  shadowRoot: null,
  abortControllers: new Set(),
  isProcessing: false,
  isDragging: false,
  mouseX: 0,
  mouseY: 0,
  lastClickedMid: null,
  
  selection: { text: "", mid: "", cid: null, isTa: true, start: -1, end: -1, el: null, detectedRole: null },
  
  popupPosition: null, 
  activeModal: null, 
  previewData: null, 

  setMarinara: (marinara) => set({ marinara }),
  setHost: (hostElement, shadowRoot) => set({ hostElement, shadowRoot }),
  setMousePos: (mouseX, mouseY) => set({ mouseX, mouseY }),
  setDragging: (isDragging) => set({ isDragging }),
  setLastClickedMid: (mid) => set({ lastClickedMid: mid }),
  setSelection: (selection) => set({ selection }),
  setPopupPosition: (popupPosition) => set({ popupPosition }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setPreviewData: (previewData) => set({ previewData }),
  
  // TỐI ƯU HÓA: Tạo Set mới thay vì mutate trực tiếp
  registerController: (ctrl) => set((state) => {
    const newControllers = new Set(state.abortControllers);
    newControllers.add(ctrl);
    return { abortControllers: newControllers };
  }),

  abortAll: () => {
    const { abortControllers } = get();
    abortControllers.forEach(ctrl => {
      try { ctrl.abort(); } catch (e) {}
    });
    // Trả về Set rỗng để dọn dẹp bộ nhớ
    set({ abortControllers: new Set(), isProcessing: false });
  },
  
  setProcessing: (isProcessing) => set({ isProcessing }),

  reset: () => {
    get().abortAll();
    set({
      selection: { text: "", mid: "", cid: null, isTa: true, start: -1, end: -1, el: null, detectedRole: null },
      popupPosition: null,
      activeModal: null,
      previewData: null
    });
  }
}));
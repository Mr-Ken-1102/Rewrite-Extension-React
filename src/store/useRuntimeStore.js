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
  
  selection: { source: null, text: '', mid: '', cid: null, start: -1, end: -1, el: null, detectedRole: null },
  
  popupPosition: null,
  draftReplyPanelPositions: {},
  draftReplyPanelPositionResetVersion: 0,

  setMarinara: (marinara) => set({ marinara }),
  setHost: (hostElement, shadowRoot) => set({ hostElement, shadowRoot }),
  setMousePos: (mouseX, mouseY) => set({ mouseX, mouseY }),
  setDragging: (isDragging) => set({ isDragging }),
  setLastClickedMid: (mid) => set({ lastClickedMid: mid }),
  setSelection: (selection) => set({ selection }),
  setPopupPosition: (popupPosition) => set({ popupPosition }),
  setDraftReplyPanelPosition: (mode, position) => set((state) => {
    const key = String(mode || '').trim();
    if (!key || !position || !Number.isFinite(Number(position.left)) || !Number.isFinite(Number(position.top))) return state;
    return {
      draftReplyPanelPositions: {
        ...state.draftReplyPanelPositions,
        [key]: { left: Math.round(Number(position.left)), top: Math.round(Number(position.top)) },
      },
    };
  }),
  resetDraftReplyPanelPositions: () => set((state) => ({
    draftReplyPanelPositions: {},
    draftReplyPanelPositionResetVersion: state.draftReplyPanelPositionResetVersion + 1,
  })),
  
  registerController: (ctrl) => set((state) => {
    const newControllers = new Set(state.abortControllers);
    newControllers.add(ctrl);
    return { abortControllers: newControllers, isProcessing: newControllers.size > 0 };
  }),

  unregisterController: (ctrl) => set((state) => {
    const next = new Set(state.abortControllers);
    next.delete(ctrl);
    return { abortControllers: next, isProcessing: next.size > 0 };
  }),

  abortAll: () => {
    const { abortControllers } = get();
    abortControllers.forEach(ctrl => {
      try { ctrl.abort(); } catch {}
    });
    set({ abortControllers: new Set(), isProcessing: false });
  },
  
  reset: () => {
    get().abortAll();
    set({
      selection: { source: null, text: '', mid: '', cid: null, start: -1, end: -1, el: null, detectedRole: null },
      popupPosition: null,
      draftReplyPanelPositions: {},
      draftReplyPanelPositionResetVersion: get().draftReplyPanelPositionResetVersion + 1,
      isDragging: false
    });
  }
}));
import { useCallback } from 'react';

// The previous cursor-following glow measured button geometry on pointermove.
// The current visual system intentionally uses static hover/focus states so
// settings navigation and drag interactions stay on the compositor fast path.
export function useGlowPointer() {
  return useCallback(() => {}, []);
}

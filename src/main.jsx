import ReactDOM from 'react-dom/client';
import App from './App';
import { useRuntimeStore } from './store/useRuntimeStore';
import { RWA_PREMIUM_CSS } from './styles.js';
import { RWA_BALANCE_CSS } from './styles-balance.js';
import { RWA_WORLDCLASS_CSS } from './styles-worldclass.js';
import { RWA_PERFORMANCE_CSS } from './styles-performance.js';
import { RWA_POPUP_CSS } from './styles-popup.js';
import { diffWorkerInstance } from './services/diffWorkerService';
import { usePersistentStore } from './store/usePersistentStore';
import { MarinaraHost } from './services/marinaraHost';
import { debugLogService } from './services/debugLogService';
import { sessionLedgerStore } from './services/advancedRewriteService';

(function bootstrap(envMarinara) {
  'use strict';

  const currentMarinara = envMarinara || globalThis.marinara || null;
  if (!currentMarinara) {
    console.error('[Rewrite Assistant] Marinara full-page API is unavailable.');
    return;
  }

  try { window.__rwa_active_instance__?.destroy?.(); } catch { /* best effort */ }
  document.getElementById('rwa-shadow-host')?.remove();

  useRuntimeStore.getState().setMarinara(currentMarinara);
  MarinaraHost.setHost(currentMarinara);

  let destroyed = false;
  let root = null;
  let hostElement = null;
  let shadowRoot = null;
  let stopFocusSteal = null;
  let unsubscribeDebug = null;

  const destroyInstance = () => {
    if (destroyed) return;
    destroyed = true;
    try { useRuntimeStore.getState().abortAll(); } catch { /* noop */ }
    try { shadowRoot?.removeEventListener('mousedown', stopFocusSteal); } catch { /* noop */ }
    try { diffWorkerInstance.dispose(); } catch { /* noop */ }
    try { unsubscribeDebug?.(); } catch { /* noop */ }
    try { sessionLedgerStore.clear(); } catch { /* noop */ }
    debugLogService.setEnabled(false);
    try { root?.unmount(); } catch { /* noop */ }
    try { hostElement?.remove(); } catch { /* noop */ }
    useRuntimeStore.getState().reset();
    useRuntimeStore.getState().setDragging(false);
    useRuntimeStore.getState().setHost(null, null);
    useRuntimeStore.getState().setMarinara(null);
    MarinaraHost.setHost(null);
    if (window.__rwa_active_instance__?.destroy === destroyInstance) delete window.__rwa_active_instance__;
  };

  window.__rwa_active_instance__ = { destroy: destroyInstance };

  if (typeof currentMarinara.onCleanup === 'function') currentMarinara.onCleanup(destroyInstance);

  async function hydrateAndMount() {
    try {
      await usePersistentStore.persist.rehydrate();
    } catch (error) {
      console.warn('[Rewrite Assistant] Private state hydration failed; defaults will be used.', error);
    }
    if (destroyed) return;

    debugLogService.setEnabled(usePersistentStore.getState().config.debugEnabled === true, { clearOnDisable: false });
    unsubscribeDebug = usePersistentStore.subscribe((state) => {
      debugLogService.setEnabled(state.config.debugEnabled === true);
    });

    hostElement = document.createElement('div');
    hostElement.id = 'rwa-shadow-host';
    hostElement.style.cssText = 'position:fixed!important;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647;display:block;';
    hostElement.className = `${document.documentElement.className || ''} ${document.body.className || ''}`.trim();
    document.body.appendChild(hostElement);

    shadowRoot = hostElement.attachShadow({ mode: 'closed' });
    useRuntimeStore.getState().setHost(hostElement, shadowRoot);

    stopFocusSteal = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const insideUi = target.closest('.rwa, .rwa-tip, .rwa-ov, .rwa-win');
      if (!insideUi) return;
      const interactive = target.closest('input, select, textarea, label, button, [draggable], .rwa-tog-wrap, .rwa-item');
      if (!interactive) event.preventDefault();
    };
    shadowRoot.addEventListener('mousedown', stopFocusSteal);

    const reactRootContainer = document.createElement('div');
    reactRootContainer.id = 'rwa-react-root';
    shadowRoot.appendChild(reactRootContainer);

    const styleContainer = document.createElement('style');
    styleContainer.id = 'rwa-premium-styles';
    styleContainer.textContent = `${RWA_PREMIUM_CSS}\n${RWA_BALANCE_CSS}\n${RWA_WORLDCLASS_CSS}\n${RWA_PERFORMANCE_CSS}\n${RWA_POPUP_CSS}`;
    shadowRoot.appendChild(styleContainer);

    if (destroyed) {
      destroyInstance();
      return;
    }

    root = ReactDOM.createRoot(reactRootContainer);
    root.render(<App />);
  }

  void hydrateAndMount();
})(typeof marinara !== 'undefined' ? marinara : undefined);

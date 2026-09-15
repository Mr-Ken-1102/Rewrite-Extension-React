import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useRuntimeStore } from './store/useRuntimeStore';
import { usePersistentStore } from './store/usePersistentStore';
import { RWA_PREMIUM_CSS } from './styles.js';

(function (envMarinara) {
  'use strict';

  const currentMarinara = typeof envMarinara !== 'undefined'
    ? envMarinara
    : (typeof marinara !== 'undefined' ? marinara : null);

  if (!currentMarinara) {
    console.error('[Rewrite Assistant] Marinara full-page API is unavailable.');
    return;
  }

  const RWA_CONFIG = {
    extId: currentMarinara.extension?.id || 'premium',
    get ns() { return `rwa-${this.extId}-`; },
  };

  const initReactApp = async () => {
    const previous = window.__rwa_active_instance__;
    if (previous && typeof previous.destroy === 'function') {
      try { previous.destroy(); } catch (error) { console.warn('[Rewrite Assistant] Previous instance cleanup failed.', error); }
    }

    useRuntimeStore.getState().setMarinara(currentMarinara);

    try {
      await usePersistentStore.persist.rehydrate();
    } catch (error) {
      console.warn('[Rewrite Assistant] Private state hydration failed; defaults will be used.', error);
    }

    if (document.getElementById('rwa-shadow-host')) {
      document.getElementById('rwa-shadow-host')?.remove();
    }

    const hostElement = document.createElement('div');
    hostElement.id = 'rwa-shadow-host';
    hostElement.style.cssText = 'position: fixed !important; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 2147483647; display: block;';
    hostElement.className = `${document.documentElement.className || ''} ${document.body.className || ''}`.trim();
    document.body.appendChild(hostElement);

    const shadowRoot = hostElement.attachShadow({ mode: 'closed' });
    useRuntimeStore.getState().setHost(hostElement, shadowRoot);

    shadowRoot.addEventListener('mousedown', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const rwaPopup = target.closest('.rwa') || target.closest('.rwa-tip') || target.closest('.rwa-ov') || target.closest('.rwa-win');
      if (!rwaPopup) return;

      const exemptTags = ['INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
      const isExempt = exemptTags.includes(target.tagName)
        || target.closest('label')
        || target.closest('.rwa-tog-wrap')
        || target.closest('.rwa-item')
        || target.closest('[draggable]');
      if (!isExempt) event.preventDefault();
    });

    const reactRootContainer = document.createElement('div');
    reactRootContainer.id = 'rwa-react-root';
    shadowRoot.appendChild(reactRootContainer);

    const styleContainer = document.createElement('style');
    styleContainer.id = 'rwa-premium-styles';
    styleContainer.textContent = RWA_PREMIUM_CSS;
    shadowRoot.appendChild(styleContainer);

    const root = ReactDOM.createRoot(reactRootContainer);
    root.render(
      <React.StrictMode>
        <App config={RWA_CONFIG} styleTarget={styleContainer} />
      </React.StrictMode>,
    );

    let destroyed = false;
    const instance = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        try { root.unmount(); } catch (error) { console.warn('[Rewrite Assistant] React cleanup failed.', error); }
        hostElement.remove();
        useRuntimeStore.getState().reset();
        if (window.__rwa_active_instance__ === instance) {
          delete window.__rwa_active_instance__;
        }
      },
    };

    window.__rwa_active_instance__ = instance;

    if (typeof currentMarinara.onCleanup === 'function') {
      currentMarinara.onCleanup(() => instance.destroy());
    }
  };

  void initReactApp();
})(typeof marinara !== 'undefined' ? marinara : undefined);

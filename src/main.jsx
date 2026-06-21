import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useRuntimeStore } from './store/useRuntimeStore';
import { RWA_PREMIUM_CSS } from './styles.js';

(function (envMarinara) {
  "use strict";

  // Bắt chuẩn xác biến nền tảng từ môi trường (tránh undefined)
  const currentMarinara = typeof envMarinara !== 'undefined' ? envMarinara : (typeof marinara !== 'undefined' ? marinara : (window.marinara || {}));

  const RWA_CONFIG = {
    extId: currentMarinara.extensionId || "premium",
    get ns() { return `rwa-${this.extId}-`; },
  };

  const initReactApp = () => {
    if (document.getElementById('rwa-shadow-host')) return;

    // Lưu ngay biến marinara vào Store toàn cục để APIService và các Tab xài chung
    useRuntimeStore.getState().setMarinara(currentMarinara);

    const hostElement = document.createElement('div');
    hostElement.id = 'rwa-shadow-host';
    // [BẢN VÁ LỖI CỐT LÕI]: Chuyển sang fixed !important để cách ly hoàn toàn khỏi thanh cuộn trang web gốc
    hostElement.style.cssText = 'position: fixed !important; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 2147483647; display: block;';
    
    hostElement.className = `${document.documentElement.className || ''} ${document.body.className || ''}`.trim();
    document.body.appendChild(hostElement);

    const shadowRoot = hostElement.attachShadow({ mode: 'closed' });
    
    useRuntimeStore.getState().setHost(hostElement, shadowRoot);

    shadowRoot.addEventListener("mousedown", (e) => {
      const target = e.target;
      const rwaPopup = target.closest(".rwa") || target.closest(".rwa-tip") || target.closest(".rwa-ov") || target.closest(".rwa-win");
      if (rwaPopup) {
        const exemptTags = ["INPUT", "SELECT", "TEXTAREA", "LABEL"];
        const isExempt = exemptTags.includes(target.tagName) || target.closest('label') || target.closest('.rwa-tog-wrap') || target.closest('.rwa-item') || target.closest('[draggable]');
        if (!isExempt) e.preventDefault();
      }
    });

    const reactRootContainer = document.createElement('div');
    reactRootContainer.id = 'rwa-react-root';
    shadowRoot.appendChild(reactRootContainer);

    const styleContainer = document.createElement('style');
    styleContainer.id = 'rwa-premium-styles';
    styleContainer.innerHTML = RWA_PREMIUM_CSS; 
    shadowRoot.appendChild(styleContainer);

    const root = ReactDOM.createRoot(reactRootContainer);
    root.render(
      <React.StrictMode>
        <App config={RWA_CONFIG} styleTarget={styleContainer} />
      </React.StrictMode>
    );

    const destroyInstance = () => {
      root.unmount();
      if (hostElement) hostElement.remove();
      useRuntimeStore.getState().reset();
    };

    if (window.__rwa_active_instance__ && typeof window.__rwa_active_instance__.destroy === "function") {
      try { window.__rwa_active_instance__.destroy(); } catch (e) {}
    }
    window.__rwa_active_instance__ = { destroy: destroyInstance };

    if (currentMarinara.destroy) {
      const originalDestroy = currentMarinara.destroy;
      currentMarinara.destroy = () => { destroyInstance(); originalDestroy(); };
    } else {
      currentMarinara.destroy = destroyInstance;
    }
  };

  initReactApp();

})(typeof marinara !== 'undefined' ? marinara : undefined);
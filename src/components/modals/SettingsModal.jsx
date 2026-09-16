import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { TabProfiles } from './settings/TabProfiles';
import { TabUI } from './settings/TabUI';
import { TabAPI } from './settings/TabAPI';
import { TabContext } from './settings/TabContext';
import { TabData } from './settings/TabData';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';

export const SettingsModal = ({ onClose, openEditProfile, openAIArchitect }) => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [showAbout, setShowAbout] = useState(false);
  const bodyRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollPositionsRef = useRef({});
  useDialogFocusTrap(dialogRef, onClose);

  const handleTabChange = (tab) => {
    if (bodyRef.current) scrollPositionsRef.current[activeTab] = bodyRef.current.scrollTop;
    setActiveTab(tab);
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = scrollPositionsRef.current[activeTab] || 0;
  }, [activeTab]);

  const handleGlowMouseMove = (e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty("--x", `${x}px`);
      target.style.setProperty("--y", `${y}px`);
    }
  };

  return (
    <div className="rwa-ov" onMouseMove={handleGlowMouseMove}>
      <div ref={dialogRef} className="rwa-win rwa-settings-win" role="dialog" aria-modal="true" aria-label="Rewrite Assistant Settings" tabIndex={-1}>
        <div className="rwa-topbar"></div>

        {/* HEADER */}
        <div className="rwa-hdr rwa-settings-hdr">
          <div className="rwa-title">Rewrite Assistant Settings</div>

          <div className="rwa-hdr-actions">
            {/* Nút bật/tắt About (Đã đồng bộ kích thước bằng nút X) */}
            <Button
              className="rwa-glow-button rwa-btn-info"
              onClick={() => setShowAbout(!showAbout)}
              title="About & Info"
              aria-label="About Rewrite Assistant"
            >
              {showAbout ? '🔙' : 'ℹ️'}
            </Button>

            {/* Nút Đóng */}
            <Button
              className="rwa-glow-button rwa-btn-close"
              onClick={onClose}
              aria-label="Close settings"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* ẨN TABS KHI MỞ TRANG ABOUT */}
        {!showAbout && (
          <div className="rwa-tabs rwa-settings-tabs" role="tablist" aria-label="Settings sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profiles'}
              className={`rwa-tab-btn ${activeTab === 'profiles' ? 'rwa-active' : ''}`}
              onClick={() => handleTabChange('profiles')}
            >
              🎨 Style Presets
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ui'}
              className={`rwa-tab-btn ${activeTab === 'ui' ? 'rwa-active' : ''}`}
              onClick={() => handleTabChange('ui')}
            >
              ⚙️ UI Preferences
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'api'}
              className={`rwa-tab-btn ${activeTab === 'api' ? 'rwa-active' : ''}`}
              onClick={() => handleTabChange('api')}
            >
              ⚡ API & LLM
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'context'}
              className={`rwa-tab-btn ${activeTab === 'context' ? 'rwa-active' : ''}`}
              onClick={() => handleTabChange('context')}
            >
              🧠 Context
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'data'}
              className={`rwa-tab-btn ${activeTab === 'data' ? 'rwa-active' : ''}`}
              onClick={() => handleTabChange('data')}
            >
              💾 Data & Debug
            </button>
          </div>
        )}

        {/* NỘI DUNG CHÍNH */}
        <div ref={bodyRef} className="rwa-body rwa-settings-body">
          {showAbout ? (
            /* ======================================================
               GIAO DIỆN ABOUT COMPACT (TIẾNG ANH - OPTION 1)
               ====================================================== */
            <div className="rwa-about-container">
              <div className="rwa-prev rwa-about-box">
                <div className="rwa-about-header-zone">
                  <h3 className="rwa-about-title">🚀 REWRITE ASSISTANT V3</h3>
                  <p className="rwa-about-subtitle">
                    Version 3.0.0<br/>
                    Developed by <strong>Mr.Kiều.1102</strong>
                  </p>
                  <p className="rwa-about-thanks-to">
                    Special thanks to: Beeopo @ Marinara Engine Discord
                  </p>
                </div>

                <div className="rwa-about-sep"></div>

                <p className="rwa-about-desc">
                  <strong>The Story Behind the Code:</strong><br/>
                  I initially fell in love with an awesome extension made by Beeopo. However, it only supported the Sidecar connection via Marinara Engine, and my trusty RTX 3080 (10GB VRAM) simply couldn't handle running two heavy models simultaneously! 😅<br/><br/>
                  I reached out to Beeopo on Discord to ask for Ollama support, but he was likely busy. So, I decided to take matters into my own hands and build a version that connects seamlessly with local Ollama models.<br/><br/>
                  Despite having absolutely zero background in coding, I pushed through, learned as I went, and finally made it happen. Thank you guys for using it. Enjoy! ❤️
                </p>

                <div className="rwa-about-footer">
                  <Button className="rwa-glow-button rwa-btn-thanks">
                    Thank You
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================
               GIAO DIỆN TABS CÀI ĐẶT GỐC (BẢO TOÀN 100%)
               ====================================================== */
            <>
              {activeTab === 'profiles' && <TabProfiles openEditProfile={openEditProfile} scrollContainerRef={bodyRef} />}
              {activeTab === 'ui' && <TabUI onCloseModal={onClose} />}
              {activeTab === 'api' && <TabAPI />}
              {activeTab === 'context' && <TabContext />}
              {activeTab === 'data' && <TabData />}
            </>
          )}
        </div>

        {/* ẨN FOOTER KHÁC KHI MỞ TRANG ABOUT */}
        {!showAbout && (
          <div className="rwa-foot rwa-settings-foot">
            {activeTab === 'profiles' && (
              <>
                <Button
                  className="rwa-glow-button rwa-btn-add-style"
                  onClick={() => openEditProfile(null)}
                >
                  + Add Style
                </Button>
                <Button
                  className="rwa-glow-button rwa-btn-flex-1"
                  variant="rwa-accept"
                  onClick={openAIArchitect}
                >
                  ✨ AI Architect
                </Button>
              </>
            )}

            <Button className="rwa-glow-button rwa-btn-flex-1" onClick={onClose}>
              Cancel
            </Button>

            <Button className="rwa-glow-button rwa-btn-flex-1" variant="rwa-accept" onClick={onClose}>
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
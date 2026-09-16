import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { TabProfiles } from './settings/TabProfiles';
import { TabUI } from './settings/TabUI';
import { TabAPI } from './settings/TabAPI';
import { TabContext } from './settings/TabContext';
import { TabData } from './settings/TabData';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { useGlowPointer } from '../../hooks/useGlowPointer';

const SETTINGS_SECTIONS = [
  { id: 'profiles', label: 'Style Presets', meta: 'Rewrite styles', description: 'Create, organize, hide, and refine the rewrite actions shown in the popup.' },
  { id: 'ui', label: 'Interface', meta: 'Popup & behavior', description: 'Tune popup behavior, compact mode, history depth, and viewport placement.' },
  { id: 'api', label: 'AI & API', meta: 'Connection & generation', description: 'Inspect the active Marinara connection and configure generation behavior.' },
  { id: 'context', label: 'Context', meta: 'Prompt context', description: 'Control character, persona, lore, memory, and surrounding context policies.' },
  { id: 'data', label: 'Data & Debug', meta: 'Storage & diagnostics', description: 'Export portable data, inspect diagnostics, and manage local extension state.' },
];

const NavGlyph = ({ type }) => {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'profiles') {
    return <svg {...common}><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="19" r="2"/></svg>;
  }
  if (type === 'ui') {
    return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>;
  }
  if (type === 'api') {
    return <svg {...common}><path d="M8 3 4 12h7l-1 9 10-12h-7l2-6z"/></svg>;
  }
  if (type === 'context') {
    return <svg {...common}><path d="M8 5a4 4 0 0 0-4 4c0 1.2.5 2.2 1.3 3A4 4 0 0 0 8 19h8a4 4 0 0 0 2.7-7A4 4 0 0 0 16 5H8Z"/><path d="M9 9h6M9 13h6"/></svg>;
  }
  if (type === 'data') {
    return <svg {...common}><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
};

export const SettingsModal = ({ onClose, openEditProfile, openAIArchitect }) => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [showAbout, setShowAbout] = useState(false);
  const bodyRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollPositionsRef = useRef({});
  useDialogFocusTrap(dialogRef, onClose);

  const handleTabChange = (tab) => {
    if (bodyRef.current) scrollPositionsRef.current[activeTab] = bodyRef.current.scrollTop;
    setShowAbout(false);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = showAbout ? 0 : (scrollPositionsRef.current[activeTab] || 0);
  }, [activeTab, showAbout]);

  const handleGlowPointerMove = useGlowPointer();
  const activeSection = SETTINGS_SECTIONS.find((section) => section.id === activeTab) || SETTINGS_SECTIONS[0];

  return (
    <div className="rwa-ov" onPointerMove={handleGlowPointerMove}>
      <div ref={dialogRef} className="rwa-win rwa-settings-win" role="dialog" aria-modal="true" aria-label="Rewrite Assistant Settings" tabIndex={-1}>
        <div className="rwa-topbar"></div>

        <div className="rwa-hdr rwa-settings-hdr">
          <div className="rwa-settings-brand">
            <div className="rwa-settings-brand-line">
              <span className="rwa-settings-product">Rewrite Assistant</span>
              <span className="rwa-version-badge">V3</span>
            </div>
            <div className="rwa-settings-window-title">Settings</div>
          </div>

          <div className="rwa-hdr-actions">
            <Button
              className={`rwa-btn-info ${showAbout ? 'rwa-settings-about-active' : ''}`}
              onClick={() => setShowAbout((value) => !value)}
              title="About & Info"
              aria-label="About Rewrite Assistant"
            >
              <NavGlyph type="about" />
            </Button>
            <Button className="rwa-btn-close" onClick={onClose} aria-label="Close settings">✕</Button>
          </div>
        </div>

        <div className="rwa-settings-shell">
          <aside className="rwa-settings-sidebar" aria-label="Settings navigation">
            <div className="rwa-settings-nav-label">Settings</div>
            <div className="rwa-settings-nav" role="tablist" aria-label="Settings sections">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={!showAbout && activeTab === section.id}
                  className={`rwa-settings-nav-btn ${!showAbout && activeTab === section.id ? 'rwa-active' : ''}`}
                  onClick={() => handleTabChange(section.id)}
                >
                  <span className="rwa-settings-nav-icon"><NavGlyph type={section.id} /></span>
                  <span className="rwa-settings-nav-copy">
                    <strong>{section.label}</strong>
                    <small>{section.meta}</small>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`rwa-settings-nav-btn rwa-settings-nav-about ${showAbout ? 'rwa-active' : ''}`}
              onClick={() => setShowAbout(true)}
            >
              <span className="rwa-settings-nav-icon"><NavGlyph type="about" /></span>
              <span className="rwa-settings-nav-copy">
                <strong>About</strong>
                <small>Version 3.0.1</small>
              </span>
            </button>
          </aside>

          <section className="rwa-settings-workspace">
            <div className="rwa-settings-page-head">
              <div className="rwa-settings-page-kicker">{showAbout ? 'About' : activeSection.meta}</div>
              <div className="rwa-settings-page-title">{showAbout ? 'Rewrite Assistant' : activeSection.label}</div>
              <div className="rwa-settings-page-description">
                {showAbout
                  ? 'Rewrite Assistant v3.0.1 for Marinara Engine — a focused toolkit for precise, context-aware rewrites.'
                  : activeSection.description}
              </div>
            </div>

            <div ref={bodyRef} className="rwa-body rwa-settings-body">
              {showAbout ? (
                <div className="rwa-about-container">
                  <div className="rwa-about-box">
                    <div className="rwa-about-header-zone">
                      <div className="rwa-about-mark">RA</div>
                      <div>
                        <h3 className="rwa-about-title">Rewrite Assistant V3</h3>
                        <p className="rwa-about-subtitle">
                          Version 3.0.1<br/>
                          Developed by <strong>Mr.Kiều.1102</strong>
                        </p>
                        <p className="rwa-about-thanks-to">
                          Special thanks to Beeopo @ Marinara Engine Discord
                        </p>
                      </div>
                    </div>

                    <div className="rwa-about-sep"></div>

                    <p className="rwa-about-desc">
                      <strong>The Story Behind the Code</strong><br/>
                      I initially fell in love with an awesome extension made by Beeopo. However, it only supported the Sidecar connection via Marinara Engine, and my RTX 3080 (10GB VRAM) simply couldn't handle running two heavy models simultaneously.<br/><br/>
                      I reached out to Beeopo on Discord to ask for Ollama support, but he was likely busy. So, I decided to take matters into my own hands and build a version that connects seamlessly with local Ollama models.<br/><br/>
                      Despite having absolutely zero background in coding, I pushed through, learned as I went, and finally made it happen. Thank you for using it.
                    </p>

                    <div className="rwa-about-footer">
                      <span className="rwa-about-status">Marinara Engine compatible</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'profiles' && <TabProfiles openEditProfile={openEditProfile} scrollContainerRef={bodyRef} />}
                  {activeTab === 'ui' && <TabUI onCloseModal={onClose} />}
                  {activeTab === 'api' && <TabAPI />}
                  {activeTab === 'context' && <TabContext />}
                  {activeTab === 'data' && <TabData />}
                </>
              )}
            </div>

            {!showAbout && (
              <div className={`rwa-foot rwa-settings-foot ${activeTab === 'profiles' ? 'rwa-settings-foot-four' : 'rwa-settings-foot-two'}`}>
                <div className="rwa-settings-foot-leading">
                  {activeTab === 'profiles' && (
                    <>
                      <Button className="rwa-btn-add-style" onClick={() => openEditProfile(null)}>+ Add Style</Button>
                      <Button className="rwa-btn-flex-1" variant="rwa-accept" onClick={openAIArchitect}>AI Architect</Button>
                    </>
                  )}
                </div>
                <div className="rwa-settings-foot-trailing">
                  <Button className="rwa-btn-flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="rwa-btn-flex-1" variant="rwa-accept" onClick={onClose}>OK</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

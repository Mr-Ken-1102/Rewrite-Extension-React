import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { TabProfiles } from './settings/TabProfiles';
import { TabUI } from './settings/TabUI';
import { TabAPI } from './settings/TabAPI';
import { TabContext } from './settings/TabContext';
import { TabLanguage } from './settings/TabLanguage';
import { TabData } from './settings/TabData';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { usePersistentStore } from '../../store/usePersistentStore';

const SETTINGS_SECTIONS = [
  {
    id: 'profiles',
    label: 'Style Presets',
    labelVi: 'Kiểu viết',
    meta: 'Rewrite styles',
    metaVi: 'Các kiểu viết lại',
    description: 'Create, organize, hide, and refine the rewrite actions shown in the popup.',
    descriptionVi: 'Tạo, sắp xếp, ẩn và tinh chỉnh các thao tác viết lại hiển thị trong popup.',
  },
  {
    id: 'ui',
    label: 'Interface',
    labelVi: 'Giao diện',
    meta: 'Popup & behavior',
    metaVi: 'Popup & hành vi',
    description: 'Tune popup behavior, compact mode, history depth, and viewport placement.',
    descriptionVi: 'Điều chỉnh hành vi popup, chế độ gọn, độ sâu lịch sử và vị trí trong khung nhìn.',
  },
  {
    id: 'api',
    label: 'AI & API',
    labelVi: 'AI & API',
    meta: 'Connection & generation',
    metaVi: 'Kết nối & sinh nội dung',
    description: 'Inspect the active Marinara connection and configure generation behavior.',
    descriptionVi: 'Kiểm tra kết nối Marinara đang dùng và cấu hình hành vi sinh nội dung.',
  },
  {
    id: 'context',
    label: 'Context',
    labelVi: 'Ngữ cảnh',
    meta: 'Prompt context',
    metaVi: 'Ngữ cảnh prompt',
    description: 'Control character, persona, lore, memory, and surrounding context policies.',
    descriptionVi: 'Kiểm soát character, persona, lore, memory và chính sách ngữ cảnh xung quanh.',
  },
  {
    id: 'language',
    label: 'Language',
    labelVi: 'Ngôn ngữ',
    meta: 'English / Tiếng Việt',
    metaVi: 'Tiếng Việt / English',
    description: 'Choose the Rewrite Assistant interface language without changing your presets or prompts.',
    descriptionVi: 'Chọn ngôn ngữ giao diện Rewrite Assistant mà không thay đổi preset hoặc prompt của bạn.',
  },
  {
    id: 'data',
    label: 'Data & Debug',
    labelVi: 'Dữ liệu & Debug',
    meta: 'Storage & diagnostics',
    metaVi: 'Lưu trữ & chẩn đoán',
    description: 'Export portable data, inspect diagnostics, and manage local extension state.',
    descriptionVi: 'Xuất dữ liệu, xem chẩn đoán và quản lý trạng thái cục bộ của extension.',
  },
];

const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End']);

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
  if (type === 'language') {
    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>;
  }
  if (type === 'data') {
    return <svg {...common}><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
};

export const SettingsModal = ({ onClose, openEditProfile, openAIArchitect, suspended = false }) => {
  const uiLanguage = usePersistentStore((state) => state.config.uiLanguage);
  const vi = uiLanguage === 'vi';
  const [activeTab, setActiveTab] = useState('profiles');
  const [showAbout, setShowAbout] = useState(false);
  const bodyRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollPositionsRef = useRef({});
  useDialogFocusTrap(dialogRef, onClose, !suspended);

  const rememberSectionScroll = () => {
    if (bodyRef.current && !showAbout) scrollPositionsRef.current[activeTab] = bodyRef.current.scrollTop;
  };

  const handleTabChange = (tab) => {
    rememberSectionScroll();
    setShowAbout(false);
    setActiveTab(tab);
  };

  const handleAboutOpen = () => {
    rememberSectionScroll();
    setShowAbout(true);
  };

  const handleNavKeyDown = (event) => {
    if (!NAV_KEYS.has(event.key)) return;
    const target = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    if (!target) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(target);
    if (currentIndex < 0 || tabs.length === 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!(nextTab instanceof HTMLElement)) return;
    nextTab.focus({ preventScroll: true });
    nextTab.click();
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = showAbout ? 0 : (scrollPositionsRef.current[activeTab] || 0);
  }, [activeTab, showAbout]);

  const activeSection = SETTINGS_SECTIONS.find((section) => section.id === activeTab) || SETTINGS_SECTIONS[0];
  const activeTabId = showAbout ? 'rwas-tab-about' : `rwas-tab-${activeSection.id}`;
  const activeLabel = vi ? activeSection.labelVi : activeSection.label;
  const activeMeta = vi ? activeSection.metaVi : activeSection.meta;
  const activeDescription = vi ? activeSection.descriptionVi : activeSection.description;

  return (
    <div className={`rwa-ov rwas-overlay ${suspended ? 'rwas-suspended' : ''}`.trim()} aria-hidden={suspended || undefined} inert={suspended ? true : undefined}>
      <div
        ref={dialogRef}
        className="rwa-win rwas-settings"
        role="dialog"
        aria-modal="true"
        aria-label={vi ? 'Cài đặt Rewrite Assistant' : 'Rewrite Assistant Settings'}
        tabIndex={-1}
      >
        <header className="rwas-header">
          <div className="rwas-brand">
            <div className="rwas-brand-line">
              <span className="rwas-product">Rewrite Assistant</span>
              <span className="rwas-version">V3.0.3</span>
            </div>
            <div className="rwas-window-title">{vi ? 'Cài đặt' : 'Settings'}</div>
          </div>

          <Button glow={false} className="rwas-close" onClick={onClose} aria-label={vi ? 'Đóng cài đặt' : 'Close settings'}>✕</Button>
        </header>

        <div className="rwas-shell">
          <aside className="rwas-sidebar" data-legacy-contract="rwa-settings-sidebar" aria-label={vi ? 'Điều hướng cài đặt' : 'Settings navigation'}>
            <div className="rwas-nav-label">{vi ? 'Cài đặt' : 'Settings'}</div>
            <div className="rwas-nav" role="tablist" aria-label={vi ? 'Các mục cài đặt' : 'Settings sections'} onKeyDown={handleNavKeyDown}>
              {SETTINGS_SECTIONS.map((section) => {
                const selected = !showAbout && activeTab === section.id;
                return (
                  <button
                    key={section.id}
                    id={`rwas-tab-${section.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="rwas-settings-panel"
                    tabIndex={selected ? 0 : -1}
                    className={`rwas-nav-btn ${selected ? 'rwas-active' : ''}`}
                    onClick={() => handleTabChange(section.id)}
                  >
                    <span className="rwas-nav-icon"><NavGlyph type={section.id} /></span>
                    <span className="rwas-nav-copy">
                      <strong>{vi ? section.labelVi : section.label}</strong>
                      <small>{vi ? section.metaVi : section.meta}</small>
                    </span>
                  </button>
                );
              })}

              <button
                id="rwas-tab-about"
                type="button"
                role="tab"
                aria-selected={showAbout}
                aria-controls="rwas-settings-panel"
                tabIndex={showAbout ? 0 : -1}
                className={`rwas-nav-btn rwas-nav-about ${showAbout ? 'rwas-active' : ''}`}
                onClick={handleAboutOpen}
              >
                <span className="rwas-nav-icon"><NavGlyph type="about" /></span>
                <span className="rwas-nav-copy">
                  <strong>{vi ? 'Giới thiệu' : 'About'}</strong>
                  <small>Version 3.0.3</small>
                </span>
              </button>
            </div>
          </aside>

          <section
            id="rwas-settings-panel"
            role="tabpanel"
            aria-labelledby={activeTabId}
            className="rwas-workspace"
            data-legacy-contract="rwa-settings-workspace"
          >
            <div className="rwas-page-head">
              <div className="rwas-page-copy">
                <div className="rwas-page-kicker">{showAbout ? (vi ? 'Giới thiệu' : 'About') : activeMeta}</div>
                <div className="rwas-page-title">{showAbout ? 'Rewrite Assistant' : activeLabel}</div>
                <div className="rwas-page-description">
                  {showAbout
                    ? (vi
                      ? 'Rewrite Assistant v3.0.3 cho Marinara Engine — bộ công cụ tập trung cho việc viết lại chính xác và có ngữ cảnh.'
                      : 'Rewrite Assistant v3.0.3 for Marinara Engine — a focused toolkit for precise, context-aware rewrites.')
                    : activeDescription}
                </div>
              </div>

              {!showAbout && activeTab === 'profiles' && (
                <div className="rwas-page-actions" aria-label={vi ? 'Thao tác preset kiểu viết' : 'Style Preset actions'}>
                  <Button glow={false} className="rwas-secondary-action" onClick={() => openEditProfile(null)}>{vi ? '+ Thêm style' : '+ Add Style'}</Button>
                  <Button glow={false} className="rwas-primary-action" variant="rwa-accept" onClick={openAIArchitect}>AI Architect</Button>
                </div>
              )}
            </div>

            <div ref={bodyRef} className="rwa-body rwas-body">
              {showAbout ? (
                <div className="rwa-about-container">
                  <div className="rwa-about-box">
                    <div className="rwa-about-header-zone">
                      <div className="rwa-about-mark">RA</div>
                      <div>
                        <h3 className="rwa-about-title">Rewrite Assistant V3</h3>
                        <p className="rwa-about-subtitle">
                          Version 3.0.3<br/>
                          {vi ? 'Phát triển bởi' : 'Developed by'} <strong>Mr.Kiều.1102</strong>
                        </p>
                        <p className="rwa-about-thanks-to">
                          {vi ? 'Đặc biệt cảm ơn Beeopo @ Marinara Engine Discord' : 'Special thanks to Beeopo @ Marinara Engine Discord'}
                        </p>
                      </div>
                    </div>

                    <div className="rwa-about-sep"></div>

                    <p className="rwa-about-desc">
                      {vi ? (
                        <>
                          <strong>Câu chuyện phía sau mã nguồn</strong><br/>
                          Ban đầu tôi rất thích một extension tuyệt vời do Beeopo tạo ra. Tuy nhiên, extension đó chỉ hỗ trợ kết nối Sidecar qua Marinara Engine, trong khi RTX 3080 10GB của tôi không thể chạy hai model nặng cùng lúc.<br/><br/>
                          Tôi đã liên hệ Beeopo trên Discord để hỏi về hỗ trợ Ollama, nhưng có lẽ anh ấy đang bận. Vì vậy tôi quyết định tự xây dựng một phiên bản có thể kết nối ổn định với các model Ollama cục bộ.<br/><br/>
                          Dù bắt đầu với gần như không có nền tảng lập trình, tôi đã vừa học vừa làm để hoàn thành nó. Cảm ơn bạn đã sử dụng Rewrite Assistant.
                        </>
                      ) : (
                        <>
                          <strong>The Story Behind the Code</strong><br/>
                          I initially fell in love with an awesome extension made by Beeopo. However, it only supported the Sidecar connection via Marinara Engine, and my RTX 3080 (10GB VRAM) simply couldn&apos;t handle running two heavy models simultaneously.<br/><br/>
                          I reached out to Beeopo on Discord to ask for Ollama support, but he was likely busy. So, I decided to take matters into my own hands and build a version that connects seamlessly with local Ollama models.<br/><br/>
                          Despite having absolutely zero background in coding, I pushed through, learned as I went, and finally made it happen. Thank you for using it.
                        </>
                      )}
                    </p>

                    <div className="rwa-about-footer">
                      <span className="rwa-about-status">{vi ? 'Tương thích Marinara Engine' : 'Marinara Engine compatible'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'profiles' && <TabProfiles openEditProfile={openEditProfile} scrollContainerRef={bodyRef} />}
                  {activeTab === 'ui' && <TabUI onCloseModal={onClose} />}
                  {activeTab === 'api' && <TabAPI />}
                  {activeTab === 'context' && <TabContext />}
                  {activeTab === 'language' && <TabLanguage />}
                  {activeTab === 'data' && <TabData />}
                </>
              )}
            </div>

            <footer className="rwas-statusbar">
              <span className="rwas-save-status">{vi ? 'Thay đổi được lưu tự động' : 'Changes save automatically'}</span>
              <Button glow={false} className="rwas-done" variant="rwa-accept" onClick={onClose}>{vi ? 'Xong' : 'Done'}</Button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
};

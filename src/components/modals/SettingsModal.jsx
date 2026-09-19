import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { TabProfiles } from './settings/TabProfiles';
import { TabUI } from './settings/TabUI';
import { TabAPI } from './settings/TabAPI';
import { TabContext } from './settings/TabContext';
import { TabLanguage } from './settings/TabLanguage';
import { TabData } from './settings/TabData';
import { AboutPanel } from './settings/AboutPanel';
import { CreditsPanel } from './settings/CreditsPanel';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { usePersistentStore } from '../../store/usePersistentStore';

const SETTINGS_SECTIONS = [
  {
    id: 'profiles',
    label: 'Style Presets',
    labelVi: 'Thiết lập sẵn',
    meta: 'Rewrite styles',
    metaVi: 'Mẫu viết lại',
    description: 'Create, organize, hide, and refine the rewrite actions shown in the popup.',
    descriptionVi: 'Tạo, sắp xếp, ẩn và tinh chỉnh các thiết lập viết lại hiển thị trong popup.',
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
    descriptionVi: 'Kiểm soát Character, Persona, Lore, Memory và ngữ cảnh gần.',
  },
  {
    id: 'language',
    label: 'Language',
    labelVi: 'Ngôn ngữ',
    meta: 'English / Tiếng Việt',
    metaVi: 'Tiếng Việt / English',
    description: 'Choose the Rewrite Assistant interface language without changing your presets or prompts.',
    descriptionVi: 'Chọn ngôn ngữ giao diện mà không làm thay đổi thiết lập sẵn hay yêu cầu bạn đã tạo.',
  },
  {
    id: 'data',
    label: 'Data & Debug',
    labelVi: 'Dữ liệu & chẩn đoán',
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
  if (type === 'credits') {
    return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
};

export const SettingsModal = ({ onClose, openEditProfile, openAIArchitect, suspended = false, initialTab = 'profiles' }) => {
  const uiLanguage = usePersistentStore((state) => state.config.uiLanguage);
  const vi = uiLanguage === 'vi';
  const [activeTab, setActiveTab] = useState(() => (
    SETTINGS_SECTIONS.some((section) => section.id === initialTab) ? initialTab : 'profiles'
  ));
  const [specialPage, setSpecialPage] = useState(null);
  const bodyRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollPositionsRef = useRef({});
  useDialogFocusTrap(dialogRef, onClose, !suspended);

  const rememberSectionScroll = () => {
    if (bodyRef.current && !specialPage) scrollPositionsRef.current[activeTab] = bodyRef.current.scrollTop;
  };

  const handleTabChange = (tab) => {
    rememberSectionScroll();
    setSpecialPage(null);
    setActiveTab(tab);
  };

  const handleSpecialPageOpen = (page) => {
    rememberSectionScroll();
    setSpecialPage(page);
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
    if (bodyRef.current) bodyRef.current.scrollTop = specialPage ? 0 : (scrollPositionsRef.current[activeTab] || 0);
  }, [activeTab, specialPage]);

  const activeSection = SETTINGS_SECTIONS.find((section) => section.id === activeTab) || SETTINGS_SECTIONS[0];
  const activeTabId = specialPage ? `rwas-tab-${specialPage}` : `rwas-tab-${activeSection.id}`;
  const activeLabel = vi ? activeSection.labelVi : activeSection.label;
  const activeMeta = vi ? activeSection.metaVi : activeSection.meta;
  const activeDescription = vi ? activeSection.descriptionVi : activeSection.description;
  const specialPageMeta = specialPage === 'credits'
    ? {
        kicker: vi ? 'Ghi công' : 'Credits',
        title: vi ? 'Lời cảm ơn' : 'Acknowledgements',
        description: vi
          ? 'Những người và dự án đã giúp truyền cảm hứng và đồng hành cùng Rewrite Assistant.'
          : 'People and projects that inspired and supported the Rewrite Assistant journey.',
      }
    : specialPage === 'about'
      ? {
          kicker: vi ? 'Giới thiệu' : 'About',
          title: 'Rewrite Assistant',
          description: vi
            ? 'Rewrite Assistant v3.0.3 cho Marinara Engine — bộ công cụ tập trung cho việc viết lại chính xác và có ngữ cảnh.'
            : 'Rewrite Assistant v3.0.3 for Marinara Engine — a focused toolkit for precise, context-aware rewrites.',
        }
      : null;

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
                const selected = !specialPage && activeTab === section.id;
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
                id="rwas-tab-credits"
                type="button"
                role="tab"
                aria-selected={specialPage === 'credits'}
                aria-controls="rwas-settings-panel"
                tabIndex={specialPage === 'credits' ? 0 : -1}
                className={`rwas-nav-btn rwas-nav-credits ${specialPage === 'credits' ? 'rwas-active' : ''}`}
                onClick={() => handleSpecialPageOpen('credits')}
              >
                <span className="rwas-nav-icon"><NavGlyph type="credits" /></span>
                <span className="rwas-nav-copy">
                  <strong>{vi ? 'Ghi công' : 'Credits'}</strong>
                  <small>{vi ? 'Lời cảm ơn' : 'Acknowledgements'}</small>
                </span>
              </button>

              <button
                id="rwas-tab-about"
                type="button"
                role="tab"
                aria-selected={specialPage === 'about'}
                aria-controls="rwas-settings-panel"
                tabIndex={specialPage === 'about' ? 0 : -1}
                className={`rwas-nav-btn rwas-nav-about ${specialPage === 'about' ? 'rwas-active' : ''}`}
                onClick={() => handleSpecialPageOpen('about')}
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
                <div className="rwas-page-kicker">{specialPageMeta?.kicker || activeMeta}</div>
                <div className="rwas-page-title">{specialPageMeta?.title || activeLabel}</div>
                <div className="rwas-page-description">{specialPageMeta?.description || activeDescription}</div>
              </div>

              {!specialPage && activeTab === 'profiles' && (
                <div className="rwas-page-actions" aria-label={vi ? 'Thao tác thiết lập sẵn' : 'Style Preset actions'}>
                  <Button glow={false} className="rwas-secondary-action" onClick={() => openEditProfile(null)}>{vi ? '+ Thêm thiết lập' : '+ Add Style'}</Button>
                  <Button glow={false} className="rwas-primary-action" variant="rwa-accept" onClick={openAIArchitect}>AI Architect</Button>
                </div>
              )}
            </div>

            <div ref={bodyRef} className="rwa-body rwas-body">
              {specialPage === 'credits' ? (
                <CreditsPanel vi={vi} />
              ) : specialPage === 'about' ? (
                <AboutPanel vi={vi} />
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

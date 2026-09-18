import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { useToastStore } from '../store/useToastStore';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { makeHistoryKey } from '../utils/historyKey';
import { deriveTrimmedSelection } from '../utils/selectionContext';
import { useRoleRadar } from '../hooks/useRoleRadar';
import { useContextInspector } from '../hooks/useContextInspector';
import { useContextPresentation } from '../hooks/useContextPresentation';
import { usePopupDrag } from '../hooks/usePopupDrag';
import { usePopupPosition } from '../hooks/usePopupPosition';
import { PopupHeader } from './popup/PopupHeader';
import { RewriteSection } from './popup/RewriteSection';
import { ContextPanel } from './popup/ContextPanel';
import { PopupFooter } from './popup/PopupFooter';
import { voiceIdentityFromSelection } from '../services/voiceProfileIdentity.js';

const EMPTY_HISTORY = Object.freeze({ undo: [], redo: [] });
const TOOLTIP_GAP = 10;
const TOOLTIP_MAX_WIDTH = 240;
const TOOLTIP_VIEWPORT_GUTTER = 8;

function getTooltipViewportBounds() {
  const visualViewport = window.visualViewport;
  const left = Number(visualViewport?.offsetLeft) || 0;
  const top = Number(visualViewport?.offsetTop) || 0;
  const width = Math.max(1, Number(visualViewport?.width) || Number(window.innerWidth) || 1);
  const height = Math.max(1, Number(visualViewport?.height) || Number(window.innerHeight) || 1);
  return { left, top, right: left + width, bottom: top + height };
}

export const PopupMain = ({ onRewrite, onOpenSettings, onOpenCustom }) => {
  const profiles = usePersistentStore((state) => state.profiles);
  const config = usePersistentStore((state) => state.config);
  const updateConfig = usePersistentStore((state) => state.updateConfig);
  const showToast = useToastStore((state) => state.showToast);
  const selection = useRuntimeStore((state) => state.selection);
  const historyKey = makeHistoryKey(selection?.cid, selection?.mid);
  const msgHistory = usePersistentStore((state) => state.history[historyKey]) || EMPTY_HISTORY;
  const autoProfileBucket = usePersistentStore((state) => selection?.cid ? state.autoProfiles?.[selection.cid] || null : null);
  const popupPosition = useRuntimeStore((state) => state.popupPosition);
  const popupRef = useRef(null);
  const tooltipRef = useRef(null);
  const language = config.uiLanguage === 'vi' ? 'vi' : 'en';
  const vi = language === 'vi';
  const text = useCallback((en, viText) => (vi ? viText : en), [vi]);

  const [tip, setTip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [contextExclusions, setContextExclusions] = useState({});
  const [trimOpen, setTrimOpen] = useState(false);
  const [trimText, setTrimText] = useState(selection?.text || '');

  useEffect(() => {
    setContextExclusions({});
    setTrimOpen(false);
    setTrimText(selection?.text || '');
  }, [selection?.captureId, selection?.text]);

  const keepFocus = useCallback(() => {
    if (!selection || selection.source !== 'textarea') return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const textarea = selection.el;
        if (textarea?.isConnected && selection.start > -1 && selection.end > -1) {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(selection.start, selection.end);
        }
      }, 15);
    });
  }, [selection]);

  const showTooltip = useCallback((event, tooltipText) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const bounds = getTooltipViewportBounds();
    const rightCandidate = rect.right + TOOLTIP_GAP;
    const leftCandidate = rect.left - TOOLTIP_MAX_WIDTH - TOOLTIP_GAP;
    const x = rightCandidate + TOOLTIP_MAX_WIDTH <= bounds.right - TOOLTIP_VIEWPORT_GUTTER
      ? rightCandidate
      : leftCandidate;
    setTip({ show: true, text: tooltipText, x, y: rect.top });
  }, []);

  const hideTooltip = useCallback(() => {
    setTip((current) => ({ ...current, show: false }));
  }, []);

  useLayoutEffect(() => {
    if (!tip.show || !tooltipRef.current) return;
    const bounds = getTooltipViewportBounds();
    const rect = tooltipRef.current.getBoundingClientRect();
    let nextX = tip.x;
    let nextY = tip.y;
    const minX = bounds.left + TOOLTIP_VIEWPORT_GUTTER;
    const maxX = bounds.right - TOOLTIP_VIEWPORT_GUTTER;
    const minY = bounds.top + TOOLTIP_VIEWPORT_GUTTER;
    const maxY = bounds.bottom - TOOLTIP_VIEWPORT_GUTTER;

    if (rect.right > maxX) nextX -= rect.right - maxX;
    if (rect.left < minX) nextX += minX - rect.left;
    if (rect.bottom > maxY) nextY -= rect.bottom - maxY;
    if (rect.top < minY) nextY += minY - rect.top;

    if (Math.abs(nextX - tip.x) > 0.5 || Math.abs(nextY - tip.y) > 0.5) {
      setTip((current) => current.show ? { ...current, x: nextX, y: nextY } : current);
    }
  }, [tip.show, tip.text, tip.x, tip.y]);

  const colCount = useMemo(() => Math.max(1, config.cols || 4), [config.cols]);
  const layoutColCount = useMemo(
    () => config.compact ? Math.min(colCount, 6) : Math.min(colCount, 4),
    [colCount, config.compact],
  );
  const sortedProfiles = useMemo(() => profiles
    .filter((profile) => profile.hidden !== true)
    .slice()
    .sort((a, b) => ((a.order || 0) - (b.order || 0)) || String(a.id).localeCompare(String(b.id))), [profiles]);

  const activeRole = useRoleRadar(selection);

  const rewriteSelection = useCallback(() => ({
    ...selection,
    contextExclusions: Object.keys(contextExclusions).filter((key) => contextExclusions[key]),
  }), [contextExclusions, selection]);

  const tokenInfo = useContextInspector(selection, rewriteSelection, config);
  const voiceIdentity = tokenInfo.voiceIdentity || voiceIdentityFromSelection(selection) || null;
  const autoProfile = voiceIdentity?.key && autoProfileBucket
    ? autoProfileBucket[voiceIdentity.key] || null
    : null;
  const { radarText, radarColor, contextSources } = useContextPresentation({
    activeRole,
    config,
    tokenInfo,
    voiceIdentity,
    text,
  });

  const handleDragStart = usePopupDrag({ popupRef, pinnedPos: config.pinnedPos, updateConfig });
  const { finalLeft, finalTop, finalVisibility } = usePopupPosition({
    popupPosition,
    selection,
    sortedProfilesLength: sortedProfiles.length,
    colCount: layoutColCount,
    rows: config.rows,
    compact: config.compact,
    popupPos: config.popupPos,
    pinnedPos: config.pinnedPos,
    hasAutoProfile: !!autoProfile,
  });

  const runProfile = useCallback((profile) => {
    hideTooltip();
    onRewrite(profile, rewriteSelection());
  }, [hideTooltip, onRewrite, rewriteSelection]);

  const toggleContextExclusion = useCallback((key) => {
    setContextExclusions((current) => ({ ...current, [key]: !current[key] }));
    keepFocus();
  }, [keepFocus]);

  const handlePinToggle = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (config.pinnedPos) {
      updateConfig({ pinnedPos: null });
      showToast(text('Popup unpinned; new selections will open beside the text.', 'Đã bỏ ghim popup; vùng chọn mới sẽ mở cạnh đoạn văn.'), 'ok');
      return;
    }
    const rect = popupRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateConfig({ pinnedPos: { left: Math.max(0, rect.left), top: Math.max(0, rect.top) } });
    showToast(text('Popup pinned to this viewport position.', 'Đã ghim popup tại vị trí này trong khung nhìn.'), 'ok');
  }, [config.pinnedPos, showToast, text, updateConfig]);

  const openTrim = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (Array.isArray(selection?.segments) && selection.segments.length > 1) {
      showToast(text(
        'Trim is intentionally disabled for cross-message selections. Adjust the browser selection instead so every message boundary remains explicit.',
        'Cắt vùng chọn được tắt cho lựa chọn qua nhiều tin nhắn. Hãy điều chỉnh vùng chọn trực tiếp trong trình duyệt để ranh giới từng tin nhắn luôn rõ ràng.',
      ), 'warn');
      return;
    }
    setTrimText(selection?.text || '');
    setTrimOpen(true);
  }, [selection, showToast, text]);

  const applyTrim = useCallback(() => {
    const { selection: nextSelection, error } = deriveTrimmedSelection(selection, trimText);
    if (!nextSelection) {
      showToast(error || text('The selection could not be trimmed safely.', 'Không thể cắt vùng chọn một cách an toàn.'), 'warn');
      return;
    }
    useRuntimeStore.getState().setSelection(nextSelection);
    setTrimOpen(false);
    showToast(text(
      `Selection trimmed to ${nextSelection.text.length.toLocaleString()} characters.`,
      `Đã cắt vùng chọn còn ${nextSelection.text.length.toLocaleString()} ký tự.`,
    ), 'ok');
  }, [selection, showToast, text, trimText]);

  if (config.onlyAltR && !selection?.forced) return null;

  return (
    <>
      <div
        ref={popupRef}
        className="rwa2-popup"
        role="region"
        aria-label={text('Rewrite selected text', 'Viết lại văn bản đã chọn')}
        style={{ left: finalLeft, top: finalTop, visibility: finalVisibility }}
      >
        <PopupHeader
          language={language}
          selection={selection}
          pinned={!!config.pinnedPos}
          onDragStart={handleDragStart}
          onTrim={openTrim}
          onPinToggle={handlePinToggle}
        />

        <main className="rwa2-workbench">
          <RewriteSection
            language={language}
            profiles={sortedProfiles}
            colCount={layoutColCount}
            rows={config.rows}
            compact={config.compact}
            autoProfile={autoProfile}
            selection={selection}
            mergeMultiMsg={config.mergeMultiMsg}
            onRun={runProfile}
            onTooltip={showTooltip}
            onTooltipLeave={hideTooltip}
          />

          <ContextPanel
            language={language}
            config={config}
            updateConfig={updateConfig}
            keepFocus={keepFocus}
            radarText={radarText}
            radarColor={radarColor}
            tokenInfo={tokenInfo}
            voiceIdentity={voiceIdentity}
            contextSources={contextSources}
            contextExclusions={contextExclusions}
            onToggleContext={toggleContextExclusion}
            onTooltip={showTooltip}
            onTooltipLeave={hideTooltip}
          />
        </main>

        <PopupFooter
          language={language}
          msgHistory={msgHistory}
          onUndo={(event) => { event.preventDefault(); event.stopPropagation(); onRewrite({ type: 'undo' }); }}
          onRedo={(event) => { event.preventDefault(); event.stopPropagation(); onRewrite({ type: 'redo' }); }}
          onCustom={() => {
            useRuntimeStore.getState().setSelection(rewriteSelection());
            onOpenCustom();
          }}
          onSettings={onOpenSettings}
        />
      </div>

      {trimOpen && (
        <Modal title={text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')} onClose={() => setTrimOpen(false)} width="500px" zIndex={10004}>
          <div className="rwa-plbl">{text('Captured text — remove only from the edges', 'Văn bản đã chọn — chỉ xóa từ hai đầu')}</div>
          <textarea
            className="rwa-inp"
            value={trimText}
            onChange={(event) => setTrimText(event.target.value)}
            maxLength={Math.max(2, selection?.text?.length || 2)}
            aria-label={text('Trimmed selection text', 'Văn bản vùng chọn đã cắt')}
            style={{ minHeight: '140px', resize: 'vertical', fontSize: '12px' }}
          />
          <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '10px', lineHeight: 1.5 }}>
            {text(
              'Safety rule: this tool only accepts one unambiguous subspan of the captured selection. It cannot edit interior words.',
              'Quy tắc an toàn: công cụ chỉ chấp nhận một đoạn con rõ ràng của vùng chọn đã chụp và không thể sửa các từ ở giữa.',
            )}
          </div>
          <div className="rwa-foot">
            <Button glow={false} onClick={() => setTrimOpen(false)} style={{ flex: 1 }}>{text('Cancel', 'Hủy')}</Button>
            <Button glow={false} variant="rwa-accept" onClick={applyTrim} style={{ flex: 1 }}>{text('Use trimmed selection', 'Dùng vùng chọn đã cắt')}</Button>
          </div>
        </Modal>
      )}

      <div
        ref={tooltipRef}
        className={`rwa2-tooltip ${tip.show ? 'rwa2-tooltip-show' : ''}`}
        role="tooltip"
        aria-hidden={!tip.show}
        style={{ left: tip.x, top: tip.y }}
      >
        {tip.text}
      </div>
    </>
  );
};

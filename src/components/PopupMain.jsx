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
import { useAutoProfileGeneration } from '../hooks/useAutoProfileGeneration';
import { usePopupDrag } from '../hooks/usePopupDrag';
import { usePopupPosition } from '../hooks/usePopupPosition';
import { PopupHeader } from './popup/PopupHeader';
import { RewriteSection } from './popup/RewriteSection';
import { ContextPanel } from './popup/ContextPanel';
import { PopupFooter } from './popup/PopupFooter';

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
  const autoProfile = usePersistentStore((state) => selection?.cid ? state.autoProfiles?.[selection.cid] || null : null);
  const popupPosition = useRuntimeStore((state) => state.popupPosition);
  const isProcessing = useRuntimeStore((state) => state.isProcessing);
  const popupRef = useRef(null);
  const tooltipRef = useRef(null);

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

  const showTooltip = useCallback((event, text) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const bounds = getTooltipViewportBounds();
    const rightCandidate = rect.right + TOOLTIP_GAP;
    const leftCandidate = rect.left - TOOLTIP_MAX_WIDTH - TOOLTIP_GAP;
    const x = rightCandidate + TOOLTIP_MAX_WIDTH <= bounds.right - TOOLTIP_VIEWPORT_GUTTER
      ? rightCandidate
      : leftCandidate;
    setTip({ show: true, text, x, y: rect.top });
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

  const colCount = useMemo(() => Math.max(1, config.cols || 3), [config.cols]);
  const layoutColCount = useMemo(
    () => config.compact ? Math.min(colCount, 6) : Math.min(colCount, 4),
    [colCount, config.compact],
  );
  const sortedProfiles = useMemo(() => profiles
    .filter((profile) => profile.hidden !== true)
    .slice()
    .sort((a, b) => ((a.order || 0) - (b.order || 0)) || String(a.id).localeCompare(String(b.id))), [profiles]);

  const activeRole = useRoleRadar(selection);
  const { radarText, radarColor } = useMemo(() => {
    if (config.freeMode) return { radarText: '✨ Free Mode', radarColor: 'var(--rwa2-brand)' };
    if (activeRole === 'user') return { radarText: '✍️ User Persona', radarColor: 'var(--rwa2-positive)' };
    if (activeRole === 'assistant') return { radarText: '🤖 Character Card', radarColor: 'var(--rwa2-brand)' };
    return { radarText: '❓ System Context', radarColor: 'var(--rwa2-text-2)' };
  }, [config.freeMode, activeRole]);

  const contextSources = useMemo(() => {
    const sources = [];
    if (!config.freeMode && config.injectChar) sources.push({ key: 'character', label: 'Character' });
    if (!config.freeMode && config.injectUser) sources.push({ key: 'persona', label: 'Persona' });
    if (!config.freeMode && config.injectLorebook) sources.push({ key: 'lore', label: 'Lore' });
    if (!config.freeMode && config.useExtenderMemory) sources.push({ key: 'memory', label: 'Memory' });
    if (config.localContextEnabled) sources.push({ key: 'surrounding', label: 'Around' });
    if ((config.contextDepth || 0) > 0) sources.push({ key: 'history', label: 'History' });
    return sources;
  }, [config.contextDepth, config.freeMode, config.injectChar, config.injectLorebook, config.injectUser, config.localContextEnabled, config.useExtenderMemory]);

  const rewriteSelection = useCallback(() => ({
    ...selection,
    contextExclusions: Object.keys(contextExclusions).filter((key) => contextExclusions[key]),
  }), [contextExclusions, selection]);

  const tokenInfo = useContextInspector(selection, rewriteSelection, config);
  useAutoProfileGeneration({ selection, config, hasProfile: !!autoProfile, isProcessing, showToast });
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
      showToast('Popup unpinned; new selections will open beside the text.', 'ok');
      return;
    }
    const rect = popupRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateConfig({ pinnedPos: { left: Math.max(0, rect.left), top: Math.max(0, rect.top) } });
    showToast('Popup pinned to this viewport position.', 'ok');
  }, [config.pinnedPos, showToast, updateConfig]);

  const openTrim = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (Array.isArray(selection?.segments) && selection.segments.length > 1) {
      showToast('Trim is intentionally disabled for cross-message selections. Adjust the browser selection instead so every message boundary remains explicit.', 'warn');
      return;
    }
    setTrimText(selection?.text || '');
    setTrimOpen(true);
  }, [selection, showToast]);

  const applyTrim = useCallback(() => {
    const { selection: nextSelection, error } = deriveTrimmedSelection(selection, trimText);
    if (!nextSelection) {
      showToast(error || 'The selection could not be trimmed safely.', 'warn');
      return;
    }
    useRuntimeStore.getState().setSelection(nextSelection);
    setTrimOpen(false);
    showToast(`Selection trimmed to ${nextSelection.text.length.toLocaleString()} characters.`, 'ok');
  }, [selection, showToast, trimText]);

  if (config.onlyAltR && !selection?.forced) return null;

  return (
    <>
      <div
        ref={popupRef}
        className="rwa2-popup"
        role="region"
        aria-label="Rewrite selected text"
        style={{ left: finalLeft, top: finalTop, visibility: finalVisibility }}
      >
        <PopupHeader
          selection={selection}
          pinned={!!config.pinnedPos}
          onDragStart={handleDragStart}
          onTrim={openTrim}
          onPinToggle={handlePinToggle}
        />

        <main className="rwa2-workbench">
          <RewriteSection
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
            config={config}
            updateConfig={updateConfig}
            keepFocus={keepFocus}
            radarText={radarText}
            radarColor={radarColor}
            tokenInfo={tokenInfo}
            contextSources={contextSources}
            contextExclusions={contextExclusions}
            onToggleContext={toggleContextExclusion}
            onTooltip={showTooltip}
            onTooltipLeave={hideTooltip}
          />
        </main>

        <PopupFooter
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
        <Modal title="Trim selection before sending" onClose={() => setTrimOpen(false)} width="500px" zIndex={10004}>
          <div className="rwa-plbl">Captured text — remove only from the edges</div>
          <textarea
            className="rwa-inp"
            value={trimText}
            onChange={(event) => setTrimText(event.target.value)}
            maxLength={Math.max(2, selection?.text?.length || 2)}
            aria-label="Trimmed selection text"
            style={{ minHeight: '140px', resize: 'vertical', fontSize: '12px' }}
          />
          <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '10px', lineHeight: 1.5 }}>
            Safety rule: this tool only accepts one unambiguous subspan of the captured selection. It cannot edit interior words.
          </div>
          <div className="rwa-foot">
            <Button glow={false} onClick={() => setTrimOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button glow={false} variant="rwa-accept" onClick={applyTrim} style={{ flex: 1 }}>Use trimmed selection</Button>
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

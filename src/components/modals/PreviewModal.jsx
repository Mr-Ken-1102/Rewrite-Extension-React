import { Fragment, useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { diffWorkerInstance } from '../../services/diffWorkerService';
import { DOMUtils } from '../../utils/domUtils';

export const PreviewModal = ({
  status,
  result,
  profile,
  selection,
  progress = null,
  pieces = null,
  applyReport = '',
  onAccept,
  onReplaceAll,
  onManualSave,
  onRetry,
  onClose,
}) => {
  const { config } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [diffOps, setDiffOps] = useState(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typeIndexRef = useRef(0);
  const timerRef = useRef(null);
  const isLoading = status === 'loading';
  const isApplying = status === 'applying';
  const isMerged = Array.isArray(pieces) && pieces.length > 1;

  useEffect(() => {
    let isMounted = true;
    setDiffOps(null);
    if (!isLoading && !isMerged && config.showDiff && result) {
      const safeOldStr = selection?.text || '';
      diffWorkerInstance.computeDiff(safeOldStr, result).then((ops) => {
        if (isMounted) setDiffOps(ops);
      });
    }
    return () => { isMounted = false; };
  }, [isLoading, isMerged, config.showDiff, result, selection]);

  useEffect(() => {
    let mounted = true;
    if (!isLoading && !isMerged && !config.showDiff && config.typewriter && result) {
      const tokens = result.split(/(\s+)/);
      if (result.length > 8000 || tokens.length > 1200) {
        setTypewriterText(result);
        return () => { mounted = false; };
      }
      typeIndexRef.current = 0;
      setTypewriterText('');
      const next = () => {
        if (!mounted) return;
        const from = typeIndexRef.current;
        const to = Math.min(tokens.length, from + 12);
        if (from < to) {
          setTypewriterText((prev) => prev + tokens.slice(from, to).join(''));
          typeIndexRef.current = to;
          timerRef.current = setTimeout(next, 16);
        }
      };
      next();
    } else if (!isLoading && result) {
      setTypewriterText(result);
    }
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, isMerged, config.showDiff, config.typewriter, result]);

  const getWcDiff = () => {
    const wc = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
    const a = wc(selection?.text);
    const b = wc(result);
    const d = b - a;
    const p = a ? Math.round((d / a) * 100) : 0;
    return `${d >= 0 ? '+' : ''}${d} words (${p >= 0 ? '+' : ''}${p}%)`;
  };

  const handleCopy = async () => {
    const copied = await DOMUtils.safeCopy(result || '');
    showToast(copied ? '✓ Copied result to clipboard' : '✕ Clipboard copy failed. The raw result remains selectable below and can also be saved as .txt.', copied ? 'ok' : 'warn');
  };

  const handleSaveFile = () => {
    const mid = String(selection?.mid || 'selection').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 50);
    const saved = DOMUtils.saveTextFile(result || '', `rewrite-${mid}.txt`);
    showToast(saved ? '✓ Saved rewrite result as a .txt file' : 'Could not create the .txt download. The result remains selectable in this window.', saved ? 'ok' : 'warn');
  };

  const handleReplaceAllClick = () => {
    const ta = selection?.source === 'textarea' ? selection.el : null;
    if (ta?.isConnected) {
      const fullSel = { ...selection, source: 'textarea', text: ta.value, originalValue: ta.value, start: 0, end: ta.value.length, el: ta };
      onReplaceAll?.(result, fullSel);
    } else {
      showToast('⚠️ Replace All is available only while the original edit box is still open.', 'warn');
    }
  };

  return (
    <Modal
      title={isLoading ? `${profile?.name} — Processing…` : (isApplying ? `${profile?.name || 'Result'} — Applying…` : `${profile?.name || 'Result'} — Result`)}
      onClose={isApplying ? () => {} : onClose}
      width="600px"
      className="rwar-window"
      bodyClassName="rwar-body"
    >
      {isLoading ? (
        <div className="rwar-loading">
          {progress ? <div className="rwa-prev rwar-progress">{progress}</div> : null}
          <section className="rwar-section">
            <div className="rwa-plbl rwar-label">Selected Passage</div>
            <div className="rwa-prev rwa-shimmer rwar-selected">{selection?.text}</div>
          </section>
          <div className="rwar-writing" aria-live="polite">
            <div className="rwa-pulse" />
            <div className="rwar-writing-copy">Writing with Intelligence…</div>
          </div>
          <div className="rwar-loading-actions">
            <Button glow={false} onClick={onClose}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          {progress ? <div className="rwa-prev rwar-progress rwar-progress-active">{progress}</div> : null}
          {applyReport ? <div role="status" className="rwa-prev rwar-apply-report">{applyReport}</div> : null}

          <section className="rwar-section">
            <div className="rwa-plbl rwar-label">Original Text</div>
            <div className="rwa-prev rwar-original">{selection?.text || ''}</div>
          </section>

          {isMerged ? (
            <section className="rwar-section">
              <div className="rwa-plbl rwar-label">Validated merged result — split by message</div>
              <div className="rwa-prev rwar-merged">
                {pieces.map((piece, index) => (
                  <div key={index} className="rwar-message-piece">
                    <div className="rwa-plbl rwar-message-label">Message {index + 1}</div>
                    <div className="rwar-message-text">{piece}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rwar-section">
              <div className="rwar-section-head">
                <div className="rwa-plbl rwar-label">{config.showDiff ? 'Diff Breakdown' : 'Result Preview'}</div>
                <div className="rwar-word-delta">{getWcDiff()}</div>
              </div>
              {config.showDiff ? <div className="rwar-diff-legend"><span className="rwar-added">Added</span><span className="rwar-removed">Removed</span></div> : null}
              <div className="rwa-prev rwar-result-preview">
                {config.showDiff ? (
                  diffOps ? diffOps.map((op, idx) => {
                    if (op.t === 'eq') return <Fragment key={idx}>{op.v}</Fragment>;
                    return <span key={idx} className={op.t === 'ins' ? 'rwar-diff-add' : 'rwar-diff-remove'}>{op.v}</span>;
                  }) : <div className="rwar-diff-loading"><div className="rwa-pulse" /><span>Computing diff…</span></div>
                ) : (config.typewriter ? typewriterText : result)}
              </div>
            </section>
          )}

          <section className="rwar-section rwar-raw-section" aria-label="Raw result — always selectable for manual recovery">
            <div className="rwar-section-head">
              <div className="rwa-plbl rwar-label" title="Raw result — always selectable for manual recovery">Raw result</div>
              <div className="rwar-recovery-note">Selectable recovery copy</div>
            </div>
            <textarea
              className="rwa-inp rwar-raw"
              readOnly
              value={result || ''}
              aria-label="Raw rewrite result"
              onFocus={(event) => event.currentTarget.select()}
            />
          </section>

          <div className="rwar-actions">
            <div className="rwar-actions-primary">
              <Button glow={false} variant="rwa-accept" onClick={() => onAccept?.(result, selection)} disabled={isApplying} className="rwar-accept">
                {isApplying ? 'Applying…' : (isMerged ? '✓ Accept All' : '✓ Accept')}
              </Button>
              {!isMerged && onManualSave ? (
                <Button glow={false} onClick={() => onManualSave(result, selection)} disabled={isApplying}>Open native editor</Button>
              ) : null}
              {selection?.source === 'textarea' && !isMerged ? (
                <Button glow={false} variant="rwa-replace" onClick={handleReplaceAllClick} disabled={isApplying}>Replace All</Button>
              ) : null}
            </div>
            <div className="rwar-actions-tools">
              <Button glow={false} onClick={handleCopy} disabled={isApplying || !result}>Copy</Button>
              <Button glow={false} onClick={handleSaveFile} disabled={isApplying || !result}>Save .txt</Button>
              <Button glow={false} onClick={onRetry} disabled={isApplying}>Retry</Button>
              <Button glow={false} onClick={onClose} disabled={isApplying}>Close</Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

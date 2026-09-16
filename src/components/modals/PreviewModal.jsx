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

  const handleGlowMouseMove = (event) => {
    const target = event.target.closest('.rwa-glow-button');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--x', `${event.clientX - rect.left}px`);
    target.style.setProperty('--y', `${event.clientY - rect.top}px`);
  };

  return (
    <div onMouseMove={handleGlowMouseMove}>
      <Modal
        title={isLoading ? `${profile?.name} — Processing…` : (isApplying ? `${profile?.name || 'Result'} — Applying…` : `${profile?.name || 'Result'} — Result`)}
        onClose={isApplying ? () => {} : onClose}
        width="620px"
      >
        {isLoading ? (
          <>
            {progress ? <div className="rwa-prev" style={{ fontSize: '11px', marginBottom: '10px' }}>{progress}</div> : null}
            <div className="rwa-plbl">Selected Passage</div>
            <div className="rwa-prev rwa-shimmer" style={{ marginBottom: '14px', maxHeight: '250px' }}>{selection?.text}</div>
            <div style={{ padding: '8px 0 12px' }}>
              <div className="rwa-pulse" />
              <div style={{ fontSize: '10.5px', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '10px', textAlign: 'center' }}>Writing with Intelligence...</div>
            </div>
            <div className="rwa-foot"><Button className="rwa-glow-button" onClick={onClose} style={{ flex: 1 }}>Cancel</Button></div>
          </>
        ) : (
          <>
            {progress ? <div className="rwa-prev" style={{ fontSize: '11px', marginBottom: '10px', color: 'var(--rwa-primary)' }}>{progress}</div> : null}
            {applyReport ? <div role="status" className="rwa-prev" style={{ fontSize: '11px', marginBottom: '10px', borderColor: 'rgba(255,190,80,.4)' }}>{applyReport}</div> : null}
            <div className="rwa-plbl">Original Text</div>
            <div className="rwa-prev" style={{ maxHeight: '140px', opacity: '.65', marginBottom: '12px', resize: 'vertical' }}>{selection?.text || ''}</div>

            {isMerged ? (
              <>
                <div className="rwa-plbl">Validated merged result — split by message</div>
                <div className="rwa-prev" style={{ maxHeight: '300px', marginBottom: '8px', resize: 'vertical' }}>
                  {pieces.map((piece, index) => (
                    <div key={index} style={{ marginTop: index ? '12px' : 0 }}>
                      <div className="rwa-plbl">Message {index + 1}</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: 1.55 }}>{piece}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="rwa-plbl">{config.showDiff ? 'Diff Breakdown (green: added / red: removed)' : 'Result Preview'}</div>
                <div className="rwa-prev" style={{ maxHeight: '250px', marginBottom: '4px', resize: 'vertical' }}>
                  {config.showDiff ? (
                    diffOps ? diffOps.map((op, idx) => {
                      if (op.t === 'eq') return <Fragment key={idx}>{op.v}</Fragment>;
                      return <span key={idx} style={{ color: op.t === 'ins' ? 'var(--rwa-accent)' : 'var(--rwa-coral)', fontWeight: op.t === 'ins' ? 700 : 'normal', textDecoration: op.t === 'ins' ? 'none' : 'line-through', opacity: op.t === 'ins' ? 1 : .65 }}>{op.v}</span>;
                    }) : <><div className="rwa-pulse" /><div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--rwa-primary)', textAlign: 'center', marginTop: '10px' }}>Computing diff…</div></>
                  ) : (config.typewriter ? typewriterText : result)}
                </div>
                <div className="rwa-wc">{getWcDiff()}</div>
              </>
            )}

            <div className="rwa-plbl" style={{ marginTop: '10px' }}>Raw result — always selectable for manual recovery</div>
            <textarea
              className="rwa-inp"
              readOnly
              value={result || ''}
              aria-label="Raw rewrite result"
              onFocus={(event) => event.currentTarget.select()}
              style={{ minHeight: result?.length > 12000 ? '220px' : '120px', maxHeight: '320px', resize: 'vertical', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12px' }}
            />

            <div className="rwa-foot" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Button className="rwa-glow-button" variant="rwa-accept" onClick={() => onAccept?.(result, selection)} disabled={isApplying} style={{ flex: 1.4, minWidth: '110px' }}>
                {isApplying ? 'Applying…' : (isMerged ? '✓ Accept All' : '✓ Accept')}
              </Button>
              {!isMerged && onManualSave ? (
                <Button className="rwa-glow-button" onClick={() => onManualSave(result, selection)} disabled={isApplying} style={{ flex: 1.2, minWidth: '120px' }}>Open native editor</Button>
              ) : null}
              {selection?.source === 'textarea' && !isMerged ? (
                <Button className="rwa-glow-button" variant="rwa-replace" onClick={handleReplaceAllClick} disabled={isApplying} style={{ flex: 1, minWidth: '100px' }}>Replace All</Button>
              ) : null}
              <Button className="rwa-glow-button" onClick={handleCopy} disabled={isApplying || !result} style={{ flex: 0.8, minWidth: '70px' }}>Copy</Button>
              <Button className="rwa-glow-button" onClick={handleSaveFile} disabled={isApplying || !result} style={{ flex: 0.9, minWidth: '80px' }}>Save .txt</Button>
              <Button className="rwa-glow-button" onClick={onRetry} disabled={isApplying} style={{ flex: 0.8, minWidth: '70px' }}>Retry</Button>
              <Button className="rwa-glow-button" onClick={onClose} disabled={isApplying} style={{ flex: 0.8, minWidth: '70px' }}>Close</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

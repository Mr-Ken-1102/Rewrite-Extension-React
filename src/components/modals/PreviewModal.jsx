import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useRuntimeStore } from '../../store/useRuntimeStore';
import { useToastStore } from '../../store/useToastStore';
import { diffWorkerInstance } from '../../services/diffWorkerService';
import { DOMUtils } from '../../utils/domUtils';

export const PreviewModal = ({ status, result, profile, selection, onAccept, onReplaceAll, onRetry, onClose }) => {
  const { config } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [diffOps, setDiffOps] = useState(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typeIndexRef = useRef(0);
  const timerRef = useRef(null);

  const isLoading = status === 'loading';

  useEffect(() => {
    let isMounted = true;
    if (!isLoading && config.showDiff && result) {
      const safeOldString = selection?.text || '';
      diffWorkerInstance.computeDiff(safeOldString, result).then((operations) => {
        if (isMounted) setDiffOps(operations);
      });
    }
    return () => { isMounted = false; };
  }, [isLoading, config.showDiff, result, selection]);

  useEffect(() => {
    let isMounted = true;
    const marinara = useRuntimeStore.getState().marinara;
    const setTimer = marinara && typeof marinara.setTimeout === 'function'
      ? marinara.setTimeout.bind(marinara)
      : window.setTimeout.bind(window);
    const clearTimer = marinara && typeof marinara.clearTimeout === 'function'
      ? marinara.clearTimeout.bind(marinara)
      : window.clearTimeout.bind(window);

    if (!isLoading && !config.showDiff && config.typewriter && result) {
      const words = result.split(/(\s+)/);
      typeIndexRef.current = 0;

      const next = () => {
        if (!isMounted || typeIndexRef.current >= words.length) return;
        const index = typeIndexRef.current;
        setTypewriterText((previous) => index === 0 ? words[index] : previous + words[index]);
        typeIndexRef.current += 1;
        if (typeIndexRef.current < words.length) timerRef.current = setTimer(next, 5);
      };
      timerRef.current = setTimer(next, 0);
    }

    return () => {
      isMounted = false;
      if (timerRef.current != null) clearTimer(timerRef.current);
      timerRef.current = null;
    };
  }, [isLoading, config.showDiff, config.typewriter, result]);

  const getWcDiff = () => {
    const wordCount = (value) => (value || '').trim().split(/\s+/).filter(Boolean).length;
    const originalCount = wordCount(selection?.text);
    const resultCount = wordCount(result);
    const delta = resultCount - originalCount;
    const percent = originalCount ? Math.round((delta / originalCount) * 100) : 0;
    return `${delta >= 0 ? '+' : ''}${delta} words (${percent >= 0 ? '+' : ''}${percent}%)`;
  };

  const handleReplaceAllClick = () => {
    const resolvedMid = selection?.mid;
    if (!resolvedMid) return;

    const textarea = Array.from(document.querySelectorAll('textarea'))
      .find((candidate) => DOMUtils.isEditTextarea(candidate) && DOMUtils.getMessageId(candidate) === resolvedMid);
    if (!textarea) {
      showToast('⚠️ Could not locate the active text editor.', 'warn');
      return;
    }

    const fullText = textarea.value;
    onReplaceAll(result, {
      ...selection,
      start: 0,
      end: fullText.length,
      text: fullText,
      rawText: fullText,
      el: textarea,
    });
  };

  const handleGlowMouseMove = (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('.rwa-glow-button');
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--y', `${event.clientY - rect.top}px`);
    }
  };

  return (
    <div onMouseMove={handleGlowMouseMove}>
      <Modal
        title={isLoading ? `${profile?.name} — Processing…` : `${profile?.name || 'Result'} — Result`}
        onClose={onClose}
        width="560px"
      >
        {isLoading ? (
          <>
            <div className="rwa-plbl">Selected Passage</div>
            <div className="rwa-prev rwa-shimmer" style={{ marginBottom: '14px', maxHeight: '250px' }}>
              {selection?.text}
            </div>

            <div style={{ padding: '8px 0 12px' }}>
              <div className="rwa-pulse" />
              <div style={{ fontSize: '10.5px', fontWeight: '900', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '10px', textAlign: 'center' }}>
                Writing with Intelligence...
              </div>
            </div>

            <div className="rwa-foot">
              <Button className="rwa-glow-button" onClick={onClose} style={{ flex: '1' }}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rwa-plbl">Original Text</div>
            <div className="rwa-prev" style={{ maxHeight: '180px', opacity: '.65', marginBottom: '12px', resize: 'vertical' }}>
              {selection?.text || ''}
            </div>

            <div className="rwa-plbl">
              {config.showDiff ? 'Diff Breakdown (green: added / red: removed)' : 'Result Preview'}
            </div>

            <div className="rwa-prev" style={{ maxHeight: '250px', marginBottom: '4px', resize: 'vertical' }}>
              {config.showDiff ? (
                diffOps ? (
                  diffOps.map((operation, index) => {
                    if (operation.t === 'eq') return <React.Fragment key={index}>{operation.v}</React.Fragment>;
                    return (
                      <span
                        key={index}
                        style={{
                          color: operation.t === 'ins' ? 'var(--rwa-accent)' : 'var(--rwa-coral)',
                          fontWeight: operation.t === 'ins' ? '700' : 'normal',
                          textShadow: operation.t === 'ins' ? '0 0 8px var(--rwa-accent-glow)' : '0 0 8px rgba(255,107,107,0.3)',
                          textDecoration: operation.t === 'ins' ? 'none' : 'line-through',
                          opacity: operation.t === 'ins' ? '1' : '.65',
                        }}
                      >
                        {operation.v}
                      </span>
                    );
                  })
                ) : (
                  <>
                    <div className="rwa-pulse" />
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--rwa-primary)', textAlign: 'center', marginTop: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Computing Matrix...
                    </div>
                  </>
                )
              ) : (
                config.typewriter ? typewriterText : result
              )}
            </div>

            <div className="rwa-wc">{getWcDiff()}</div>

            <div className="rwa-foot" style={{ alignItems: 'center' }}>
              <Button
                className="rwa-glow-button"
                variant="rwa-accept"
                onClick={() => onAccept(result, selection)}
                style={{ flex: 1.2, height: '38px', padding: '0', whiteSpace: 'nowrap', fontSize: '12px' }}
              >
                ✓ Accept
              </Button>

              <Button
                className="rwa-glow-button"
                variant="rwa-replace"
                onClick={handleReplaceAllClick}
                style={{ flex: 1.2, height: '38px', padding: '0', whiteSpace: 'nowrap', fontSize: '12px', background: 'rgba(5, 196, 107, 0.1)', border: '1px solid rgba(5, 196, 107, 0.4)', color: 'var(--rwa-accent)', boxShadow: 'none' }}
              >
                🔄 Replace All
              </Button>

              <Button className="rwa-glow-button" onClick={onRetry} style={{ flex: 1, height: '38px', padding: '0', whiteSpace: 'nowrap', fontSize: '12px' }}>
                Retry
              </Button>

              <Button className="rwa-glow-button" onClick={onClose} style={{ flex: 1, height: '38px', padding: '0', whiteSpace: 'nowrap', fontSize: '12px' }}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

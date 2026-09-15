import React, { useRef, useState, useMemo, useCallback } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { Button } from './ui/Button';
import { ToggleSwitch } from './ui/ToggleSwitch';

export const PopupMain = ({ onRewrite, onOpenSettings, onOpenCustom }) => {
  const { profiles, config, updateConfig, history } = usePersistentStore();
  const { selection, popupPosition, setDragging } = useRuntimeStore();
  const popupRef = useRef(null);
  const isDraggedRef = useRef(false);
  const [tip, setTip] = useState({ show: false, text: '', x: 0, y: 0 });

  const resolvedMid = selection?.mid;

  const activeRole = useMemo(() => {
    if (selection?.detectedRole === 'user' || selection?.detectedRole === 'assistant') {
      return selection.detectedRole;
    }
    if (!resolvedMid) return 'assistant';
    const message = Array.from(document.querySelectorAll('[data-message-id]'))
      .find((element) => element.getAttribute('data-message-id') === resolvedMid);
    const role = message?.getAttribute('data-message-role');
    return role === 'user' || role === 'assistant' ? role : 'assistant';
  }, [resolvedMid, selection?.detectedRole]);

  const keepFocus = useCallback(() => {
    if (!selection) return;
    requestAnimationFrame(() => {
      const marinara = useRuntimeStore.getState().marinara;
      const schedule = marinara && typeof marinara.setTimeout === 'function'
        ? marinara.setTimeout.bind(marinara)
        : window.setTimeout.bind(window);
      schedule(() => {
        const textarea = selection.el || Array.from(document.querySelectorAll('textarea[data-rwa-mid]'))
          .find((candidate) => candidate.dataset.rwaMid === selection.mid);
        if (textarea && selection.start > -1 && selection.end > -1) {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(selection.start, selection.end);
        }
      }, 15);
    });
  }, [selection]);

  const handleDragStart = useCallback((event) => {
    setDragging(true);
    const element = popupRef.current;
    if (!element) return;

    element.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';
    const shiftX = event.clientX - element.getBoundingClientRect().left;
    const shiftY = event.clientY - element.getBoundingClientRect().top;

    const onMouseMove = (moveEvent) => {
      let newLeft = moveEvent.clientX - shiftX;
      let newTop = moveEvent.clientY - shiftY;
      newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - element.offsetWidth - 10));
      newTop = Math.max(10, Math.min(newTop, window.innerHeight - element.offsetHeight - 10));
      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      element.style.cursor = '';
      document.body.style.cursor = '';

      useRuntimeStore.getState().setPopupPosition({
        ...useRuntimeStore.getState().popupPosition,
        left: Number.parseInt(element.style.left, 10),
        top: Number.parseInt(element.style.top, 10),
        isDragged: true,
      });

      isDraggedRef.current = true;
      const marinara = useRuntimeStore.getState().marinara;
      const schedule = marinara && typeof marinara.setTimeout === 'function'
        ? marinara.setTimeout.bind(marinara)
        : window.setTimeout.bind(window);
      schedule(() => setDragging(false), 80);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  }, [setDragging]);

  const handleGlowMouseMove = useCallback((event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('.rwa-glow-button');
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--y', `${event.clientY - rect.top}px`);
    }
  }, []);

  const handleMouseEnterBtn = useCallback((event, text) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = rect.right + 10;
    const y = rect.top;
    if (x + 200 > window.innerWidth) x = rect.left - 210;
    setTip({ show: true, text, x, y });
  }, []);

  const handleMouseLeaveBtn = useCallback(() => {
    setTip((previous) => ({ ...previous, show: false }));
  }, []);

  const colCount = useMemo(() => Math.max(1, config.cols || 3), [config.cols]);
  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profiles],
  );

  const { radarText, radarColor } = useMemo(() => {
    if (config.freeMode) return { radarText: '✨ Free Mode', radarColor: 'var(--rwa-primary)' };
    if (activeRole === 'user') return { radarText: '✍️ User Persona', radarColor: 'var(--rwa-accent)' };
    if (activeRole === 'assistant') return { radarText: '🤖 Character Card', radarColor: 'var(--rwa-primary)' };
    return { radarText: '❓ System Context', radarColor: 'var(--rwa-primary)' };
  }, [config.freeMode, activeRole]);

  const msgHistory = history[resolvedMid] || { undo: [], redo: [] };

  const { finalLeft, finalTop, finalVisibility } = useMemo(() => {
    let left = '0px';
    let top = '0px';
    let visibility = 'hidden';

    if (popupPosition && selection) {
      if (popupPosition.isDragged) {
        left = `${popupPosition.left}px`;
        top = `${popupPosition.top}px`;
        visibility = 'visible';
      } else {
        const actualRows = Math.ceil(profiles.length / colCount);
        const rowCountSetting = Math.max(1, config.rows || 3);
        const visibleRows = Math.min(actualRows, rowCountSetting);
        const estimatedWidth = Math.max(200, colCount * 95) + 24;
        const estimatedHeight = (visibleRows * 42) + 105;
        const leftNumber = popupPosition.left;
        let topNumber;
        const positionSetting = config.popupPos || 'auto';

        if (positionSetting === 'above') {
          topNumber = popupPosition.top - estimatedHeight - 12;
        } else if (positionSetting === 'below') {
          topNumber = popupPosition.bottom + 12;
        } else {
          topNumber = popupPosition.bottom + 12;
          if (topNumber + estimatedHeight > window.innerHeight) {
            topNumber = popupPosition.top - estimatedHeight - 12;
          }
        }

        left = `${Math.max(12, Math.min(leftNumber, window.innerWidth - estimatedWidth - 12))}px`;
        top = `${Math.max(12, Math.min(topNumber, window.innerHeight - estimatedHeight - 12))}px`;
        visibility = 'visible';
      }
    }
    return { finalLeft: left, finalTop: top, finalVisibility: visibility };
  }, [popupPosition, selection, profiles.length, colCount, config.rows, config.popupPos]);

  if (config.onlyAltR && !selection?.forced) return null;

  return (
    <>
      <div
        ref={popupRef}
        className="rwa rwa-popup-main"
        style={{
          minWidth: `${Math.max(200, colCount * 95)}px`,
          left: finalLeft,
          top: finalTop,
          visibility: finalVisibility,
        }}
        onMouseMove={handleGlowMouseMove}
      >
        <div className="rwa-header-drag-zone" onMouseDown={handleDragStart}>
          <div className="rwa-topbar" />
          <div className="rwa-mini-hdr rwa-drag-handle">
            <span className="rwa-mini-title">REWRITE ASSISTANT v2</span>
          </div>
        </div>

        <div
          className="rwa-grid rwa-profile-grid"
          style={{
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            maxHeight: `${Math.max(1, config.rows || 3) * 42}px`,
          }}
        >
          {sortedProfiles.map((profile) => (
            <Button
              key={profile.id}
              className="rwa-pb rwa-glow-button rwa-profile-btn"
              style={profile.color ? { color: profile.color } : {}}
              onMouseEnter={(event) => handleMouseEnterBtn(event, `${profile.name}: ${profile.prompt}`)}
              onMouseLeave={handleMouseLeaveBtn}
              onClick={(event) => {
                event.stopPropagation();
                setTip((previous) => ({ ...previous, show: false }));
                onRewrite(profile);
              }}
            >
              <span className="rwa-profile-name">
                {config.compact ? profile.name.slice(0, 2).toUpperCase() : profile.name}
              </span>
            </Button>
          ))}
        </div>

        <div className="rwa-bottom-controls">
          <div className="rwa-radar-container rwa-radar-compact">
            <div className="rwa-radar-header">
              <div className="rwa-radar-title">
                🧠 CONTEXT ENGINE
                <span
                  className="rwa-info-icon"
                  onMouseEnter={(event) => handleMouseEnterBtn(event, 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.')}
                  onMouseLeave={handleMouseLeaveBtn}
                >
                  ℹ️
                </span>
              </div>
              <div className="rwa-radar-target">
                Target: <span style={{ color: radarColor }}>{radarText}</span>
              </div>
            </div>

            <div className="rwa-panel-box rwa-panel-compact">
              <div className="rwa-toggle-row">
                <ToggleSwitch
                  label="Free Mode"
                  labelStyle={{ fontSize: '11px', fontWeight: '800', color: 'var(--rwa-primary)' }}
                  checked={config.freeMode}
                  onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
                />
                <ToggleSwitch
                  label="Character"
                  checked={config.injectChar}
                  disabled={config.freeMode}
                  onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }}
                />
                <ToggleSwitch
                  label="Persona"
                  checked={config.injectUser}
                  disabled={config.freeMode}
                  onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }}
                />
              </div>

              <div className="rwa-merged-row">
                <div className="rwa-length-side" style={{ opacity: config.lengthEnabled ? '1' : '0.45' }}>
                  <ToggleSwitch
                    checked={config.lengthEnabled}
                    onChange={(value) => {
                      updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
                      keepFocus();
                    }}
                  />
                  <span className="rwa-len-lbl">LEN</span>
                  <input
                    className="rwa-range rwa-len-range"
                    type="range"
                    min="-99"
                    max="200"
                    value={config.lengthPct || 0}
                    disabled={!config.lengthEnabled}
                    onChange={(event) => updateConfig({ lengthPct: Number.parseInt(event.target.value, 10) })}
                    onMouseUp={keepFocus}
                    onTouchEnd={keepFocus}
                  />
                  <span className="rwa-len-val">
                    {`${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%`}
                  </span>
                </div>

                <div className="rwa-depth-side">
                  <span className="rwa-depth-lbl">Depth:</span>
                  <input
                    type="number"
                    className="rwa-inp rwa-depth-inp-mini"
                    min="0"
                    max="20"
                    value={config.contextDepth !== undefined ? config.contextDepth : 4}
                    onChange={(event) => updateConfig({ contextDepth: Math.max(0, Number.parseInt(event.target.value, 10) || 0) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rwa-foot rwa-popup-foot">
          <Button
            className="rwa-glow-button rwa-btn-icon-square"
            title="Undo"
            variant="rwa-btn-undo"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRewrite({ type: 'undo' }); }}
            disabled={!msgHistory.undo || msgHistory.undo.length === 0}
          >
            <span className="rwa-icon-txt">↺</span>
          </Button>

          <Button
            className="rwa-glow-button rwa-btn-icon-square"
            title="Redo"
            variant="rwa-btn-redo"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRewrite({ type: 'redo' }); }}
            disabled={!msgHistory.redo || msgHistory.redo.length === 0}
          >
            <span className="rwa-icon-txt">↻</span>
          </Button>

          <Button className="rwa-glow-button rwa-btn-custom" onClick={onOpenCustom}>
            ✨ Custom Prompt
          </Button>

          <Button className="rwa-glow-button rwa-btn-settings" onClick={onOpenSettings}>
            ⚙️ Settings
          </Button>
        </div>
      </div>

      <div
        className={`rwa-tip rwa-popup-tip ${tip.show ? 'rwa-tip-show' : ''}`}
        style={{ left: tip.x, top: tip.y }}
      >
        {tip.text}
      </div>
    </>
  );
};

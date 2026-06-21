import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { Button } from './ui/Button';
import { ToggleSwitch } from './ui/ToggleSwitch';

export const PopupMain = ({ onRewrite, onOpenSettings, onOpenCustom }) => {
  const { profiles, config, updateConfig, history } = usePersistentStore();
  const { selection, popupPosition, setDragging, marinara } = useRuntimeStore();
  const popupRef = useRef(null);
  const isDraggedRef = useRef(false);

  const [tip, setTip] = useState({ show: false, text: "", x: 0, y: 0 });
  const [radarRole, setRadarRole] = useState(selection?.detectedRole || null);
  const [isUserDOM, setIsUserDOM] = useState(false);

  const resolvedMid = selection?.mid;

  // =========================================================================
  // 1. API RADAR EFFECT
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    
    if (selection?.cid && selection?.mid && !selection.mid.startsWith("temp-mid") && marinara) {
      marinara.apiFetch(`/chats/${selection.cid}/messages`)
        .then((msgs) => {
          if (!isMounted || !Array.isArray(msgs)) return;
          const msg = msgs.find((m) => m.id === selection.mid);
          
          if (msg && msg.role) {
            if (radarRole !== msg.role) {
              setRadarRole(msg.role);
            }
            const currentSel = useRuntimeStore.getState().selection;
            if (currentSel.detectedRole !== msg.role) {
              useRuntimeStore.getState().setSelection({ 
                ...currentSel, 
                detectedRole: msg.role 
              });
            }
          }
        }).catch(() => {});
    }
    
    return () => { isMounted = false; };
  }, [selection?.cid, selection?.mid, marinara, radarRole]);

  // =========================================================================
  // LOGIC QUERY DOM NẰM TRONG USE-EFFECT (Tránh Re-render Memory Leak)
  // =========================================================================
  useEffect(() => {
    if (!resolvedMid) {
      setIsUserDOM(false);
      return;
    }
    const msgDOMEl = document.querySelector(`[data-message-id="${resolvedMid}"]`) || document.getElementById(resolvedMid);
    if (msgDOMEl) {
      const isUser = msgDOMEl.classList.contains('message-user') || 
                     msgDOMEl.closest('.message-user') !== null || 
                     msgDOMEl.querySelector('.user-avatar') !== null;
      setIsUserDOM(isUser);
    } else {
      setIsUserDOM(false);
    }
  }, [resolvedMid]);

  // =========================================================================
  // CÁC HÀM XỬ LÝ SỰ KIỆN TƯƠNG TÁC
  // =========================================================================
  const keepFocus = useCallback(() => {
    if (!selection) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const ta = selection.el || document.querySelector(`textarea[data-rwa-mid="${selection.mid}"]`);
        if (ta && selection.start > -1 && selection.end > -1) {
          ta.focus({ preventScroll: true });
          ta.setSelectionRange(selection.start, selection.end);
        }
      }, 15);
    });
  }, [selection]);

  const handleDragStart = useCallback((e) => {
    setDragging(true);
    const el = popupRef.current;
    if (!el) return;
    
    el.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
    
    let shiftX = e.clientX - el.getBoundingClientRect().left;
    let shiftY = e.clientY - el.getBoundingClientRect().top;
    
    const onMouseMove = (moveEvent) => {
      let newLeft = moveEvent.clientX - shiftX;
      let newTop = moveEvent.clientY - shiftY;
      newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - el.offsetWidth - 10));
      newTop = Math.max(10, Math.min(newTop, window.innerHeight - el.offsetHeight - 10));
      
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    };
    
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      el.style.cursor = ""; 
      document.body.style.cursor = "";
      
      useRuntimeStore.getState().setPopupPosition({
        ...useRuntimeStore.getState().popupPosition,
        left: parseInt(el.style.left, 10),
        top: parseInt(el.style.top, 10),
        isDragged: true 
      });

      isDraggedRef.current = true;
      setTimeout(() => setDragging(false), 80);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp, { once: true });
  }, [setDragging]);

  const handleGlowMouseMove = useCallback((e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty("--x", `${x}px`);
      target.style.setProperty("--y", `${y}px`);
    }
  }, []);

  const handleMouseEnterBtn = useCallback((e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right + 10;
    let y = rect.top;
    if (x + 200 > window.innerWidth) x = rect.left - 200 - 10;
    setTip({ show: true, text, x, y });
  }, []);

  const handleMouseLeaveBtn = useCallback(() => {
    setTip(prev => ({ ...prev, show: false }));
  }, []);

  // =========================================================================
  // MEMOIZE CÁC GIÁ TRỊ TÍNH TOÁN NẶNG
  // =========================================================================
  const colCount = useMemo(() => Math.max(1, config.cols || 3), [config.cols]);
  
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [profiles]);

  const activeRole = radarRole || (isUserDOM ? 'user' : 'assistant');
  const { radarText, radarColor } = useMemo(() => {
    if (config.freeMode) return { radarText: "✨ Free Mode", radarColor: "var(--rwa-primary)" };
    if (activeRole === 'user') return { radarText: "✍️ User Persona", radarColor: "var(--rwa-accent)" };
    if (activeRole === 'assistant') return { radarText: "🤖 Character Card", radarColor: "var(--rwa-primary)" };
    return { radarText: "❓ System Context", radarColor: "var(--rwa-primary)" };
  }, [config.freeMode, activeRole]);

  const msgHistory = history[resolvedMid] || { undo: [], redo: [] };

  // =========================================================================
  // 2. THUẬT TOÁN ĐỊNH VỊ ANTI-FLICKER (Tính toán CSS động)
  // =========================================================================
  const { finalLeft, finalTop, finalVisibility } = useMemo(() => {
    let fLeft = "0px";
    let fTop = "0px";
    let fVis = "hidden";

    if (popupPosition && selection) {
      if (popupPosition.isDragged) {
        fLeft = `${popupPosition.left}px`;
        fTop = `${popupPosition.top}px`;
        fVis = "visible";
      } else {
        const actualRows = Math.ceil(profiles.length / colCount);
        const rowCountSetting = Math.max(1, config.rows || 3);
        const visibleRows = Math.min(actualRows, rowCountSetting);
        
        const estWidth = Math.max(200, colCount * 95) + 24;
        
        const estHeight = (visibleRows * 42) + 105;

        let lft = popupPosition.left;
        let top;
        const posSetting = config.popupPos || "auto";
        
        if (posSetting === "above") {
          top = popupPosition.top - estHeight - 12;
        } else if (posSetting === "below") {
          top = popupPosition.bottom + 12;
        } else {
          top = popupPosition.bottom + 12;
          if (top + estHeight > window.innerHeight) top = popupPosition.top - estHeight - 12;
        }
        
        fLeft = `${Math.max(12, Math.min(lft, window.innerWidth - estWidth - 12))}px`;
        fTop = `${Math.max(12, Math.min(top, window.innerHeight - estHeight - 12))}px`;
        fVis = "visible";
      }
    }
    return { finalLeft: fLeft, finalTop: fTop, finalVisibility: fVis };
  }, [popupPosition, selection, profiles.length, colCount, config.rows, config.popupPos]);

  if (config.onlyAltR && !selection?.forced) {
    return null;
  }

  return (
    <>
      <div 
        ref={popupRef}
        className="rwa rwa-popup-main"
        style={{ 
          minWidth: `${Math.max(200, colCount * 95)}px`, /* Động: Giữ lại */
          left: finalLeft, /* Động: Giữ lại */
          top: finalTop, /* Động: Giữ lại */
          visibility: finalVisibility /* Động: Giữ lại */
        }}
        onMouseMove={handleGlowMouseMove}
      >
        {/* Đã đưa cursor: grab và userSelect: none ra CSS */}
        <div 
          className="rwa-header-drag-zone" 
          onMouseDown={handleDragStart}
        >
          <div className="rwa-topbar"></div>
          <div className="rwa-mini-hdr rwa-drag-handle">
            <span className="rwa-mini-title">REWRITE ASSISTANT v2</span>
          </div>
        </div>

        {/* Lưới Profiles Preset - Đã đưa marginTop: 0.8px ra CSS */}
        <div 
          className="rwa-grid rwa-profile-grid" 
          style={{ 
            gridTemplateColumns: `repeat(${colCount}, 1fr)`, /* Động: Giữ lại */
            maxHeight: `${Math.max(1, config.rows || 3) * 42}px` /* Động: Giữ lại */
          }}
        >
          {sortedProfiles.map(pr => (
            <Button 
              key={pr.id}
              className="rwa-pb rwa-glow-button rwa-profile-btn"
              style={pr.color ? { color: pr.color } : {}} /* Động: Giữ lại */
              onMouseEnter={(e) => handleMouseEnterBtn(e, `${pr.name}: ${pr.prompt}`)}
              onMouseLeave={handleMouseLeaveBtn}
              onClick={(e) => { 
                e.stopPropagation(); 
                setTip(prev => ({ ...prev, show: false }));
                onRewrite(pr); 
              }}
            >
              <span className="rwa-profile-name">
                {config.compact ? pr.name.slice(0, 2).toUpperCase() : pr.name}
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
                  onMouseEnter={(e) => handleMouseEnterBtn(e, "Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.")}
                  onMouseLeave={handleMouseLeaveBtn}
                >
                  ℹ️
                </span>
              </div>
              
              {/* Đã đưa fontWeight: bold ra CSS */}
              <div className="rwa-radar-target">
                Target: <span style={{ color: radarColor }}>{radarText}</span>
              </div>
            </div>

            <div className="rwa-panel-box rwa-panel-compact">
              <div className="rwa-toggle-row">
                <ToggleSwitch 
                  label="Free Mode"
                  labelStyle={{ fontSize: "11px", fontWeight: "800", color: "var(--rwa-primary)" }}
                  checked={config.freeMode} 
                  onChange={(v) => { updateConfig({ freeMode: v }); keepFocus(); }} 
                />
                <ToggleSwitch 
                  label="Character"
                  checked={config.injectChar} 
                  disabled={config.freeMode}
                  onChange={(v) => { updateConfig({ injectChar: v }); keepFocus(); }} 
                />
                <ToggleSwitch 
                  label="Persona"
                  checked={config.injectUser} 
                  disabled={config.freeMode}
                  onChange={(v) => { updateConfig({ injectUser: v }); keepFocus(); }} 
                />
              </div>

              <div className="rwa-merged-row">
                {/* Nửa Trái: Đã đưa display: flex và alignItems: center ra CSS, chỉ giữ opacity động */}
                <div className="rwa-length-side" style={{ opacity: config.lengthEnabled ? "1" : "0.45" }}>
                  <ToggleSwitch 
                    checked={config.lengthEnabled} 
                    onChange={(val) => {
                      updateConfig({ lengthEnabled: val, lengthPct: val ? config.lengthPct : 0 });
                      keepFocus();
                    }} 
                  />
                  <span className="rwa-len-lbl">LEN</span>
                  
                  {/* Đã đưa flex: 1 ra CSS */}
                  <input
                    className="rwa-range rwa-len-range"
                    type="range"
                    min="-99"
                    max="200"
                    value={config.lengthPct || 0}
                    disabled={!config.lengthEnabled}
                    onChange={(e) => updateConfig({ lengthPct: parseInt(e.target.value, 10) })}
                    onMouseUp={keepFocus}
                    onTouchEnd={keepFocus}
                  />
                  
                  {/* Đã dọn sạch bong inline CSS tĩnh tại đây */}
                  <span className="rwa-len-val">
                    {`${config.lengthPct >= 0 ? "+" : ""}${config.lengthPct}%`}
                  </span>
                </div>

                <div className="rwa-depth-side">
                  <span className="rwa-depth-lbl">Depth:</span>
                  <input 
                    type="number" 
                    className="rwa-inp rwa-depth-inp-mini" 
                    min="0" max="20"
                    value={config.contextDepth !== undefined ? config.contextDepth : 4}
                    onChange={(e) => updateConfig({ contextDepth: Math.max(0, parseInt(e.target.value, 10) || 0) })}
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRewrite({ type: 'undo' }); }}
            disabled={!msgHistory.undo || msgHistory.undo.length === 0}
          >
            <span className="rwa-icon-txt">↺</span>
          </Button>

          <Button 
            className="rwa-glow-button rwa-btn-icon-square"
            title="Redo"
            variant="rwa-btn-redo"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRewrite({ type: 'redo' }); }}
            disabled={!msgHistory.redo || msgHistory.redo.length === 0}
          >
            <span className="rwa-icon-txt">↻</span>
          </Button>

          <Button 
            className="rwa-glow-button rwa-btn-custom"
            onClick={onOpenCustom}
          >
            ✨ Custom Prompt
          </Button>

          <Button 
            className="rwa-glow-button rwa-btn-settings"
            onClick={onOpenSettings}
          >
            ⚙️ Settings
          </Button>
        </div>
      </div>

      <div 
        className={`rwa-tip rwa-popup-tip ${tip.show ? 'rwa-tip-show' : ''}`} 
        style={{ left: tip.x, top: tip.y }} /* Động: Giữ lại */
      >
        {tip.text}
      </div>
    </>
  );
};
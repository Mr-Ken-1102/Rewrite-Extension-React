import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { diffWorkerInstance } from '../../services/diffWorkerService'; 

export const PreviewModal = ({ status, result, profile, selection, onAccept, onReplaceAll, onRetry, onClose }) => {
  const { config } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  
  const [diffOps, setDiffOps] = useState(null);
  const [typewriterText, setTypewriterText] = useState("");
  const typeIndexRef = useRef(0);
  const timerRef = useRef(null);

  const isLoading = status === 'loading';

  // 1. TÍNH TOÁN DIFF (Chỉ chạy khi có kết quả)
  useEffect(() => {
    let isMounted = true;
    if (!isLoading && config.showDiff && result) {
      const safeOldStr = selection?.text || "";
      diffWorkerInstance.computeDiff(safeOldStr, result).then(ops => {
        if (isMounted) setDiffOps(ops);
      });
    }
    return () => { isMounted = false; };
  }, [isLoading, config.showDiff, result, selection]); 

  // 2. HIỆU ỨNG TYPEWRITER (Chỉ chạy khi có kết quả)
  useEffect(() => {
    let isMounted = true;
    if (!isLoading && !config.showDiff && config.typewriter && result) {
      const words = result.split(/(\s+)/);
      typeIndexRef.current = 0;
      setTypewriterText("");

      const next = () => {
        if (!isMounted) return;
        if (typeIndexRef.current < words.length) {
          setTypewriterText(prev => prev + words[typeIndexRef.current]);
          typeIndexRef.current++;
          timerRef.current = setTimeout(next, 5);
        }
      };
      next();
    }
    return () => { 
      isMounted = false; 
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, config.showDiff, config.typewriter, result]);

  const getWcDiff = () => {
    const wc = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;
    const a = wc(selection?.text);
    const b = wc(result);
    const d = b - a;
    const p = a ? Math.round((d / a) * 100) : 0;
    return `${d >= 0 ? "+" : ""}${d} words (${p >= 0 ? "+" : ""}${p}%)`;
  };

  const handleReplaceAllClick = () => {
    const resolvedMid = selection?.mid;
    if (!resolvedMid) return;
    
    const ta = document.querySelector(`textarea[data-rwa-mid="${resolvedMid}"]`);
    if (ta) {
      const fullSel = { ...selection, start: 0, end: ta.value.length };
      onReplaceAll(result, fullSel);
    } else {
      showToast("⚠️ Could not locate the active text editor.", "warn");
    }
  };

  const handleGlowMouseMove = (e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--x", `${e.clientX - rect.left}px`);
      target.style.setProperty("--y", `${e.clientY - rect.top}px`);
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
          /* ================= GIAO DIỆN LOADING ================= */
          <>
            <div className="rwa-plbl">Selected Passage</div>
            <div className="rwa-prev rwa-shimmer" style={{ marginBottom: "14px", maxHeight: "250px" }}>
              {selection?.text}
            </div>

            <div style={{ padding: "8px 0 12px" }}>
              <div className="rwa-pulse"></div>
              <div style={{ fontSize: "10.5px", fontWeight: "900", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "10px", textAlign: "center" }}>
                Writing with Intelligence...
              </div>
            </div>

            <div className="rwa-foot">
              <Button className="rwa-glow-button" onClick={onClose} style={{ flex: "1" }}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          /* ================= GIAO DIỆN PREVIEW KẾT QUẢ ================= */
          <>
            <div className="rwa-plbl">Original Text</div>
            <div className="rwa-prev" style={{ maxHeight: "180px", opacity: ".65", marginBottom: "12px", resize: "vertical" }}>
              {selection?.text || ""}
            </div>

            <div className="rwa-plbl">
              {config.showDiff ? "Diff Breakdown (green: added / red: removed)" : "Result Preview"}
            </div>
            
            <div className="rwa-prev" style={{ maxHeight: "250px", marginBottom: "4px", resize: "vertical" }}>
              {config.showDiff ? (
                diffOps ? (
                  diffOps.map((op, idx) => {
                    if (op.t === "eq") return <React.Fragment key={idx}>{op.v}</React.Fragment>;
                    return (
                      <span 
                        key={idx} 
                        style={{
                          color: op.t === "ins" ? "var(--rwa-accent)" : "var(--rwa-coral)",
                          fontWeight: op.t === "ins" ? "700" : "normal",
                          textShadow: op.t === "ins" ? "0 0 8px var(--rwa-accent-glow)" : "0 0 8px rgba(255,107,107,0.3)",
                          textDecoration: op.t === "ins" ? "none" : "line-through",
                          opacity: op.t === "ins" ? "1" : ".65"
                        }}
                      >
                        {op.v}
                      </span>
                    );
                  })
                ) : (
                  <>
                    <div className='rwa-pulse'></div>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rwa-primary)", textAlign: "center", marginTop: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Computing Matrix...
                    </div>
                  </>
                )
              ) : (
                config.typewriter ? typewriterText : result
              )}
            </div>

            <div className="rwa-wc">{getWcDiff()}</div>

            <div className="rwa-foot" style={{ alignItems: "center" }}>
              <Button 
                className="rwa-glow-button"
                variant="rwa-accept" 
                onClick={() => onAccept(result, selection)} 
                style={{ flex: 1.2, height: "38px", padding: "0", whiteSpace: "nowrap", fontSize: "12px" }}
              >
                ✓ Accept
              </Button>

              <Button 
                className="rwa-glow-button"
                variant="rwa-replace" 
                onClick={handleReplaceAllClick} 
                style={{ flex: 1.2, height: "38px", padding: "0", whiteSpace: "nowrap", fontSize: "12px", background: "rgba(5, 196, 107, 0.1)", border: "1px solid rgba(5, 196, 107, 0.4)", color: "var(--rwa-accent)", boxShadow: "none" }}
              >
                🔄 Replace All
              </Button>

              <Button 
                className="rwa-glow-button"
                onClick={onRetry} 
                style={{ flex: 1, height: "38px", padding: "0", whiteSpace: "nowrap", fontSize: "12px" }}
              >
                Retry
              </Button>

              <Button 
                className="rwa-glow-button"
                onClick={onClose} 
                style={{ flex: 1, height: "38px", padding: "0", whiteSpace: "nowrap", fontSize: "12px" }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
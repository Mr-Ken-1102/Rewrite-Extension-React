// src/styles.js
export const RWA_PREMIUM_CSS = `
:host {
  --rwa-primary: var(--rwa-custom-primary, #ff8c00);
  --rwa-primary-gradient: linear-gradient(135deg, var(--rwa-primary), #ff4b2b);
  --rwa-primary-glow: rgba(255, 140, 0, 0.3);
  --rwa-accent: var(--rwa-custom-accent, #05c46b); 
  --rwa-accent-glow: rgba(5, 196, 107, 0.3);
  --rwa-coral: var(--rwa-custom-coral, #ff4757);
  --rwa-panel-bg: var(--rwa-custom-panel-bg, rgba(15, 15, 20, 0.45));
  --rwa-input-bg: var(--rwa-custom-input-bg, rgba(0, 0, 0, 0.3));
  --rwa-glass-border: rgba(255, 255, 255, 0.08);
  --rwa-panel-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), inset 1px 1px 1px rgba(255, 255, 255, 0.15);
}

@keyframes rwa-premium-pop { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes rwa-premium-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rwa-premium-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes rwa-pulse-glow { 0%, 100% { opacity: .4; transform: scaleX(.6) } 50% { opacity: 1; transform: scaleX(1) } }

.rwa-prev::-webkit-resizer, .rwa-body::-webkit-resizer, .rwa-grid::-webkit-resizer, .rwa-inp::-webkit-resizer, textarea::-webkit-resizer { 
  background-color: transparent !important; 
  background-image: none !important; 
  border: none !important;
  box-shadow: none !important;
}

/* Base Panels & Layouts */
.rwa { position: fixed; background: var(--rwa-panel-bg); border: 1px solid var(--rwa-glass-border); border-radius: 16px; padding: 20px; box-shadow: var(--rwa-panel-shadow); z-index: 10000; display: flex; flex-direction: column; gap: 12px; min-width: 270px; width: max-content; max-width: min(90vw, 550px); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); font-family: var(--rwa-host-font, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); animation: rwa-premium-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.rwa-topbar { display: none; }
.rwa-body { padding: 24px; overflow-y: auto; flex: 1; height: 40vh; display: block; }

/* Bù trừ khoảng trống bằng padding/margin để viền Glow không bị cắt */
.rwa-grid { display: grid; gap: 8px; overflow-y: auto; padding: 8px; margin: -8px; max-height: 250px; }
.rwa-grid::-webkit-scrollbar { width: 4px; }
.rwa-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

/* Tăng độ sáng và nét của thanh Tabs */
.rwa-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding: 0 24px;
  gap: 8px;
}
.rwa-tab-btn {
  flex: 1;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05); 
  border-bottom: none; 
  color: rgba(255, 255, 255, 0.5); 
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  box-shadow: inset 0 -4px 10px rgba(0,0,0,0.5);
}
.rwa-tab-btn:hover {
  color: #fff;
  background: rgba(255, 140, 0, 0.05);
}
.rwa-tab-btn.rwa-active {
  color: var(--rwa-primary);
  background: rgba(255, 140, 0, 0.15);
  border: 1px solid var(--rwa-primary);
  border-bottom: none;
  box-shadow: inset 0 2px 15px var(--rwa-primary-glow);
  text-shadow: 0 0 10px var(--rwa-primary-glow);
  z-index: 2;
  position: relative;
}

.rwa-mini-hdr { display: flex; align-items: center; justify-content: space-between; padding: 4px; margin-bottom: 8px; }
.rwa-mini-title { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; text-shadow: 0 0 15px var(--rwa-primary-glow); }
.rwa-title, .rwa-mini-title { background: var(--rwa-primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.rwa-title { font-size: 16px; font-weight: 800; }
.rwa-hdr { padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: space-between; }
.rwa-plbl, .rwa-lbl { display: block; font-size: 10px; font-weight: 700; color: var(--rwa-primary); margin-bottom: 8px; }
.rwa-wc { font-size: 11.5px; font-weight: 700; color: var(--rwa-primary); text-align: right; margin-top: 4px; letter-spacing: 0.03em; }
.rwa-sep { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 20px 0; }

/* Buttons & Interactables */
.rwa-pb, .rwa-btn { position: relative; border: 1px solid rgba(255, 255, 255, 0.15); font: 600 12px/1 inherit; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.rwa-pb:active, .rwa-btn:active { transform: scale(0.97); }
.rwa-pb { display: block; width: 100%; height: 38px; padding: 0 14px; background: transparent; border-radius: 8px; color: rgba(255, 255, 255, 0.7); text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rwa-pb:hover { background: rgba(255, 140, 0, 0.08); border-color: var(--rwa-primary); color: #fff; transform: translateY(-1px); }
.rwa-btn { background: rgba(255,255,255,0.03); color: rgba(255, 255, 255, 0.9); padding: 10px 18px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.rwa-btn:hover { background: rgba(255, 255, 255, 0.05); border-color: var(--rwa-primary); color: var(--rwa-primary); }
.rwa-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none !important; pointer-events: none; }

.rwa-btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 36px;
  padding: 0;
  font-size: 14px;
  font-weight: 900;
  border-radius: 8px;
  flex-shrink: 0;
  color: var(--rwa-primary) !important;
  background: rgba(255, 140, 0, 0.08) !important;
  border: 1px solid rgba(255, 140, 0, 0.2) !important;
  box-shadow: 0 0 8px var(--rwa-primary-glow);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer;
}
.rwa-btn-action:hover {
  background: rgba(255, 140, 0, 0.22) !important;
  border-color: var(--rwa-primary) !important;
  color: #fff !important;
  box-shadow: 0 0 15px var(--rwa-primary-glow), inset 0 0 4px rgba(255, 140, 0, 0.2) !important;
  transform: translateY(-1px);
}
.rwa-btn-action:active {
  transform: scale(0.95);
}

.rwa-accept { background: var(--rwa-primary-gradient) !important; color: #fff !important; border-color: transparent !important; font-weight: 700; box-shadow: 0 4px 15px var(--rwa-primary-glow) !important; }
.rwa-replace { background: linear-gradient(135deg, var(--rwa-accent), #2ecc71) !important; color: #fff !important; border-color: transparent !important; font-weight: 700; box-shadow: 0 4px 15px var(--rwa-accent-glow) !important; }
.rwa-accept:hover, .rwa-replace:hover { filter: brightness(1.15); transform: translateY(-1px); }
.rwa-accept:hover { box-shadow: 0 6px 20px var(--rwa-primary-glow) !important; }

.rwa-dng { color: var(--rwa-coral) !important; border-color: rgba(255, 71, 87, 0.3) !important; }
.rwa-dng:hover { background: rgba(255, 71, 87, 0.1) !important; border-color: var(--rwa-coral) !important; }

.rwa-glow-button { position: relative; overflow: hidden; }
.rwa-glow-button::before { content: ''; position: absolute; top: var(--y, 0); left: var(--x, 0); width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 140, 0, 0.25) 0%, transparent 70%); transform: translate(-50%, -50%); pointer-events: none; opacity: 0; transition: opacity 0.3s; }
.rwa-glow-button:hover::before { opacity: 1; }

.rwa-slider-row { display: flex; align-items: center; gap: 10px; padding: 10px 4px; margin-top: 4px; }
.rwa-slider-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5); }
.rwa-slider-val { font-size: 11px; font-weight: 700; color: var(--rwa-primary); min-width: 42px; text-align: right; }
.rwa-range { flex: 1; cursor: pointer; height: 18px; background: transparent; appearance: none; -webkit-appearance: none; outline: none; margin: 0; }
.rwa-range::-webkit-slider-runnable-track { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 99px; }
.rwa-range::-webkit-slider-thumb { height: 14px; width: 14px; border-radius: 50%; background: var(--rwa-primary) !important; border: 2px solid #fff !important; cursor: pointer; margin-top: -5px; appearance: none; -webkit-appearance: none; box-shadow: 0 0 10px var(--rwa-primary-glow); }

.rwa-tog-wrap { position: relative; display: inline-block; width: 32px; height: 18px; flex-shrink: 0; cursor: pointer; }
.rwa-tog-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
.rwa-tog-sl, .rwa-tog-sl:before { position: absolute; border-radius: 20px; transition: all .25s ease; }
.rwa-tog-sl { top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.15); cursor: pointer; }
.rwa-tog-sl:before { content: ''; height: 12px; width: 12px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; }
.rwa-tog-wrap input:checked + .rwa-tog-sl { background: var(--rwa-primary); box-shadow: 0 0 10px var(--rwa-primary-glow); }
.rwa-tog-wrap input:checked + .rwa-tog-sl:before { transform: translateX(14px); }
.rwa-tog-wrap-green input:checked + .rwa-tog-sl { background: var(--rwa-accent) !important; box-shadow: 0 0 10px var(--rwa-accent-glow); }

.rwa-prev, .rwa-inp { background: var(--rwa-input-bg); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; border-radius: 10px; padding: 14px 18px; font: 13px/1.6 inherit; box-sizing: border-box; outline: none; width: 100%; transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease; }
.rwa-prev { overflow-y: auto; white-space: pre-wrap; resize: vertical; color: rgba(255,255,255,0.85); margin-bottom: 12px; }
.rwa-inp { margin-bottom: 16px; }
.rwa-prev:focus, .rwa-inp:focus { border-color: var(--rwa-primary); background: rgba(0,0,0,0.5); box-shadow: inset 0 0 0 1px var(--rwa-primary), 0 0 15px var(--rwa-primary-glow); }

.rwa-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 10px; cursor: grab; transition: all 0.2s ease; }
.rwa-item:hover { border-color: var(--rwa-primary); background: rgba(255, 140, 0, 0.03); }
.rwa-item.rwa-drag { opacity: 0.3; border-style: dashed; background: #000; }
.rwa-item.rwa-over { border-color: var(--rwa-accent) !important; background: rgba(5, 196, 107, 0.05) !important; }
.rwa-hnd { color: rgba(255,255,255,0.2); font-size: 16px; cursor: grab; }

.rwa-tip { position: fixed; background: rgba(15, 18, 25, 0.98); border: 1px solid var(--rwa-primary); border-radius: 8px; padding: 10px 14px; font-size: 11px; line-height: 1.5; color: #fff; max-width: 280px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9), 0 0 20px var(--rwa-primary-glow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); z-index: 10010; pointer-events: none; opacity: 0; transform: scale(0.95); transition: all 0.15s ease; }
.rwa-tip-show { opacity: 1 !important; transform: scale(1) !important; }

.rwa-ov { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(5, 4, 10, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 10001; display: flex; align-items: center; justify-content: center; animation: rwa-premium-fade .2s ease-out; }
.rwa-win { background: var(--rwa-panel-bg); border: 1px solid var(--rwa-glass-border); border-radius: 16px; width: 650px; max-width: 95vw; max-height: 90vh; box-shadow: var(--rwa-panel-shadow); display: flex; flex-direction: column; overflow: hidden; animation: rwa-premium-up .25s cubic-bezier(0.16, 1, 0.3, 1); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }

.rwa-pulse { height: 4px; background: var(--rwa-primary-gradient); border-radius: 99px; animation: rwa-pulse-glow 1.5s ease-in-out infinite; box-shadow: 0 0 10px var(--rwa-primary-glow); }
.rwa-foot, .rwa-err-foot { display: flex; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.rwa-foot { gap: 12px; padding-top: 16px; margin-top: 8px; }
.rwa-err-foot { padding: 16px 24px; justify-content: flex-end; }

.rwa-toast-container { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(21, 19, 34, 0.95); border: 1px solid var(--rwa-glass-border); padding: 12px 24px; border-radius: 99px; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7), 0 0 20px var(--rwa-primary-glow); display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #fff; z-index: 20000; opacity: 0; pointer-events: none; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.rwa-toast-show { transform: translateX(-50%) translateY(0); opacity: 1; }

.rwa-err-window { background: var(--rwa-panel-bg); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 16px; width: 480px; box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255, 71, 87, 0.15); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
.rwa-err-hdr { background: rgba(255, 71, 87, 0.05); padding: 16px 24px; border-bottom: 1px solid rgba(255, 71, 87, 0.1); display: flex; align-items: center; gap: 12px; }
.rwa-err-icon { color: var(--rwa-coral); font-size: 20px; text-shadow: 0 0 10px rgba(255, 71, 87, 0.4); }
.rwa-err-title { color: var(--rwa-coral); font-weight: 700; font-size: 14px; }
.rwa-err-msg { background: var(--rwa-input-bg); padding: 14px; border-radius: 10px; border-left: 3px solid var(--rwa-coral); font-family: inherit; }


/* ========================================================================= */
/* --- REFACTORED CLASSES TỪ PopupMain.jsx (CLEAN CODE & ULTRA COMPACT UI)-  */
/* ========================================================================= */

/* 1. Kích thước Popup & Header */
.rwa-popup-main { z-index: 999999; position: fixed; gap: 6px !important; } 

.rwa-header-drag-zone { 
  cursor: grab; 
  user-select: none; 
  position: relative; 
  
  /* 1. Kéo toàn bộ khối Header lên sát mép trên cùng của Popup */
  margin-top: -6px; 
  
  /* 2. Tạo độ dày cho phía TRÊN của chữ */
  padding-top: 6px; 
  
  /* 3. Tạo độ dày cho phía DƯỚI của chữ (bằng với phía trên để chữ nằm GIỮA) */
  padding-bottom: 6px; 
}

/* Lớp tàng hình hứng chuột kéo thả ở tận mép */
.rwa-header-drag-zone::before {
  content: "";
  position: absolute;
  top: -12px; 
  left: -18px;
  right: -18px;
  bottom: 0;
  z-index: 1;
}

.rwa-drag-handle { 
  margin: 0 !important; 
  padding: 0 !important; 
  position: relative; 
  z-index: 2; /* Giữ cho chữ nổi lên trên */
  top: -5px;
}

.rwa-mini-actions { display: inline-flex; gap: 4px; align-items: center; position: relative; z-index: 4; }
.rwa-mini-action { width: 24px; height: 22px; padding: 0; border-radius: 6px; border: 1px solid rgba(255,140,0,0.25); background: rgba(255,140,0,0.05); color: rgba(255,255,255,0.8); cursor: pointer; font-size: 12px; line-height: 1; }
.rwa-mini-action:hover, .rwa-mini-action-active { color: #fff; background: rgba(255,140,0,0.18); border-color: rgba(255,140,0,0.55); box-shadow: 0 0 8px var(--rwa-primary-glow); }

/* 2. Bóp nhỏ Profile Buttons */
.rwa-profile-grid { margin-bottom: -4px !important; padding-top: 2px !important; }
.rwa-profile-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; font-size: 11.5px; }
.rwa-profile-btn { padding: 4px 8px !important; height: 32px !important; }

/* 3. Wrapper Layout Đẩy khối chức năng xuống Đáy */
.rwa-bottom-controls { display: flex; flex-direction: column; gap: 4px; margin-top: auto; }

/* 4. Khối Radar / Context Engine (Kéo sát, bỏ viền đứt) */
.rwa-radar-compact { padding-top: 4px !important; margin-top: 0 !important; border-top: none !important; }
.rwa-radar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
/* Đã sửa: Ép line-height về 1 để căn ngang tuyệt đối */
.rwa-radar-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.05em; color: var(--rwa-primary); text-shadow: 0 0 8px var(--rwa-primary-glow); line-height: 1; }
.rwa-info-icon { cursor: help; opacity: 0.7; font-size: 12px; transition: opacity 0.2s ease; }
.rwa-info-icon:hover { opacity: 1; }
/* Đã sửa: Dùng Flexbox và ép line-height: 1 để hộp text không bị phồng */
.rwa-radar-target { display: flex; align-items: center; justify-content: center; line-height: 1; font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

.rwa-panel-compact { background: rgba(0,0,0,0.15); border-radius: 8px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.04); }
.rwa-toggle-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; align-items: center; margin-bottom: 4px; }

.rwa-one-shot-context { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding-top: 5px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.04); }
.rwa-one-shot-label { font-size: 9.5px; color: rgba(255,255,255,0.48); margin-right: 2px; }
.rwa-context-chip { appearance: none; border: 1px solid rgba(5,196,107,0.32); background: rgba(5,196,107,0.08); color: rgba(255,255,255,0.8); border-radius: 999px; padding: 2px 7px; font-size: 9.5px; cursor: pointer; }
.rwa-context-chip:hover { border-color: rgba(5,196,107,0.6); }
.rwa-context-chip-off { border-color: rgba(255,71,87,0.4); background: rgba(255,71,87,0.08); color: rgba(255,255,255,0.48); text-decoration: line-through; }

/* 5. Khối Gộp: Length Adjust & History Depth */
.rwa-merged-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; margin-top: 6px; }

/* Nửa Trái: Length Adjust */
.rwa-length-side { display: flex; align-items: center; gap: 6px; flex: 1; padding-right: 10px; transition: opacity 0.2s ease; }
.rwa-len-lbl { font-size: 9.5px; font-weight: bold; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); }
.rwa-len-range { margin: 0 !important; flex: 1; }
/* Đã sửa Bonus: Chuyển toàn bộ CSS chống vỡ layout width=5ch vào đây */
.rwa-len-val { font-size: 10.5px; font-weight: bold; color: var(--rwa-primary); width: 5ch; display: inline-block; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; }

/* Nửa Phải: History Depth */
.rwa-depth-side { display: flex; align-items: center; gap: 6px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 10px; }
.rwa-depth-lbl { font-size: 10px; font-weight: bold; color: rgba(255,255,255,0.6); }
.rwa-depth-inp-mini { width: 40px; height: 22px !important; padding: 0 4px !important; margin: 0 !important; font-size: 11px; text-align: center; border-color: rgba(255,140,0,0.3) !important; background: rgba(255,140,0,0.08) !important; color: #fff; border-radius: 4px !important; font-weight: bold; }

/* 6. Tối ưu Footer & Nút bấm chia tỷ lệ */
.rwa-popup-foot { align-items: center; flex-wrap: nowrap; margin-top: 4px !important; padding-top: 10px !important; border-top: 1px solid rgba(255, 255, 255, 0.05); gap: 6px !important; }

/* Nút Undo / Redo - Hình vuông vàng nổi bật */
.rwa-btn-icon-square { flex: 0 0 34px !important; width: 34px !important; height: 34px !important; padding: 0 !important; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(255, 140, 0, 0.05); border: 1px solid rgba(255, 140, 0, 0.3); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
.rwa-btn-icon-square:not(:disabled):hover { background: rgba(255, 140, 0, 0.15); transform: translateY(-1px); box-shadow: 0 0 10px var(--rwa-primary-glow); }
.rwa-btn-icon-square:disabled { opacity: 0.2; cursor: not-allowed; border-color: transparent; }
.rwa-icon-txt { color: var(--rwa-primary); font-size: 18px; font-weight: bold; line-height: 1; text-shadow: 0 0 5px var(--rwa-primary-glow); }

/* Nút Custom & Settings - Chia đều flex 1 */
.rwa-btn-custom, .rwa-btn-settings { flex: 1; height: 34px !important; position: relative; z-index: 2; border: 1px solid rgba(255,140,0,0.3) !important; color: var(--rwa-primary); background: rgba(255,140,0,0.05); font-weight: 700; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
.rwa-btn-custom:hover, .rwa-btn-settings:hover { background: rgba(255,140,0,0.15); box-shadow: 0 0 10px var(--rwa-primary-glow); transform: translateY(-1px); color: #fff; }

.rwa-popup-tip { position: fixed; pointer-events: none; z-index: 9999999; transition: opacity 0.15s ease, transform 0.15s ease; white-space: pre-line; }


.rwa-auto-profile { width: 100%; min-height: 32px; margin: 0 0 5px; justify-content: flex-start; color: var(--rwa-primary); border-color: rgba(255,140,0,0.35); background: rgba(255,140,0,0.08); font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwa-token-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 7px; padding: 4px 2px 6px; min-height: 18px; color: rgba(255,255,255,0.48); font-size: 9px; line-height: 1.2; }
.rwa-token-total { color: var(--rwa-primary); font-weight: 800; font-size: 9.5px; }
.rwa-token-part { white-space: nowrap; }

/* ========================================================================= */
/* --- BẢN CHUẨN: GIAO DIỆN SETTINGS MODAL & COMPACT ABOUT ----------------- */
/* ========================================================================= */

.rwa-settings-win { width: 640px; display: flex; flex-direction: column; }
.rwa-settings-hdr { background: rgba(255,255,255,0.015); border-bottom: 1px solid rgba(255,255,255,0.05); }
.rwa-hdr-actions { display: flex; gap: 8px; align-items: center; }

/* Ép 2 nút góc phải có kích thước và icon bằng nhau tuyệt đối */
.rwa-btn-close, .rwa-btn-info { 
  padding: 4px 10px !important; 
  font-size: 11px !important; 
  font-weight: bold !important; 
  border-radius: 6px !important; 
  height: 22px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.rwa-settings-tabs { padding: 0 24px; gap: 8px; margin-top: 12px; border-bottom: 1px solid var(--rwa-primary); }

/* Đưa cấu trúc tab từ getTabStyle cũ về CSS thuần */
.rwa-tab-btn { border: 1px solid rgba(255, 174, 0, 0.35); border-bottom: none; box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 -2px 5px rgba(0,0,0,0.2); transform: none; z-index: 1; }
.rwa-tab-btn.rwa-active { border: 1px solid var(--rwa-primary); border-bottom: none; box-shadow: inset 0 2px 15px var(--rwa-primary-glow), inset 0 1px 1px rgba(255,255,255,0.2), 0 -4px 10px rgba(0,0,0,0.4); transform: translateY(1px); z-index: 3; }

.rwa-settings-body { flex: none; height: 45vh; min-height: 45vh; max-height: 45vh; padding: 16px 24px; overflow-y: auto; }
.rwa-settings-foot { padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); display: flex; gap: 10px; align-items: center; }

/* Các nút bấm bên dưới Footer */
.rwa-btn-flex-1 { flex: 1 1 0%; }
.rwa-btn-add-style { flex: 1 1 0%; justify-content: center; border: 1px solid rgba(5, 196, 107, 0.4) !important; color: var(--rwa-accent) !important; font-weight: 700 !important; }

/* Tối ưu hóa layout About: Tận dụng khoảng trống thừa, thu gọn padding */
.rwa-about-container { height: 100%; animation: rwa-premium-fade 0.3s ease; }
.rwa-about-box { height: 100%; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; gap: 10px; margin: 0; padding: 14px 18px; box-sizing: border-box; }
.rwa-about-header-zone { text-align: center; display: flex; flex-direction: column; gap: 2px; }
.rwa-about-title { color: var(--rwa-primary); margin: 0; font-size: 18px; text-shadow: 0 0 15px var(--rwa-primary-glow); font-weight: 900; letter-spacing: 0.5px; }
.rwa-about-subtitle { margin: 0; font-size: 11.5px; color: rgba(255,255,255,0.8); line-height: 1.4; }
.rwa-about-thanks-to { margin: 4px 0 0 0; font-size: 11.5px; color: var(--rwa-primary); font-weight: bold; letter-spacing: 0.02em; }
.rwa-about-sep { height: 1px; width: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); margin: 4px 0; }
.rwa-about-desc { margin: 0; font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.75); text-align: left; overflow-y: auto; padding-right: 6px; }

/* Nút Thank You duy nhất ở cuối phần About */
.rwa-about-footer { margin-top: auto; display: flex; justify-content: center; width: 100%; }
.rwa-btn-thanks { width: 100%; justify-content: center; font-weight: 700 !important; pointer-events: none; background: rgba(255, 140, 0, 0.08) !important; border-color: rgba(255, 140, 0, 0.25) !important; color: var(--rwa-primary) !important; box-shadow: 0 0 8px var(--rwa-primary-glow) !important; }
`;
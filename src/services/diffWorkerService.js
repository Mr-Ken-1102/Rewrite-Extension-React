// src/services/diffWorkerService.js

class DiffWorkerService {
  constructor() {
    this.diffWorker = null;
    this.workerBlocked = false;
    this.resolves = {};
    this.msgId = 0;
  }

  initWorker() {
    if (this.diffWorker || this.workerBlocked) return;
    
    // [BẢN VÁ TỪ HOOK]: Tích hợp Áo Giáp chống lỗi undefined trực tiếp vào Blob
    const workerCode = `
      self.onmessage = function(e) {
        const { id, oldStr, newStr } = e.data;
        
        const safeOldStr = oldStr || "";
        const safeNewStr = newStr || "";

        const oldToks = safeOldStr.split(/(\\s+)/);
        const newToks = safeNewStr.split(/(\\s+)/);
        const m = oldToks.length, n = newToks.length;

        if (m > 3000 || n > 3000) {
          self.postMessage({ id, ops: [{ t: "eq", v: "--- Text too long for inline visual diffing. Showing result only ---\\n\\n" }, { t: "ins", v: safeNewStr }] });
          return;
        }

        const cols = n + 1;
        const dp = new Int32Array((m + 1) * cols);
        
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            if (oldToks[i - 1] === newToks[j - 1]) {
              dp[i * cols + j] = dp[(i - 1) * cols + (j - 1)] + 1;
            } else {
              dp[i * cols + j] = Math.max(dp[(i - 1) * cols + j], dp[i * cols + (j - 1)]);
            }
          }
        }
        
        const ops = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
          if (i > 0 && j > 0 && oldToks[i - 1] === newToks[j - 1]) {
            ops.unshift({ t: "eq", v: oldToks[i - 1] }); i--; j--;
          } else if (j > 0 && (i === 0 || dp[i * cols + (j - 1)] >= dp[(i - 1) * cols + j])) {
            ops.unshift({ t: "ins", v: newToks[j - 1] }); j--;
          } else {
            ops.unshift({ t: "del", v: oldToks[i - 1] }); i--;
          }
        }
        self.postMessage({ id, ops });
      };
    `;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.diffWorker = new Worker(URL.createObjectURL(blob));
      this.diffWorker.onmessage = (e) => {
        const { id, ops } = e.data;
        if (this.resolves[id]) {
          this.resolves[id](ops);
          delete this.resolves[id];
        }
      };
    } catch (error) {
      console.warn("[RWA] CSP blocked Web Worker creation. Falling back to DP Main Thread Diffing.");
      this.workerBlocked = true;
    }
  }

  computeWordDiffSyncFallback(oldStr, newStr) {
    // [BẢN VÁ TỪ HOOK]: Tích hợp Áo Giáp vào luồng Main Thread Fallback
    const safeOldStr = oldStr || "";
    const safeNewStr = newStr || "";

    const oldToks = safeOldStr.split(/(\s+)/);
    const newToks = safeNewStr.split(/(\s+)/);
    const m = oldToks.length, n = newToks.length;

    if (m > 3000 || n > 3000) {
      return [{ t: "eq", v: "--- Text too long for inline visual diffing. Showing result only ---\n\n" }, { t: "ins", v: safeNewStr }];
    }

    const cols = n + 1;
    const dp = new Int32Array((m + 1) * cols);
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldToks[i - 1] === newToks[j - 1]) {
          dp[i * cols + j] = dp[(i - 1) * cols + (j - 1)] + 1;
        } else {
          dp[i * cols + j] = Math.max(dp[(i - 1) * cols + j], dp[i * cols + (j - 1)]);
        }
      }
    }
    
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldToks[i - 1] === newToks[j - 1]) {
        ops.unshift({ t: "eq", v: oldToks[i - 1] }); i--; j--;
      } else if (j > 0 && (i === 0 || dp[i * cols + (j - 1)] >= dp[(i - 1) * cols + j])) {
        ops.unshift({ t: "ins", v: newToks[j - 1] }); j--;
      } else {
        ops.unshift({ t: "del", v: oldToks[i - 1] }); i--;
      }
    }
    return ops;
  }

  computeDiff(oldStr, newStr) {
    this.initWorker();
    return new Promise((resolve) => {
      if (this.workerBlocked) {
        resolve(this.computeWordDiffSyncFallback(oldStr, newStr));
        return;
      }
      const id = ++this.msgId;
      this.resolves[id] = resolve;
      this.diffWorker.postMessage({ id, oldStr, newStr });
    });
  }
}

// Khởi tạo một thể hiện duy nhất (Singleton) bảo toàn RAM tuyệt đối
export const diffWorkerInstance = new DiffWorkerService();
const DIFF_TOKEN_CAP = 1200;
export const DIFF_WORKER_TIMEOUT_MS = 1500;
const TOO_LONG = '— Text too long for inline diff. Showing rewritten result only —\n\n';

function fallbackResult(newStr) {
  return [{ t: 'eq', v: TOO_LONG }, { t: 'ins', v: newStr || '' }];
}

function computeSync(oldStr, newStr) {
  const oldToks = String(oldStr || '').split(/(\s+)/);
  const newToks = String(newStr || '').split(/(\s+)/);
  const m = oldToks.length;
  const n = newToks.length;
  if (m > DIFF_TOKEN_CAP || n > DIFF_TOKEN_CAP) return fallbackResult(newStr);

  const cols = n + 1;
  const dp = new Int32Array((m + 1) * cols);
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i * cols + j] = oldToks[i - 1] === newToks[j - 1]
        ? dp[(i - 1) * cols + (j - 1)] + 1
        : Math.max(dp[(i - 1) * cols + j], dp[i * cols + (j - 1)]);
    }
  }

  const reversed = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldToks[i - 1] === newToks[j - 1]) {
      reversed.push({ t: 'eq', v: oldToks[i - 1] }); i -= 1; j -= 1;
    } else if (j > 0 && (i === 0 || dp[i * cols + (j - 1)] >= dp[(i - 1) * cols + j])) {
      reversed.push({ t: 'ins', v: newToks[j - 1] }); j -= 1;
    } else {
      reversed.push({ t: 'del', v: oldToks[i - 1] }); i -= 1;
    }
  }
  reversed.reverse();
  return reversed;
}

class DiffWorkerService {
  constructor() {
    this.diffWorker = null;
    this.workerUrl = null;
    this.workerBlocked = false;
    this.resolves = new Map();
    this.msgId = 0;
  }

  initWorker() {
    if (this.diffWorker || this.workerBlocked) return;
    const workerCode = `
      const CAP = ${DIFF_TOKEN_CAP};
      self.onmessage = function(e) {
        const { id, oldStr, newStr } = e.data;
        const a = String(oldStr || '').split(/(\\s+)/);
        const b = String(newStr || '').split(/(\\s+)/);
        const m = a.length, n = b.length;
        if (m > CAP || n > CAP) {
          self.postMessage({ id, ops: [{ t: 'eq', v: ${JSON.stringify(TOO_LONG)} }, { t: 'ins', v: String(newStr || '') }] });
          return;
        }
        const cols = n + 1;
        const dp = new Int32Array((m + 1) * cols);
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
          dp[i * cols + j] = a[i - 1] === b[j - 1]
            ? dp[(i - 1) * cols + (j - 1)] + 1
            : Math.max(dp[(i - 1) * cols + j], dp[i * cols + (j - 1)]);
        }
        const rev = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
          if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { rev.push({ t: 'eq', v: a[i - 1] }); i--; j--; }
          else if (j > 0 && (i === 0 || dp[i * cols + (j - 1)] >= dp[(i - 1) * cols + j])) { rev.push({ t: 'ins', v: b[j - 1] }); j--; }
          else { rev.push({ t: 'del', v: a[i - 1] }); i--; }
        }
        rev.reverse();
        self.postMessage({ id, ops: rev });
      };
    `;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.diffWorker = new Worker(this.workerUrl);
      this.diffWorker.onmessage = (event) => {
        const { id, ops } = event.data || {};
        const pending = this.resolves.get(id);
        if (pending) {
          this.resolves.delete(id);
          if (pending.timeoutId != null) clearTimeout(pending.timeoutId);
          pending.resolve(ops || []);
        }
      };
      this.diffWorker.onerror = () => this.fallbackAllPending();
    } catch {
      this.workerBlocked = true;
      this.disposeWorker();
    }
  }

  fallbackAllPending() {
    this.workerBlocked = true;
    const pending = [...this.resolves.values()];
    this.resolves.clear();
    for (const item of pending) {
      if (item.timeoutId != null) clearTimeout(item.timeoutId);
      item.resolve(computeSync(item.oldStr, item.newStr));
    }
    this.disposeWorker();
  }

  disposeWorker() {
    try { this.diffWorker?.terminate(); } catch { /* noop */ }
    this.diffWorker = null;
    if (this.workerUrl) {
      try { URL.revokeObjectURL(this.workerUrl); } catch { /* noop */ }
      this.workerUrl = null;
    }
  }

  dispose() {
    this.resolves.forEach(({ resolve, timeoutId }) => {
      if (timeoutId != null) clearTimeout(timeoutId);
      resolve([]);
    });
    this.resolves.clear();
    this.disposeWorker();
  }

  computeWordDiffSyncFallback(oldStr, newStr) {
    return computeSync(oldStr, newStr);
  }

  computeDiff(oldStr, newStr) {
    this.initWorker();
    if (this.workerBlocked || !this.diffWorker) return Promise.resolve(computeSync(oldStr, newStr));
    return new Promise((resolve) => {
      const id = ++this.msgId;
      const timeoutId = setTimeout(() => {
        if (!this.resolves.has(id)) return;
        this.fallbackAllPending();
      }, DIFF_WORKER_TIMEOUT_MS);
      this.resolves.set(id, { resolve, oldStr, newStr, timeoutId });
      try {
        this.diffWorker.postMessage({ id, oldStr, newStr });
      } catch {
        const pending = this.resolves.get(id);
        this.resolves.delete(id);
        if (pending?.timeoutId != null) clearTimeout(pending.timeoutId);
        this.workerBlocked = true;
        this.disposeWorker();
        resolve(computeSync(oldStr, newStr));
      }
    });
  }
}

export const diffWorkerInstance = new DiffWorkerService();
export { computeSync as computeWordDiffSync, DIFF_TOKEN_CAP };

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const LedgerModal = ({ ledger, onRetry, onToggleSkip, onReview, onClose }) => {
  const slices = ledger?.slices || [];
  const counts = slices.reduce((acc, slice) => {
    acc[slice.status] = (acc[slice.status] || 0) + 1;
    return acc;
  }, {});
  const blocked = (counts.pending || 0) + (counts.running || 0) + (counts.error || 0) > 0;
  const done = (counts.done || 0) + (counts.skipped || 0);

  return (
    <Modal title={`${ledger?.profile?.name || 'Rewrite'} — Large-selection ledger`} onClose={onClose} width="620px">
      <div className="rwa-prev" style={{ fontSize: '11px', lineHeight: 1.5, marginBottom: '12px' }}>
        Large selection: {slices.length} lossless slices. Rewrites are held in session RAM only; closing this window keeps resumable progress for this browser session, but nothing is persisted to Marinara storage.
      </div>
      <div className="rwa-plbl">Progress</div>
      <div role="status" aria-live="polite" style={{ fontSize: '11px', marginBottom: '10px', opacity: 0.8 }}>
        {done}/{slices.length} resolved · {counts.error || 0} error · slice target ≤ {Number(ledger?.sliceBudget || 0).toLocaleString()} chars
      </div>
      <div style={{ maxHeight: '330px', overflowY: 'auto', display: 'grid', gap: '7px' }}>
        {slices.map((slice, index) => (
          <div key={index} className="rwa-prev" style={{ padding: '8px 10px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ flex: 1, fontSize: '11px' }}>Slice {index + 1}/{slices.length}</strong>
              <span style={{ fontSize: '10px', opacity: 0.75 }}>
                {slice.status === 'done' ? '✓ done' : slice.status === 'skipped' ? '↷ original kept' : slice.status === 'running' ? '… rewriting' : slice.status === 'error' ? '✕ error' : 'pending'}
              </span>
              {(slice.status === 'error' || slice.status === 'done') ? (
                <Button glow={false} onClick={() => onRetry(index)} style={{ height: '28px', padding: '0 9px', fontSize: '10px' }}>Retry</Button>
              ) : null}
              {slice.status !== 'running' ? (
                <Button glow={false} onClick={() => onToggleSkip(index)} style={{ height: '28px', padding: '0 9px', fontSize: '10px' }}>
                  {slice.status === 'skipped' ? 'Unskip' : 'Skip'}
                </Button>
              ) : null}
            </div>
            {slice.error ? <div role="alert" style={{ marginTop: '5px', fontSize: '10px', color: '#ff9b9b' }}>{slice.error}</div> : null}
            <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(slice.result || slice.text || '').replace(/\s+/g, ' ').slice(0, 180)}
            </div>
          </div>
        ))}
      </div>
      <div className="rwa-foot" style={{ marginTop: '12px' }}>
        <Button glow={false} onClick={onClose} style={{ flex: 1 }}>Close — keep in RAM</Button>
        <Button glow={false} variant="rwa-accept" disabled={blocked || slices.length === 0} onClick={onReview} style={{ flex: 1.6 }}>
          Review assembled result
        </Button>
      </div>
    </Modal>
  );
};

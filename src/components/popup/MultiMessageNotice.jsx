export function MultiMessageNotice({ selection, mergeMultiMsg }) {
  const count = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  if (count <= 1) return null;
  return (
    <div className="rwa-prev" style={{ marginBottom: '8px', fontSize: '10.5px', color: 'var(--rwa-primary)' }}>
      Multi-message selection: {count} messages · {mergeMultiMsg ? 'Merged mode (marker-validated; unsafe split falls back to sequential)' : 'Sequential mode (review/apply one message at a time)'}
    </div>
  );
}

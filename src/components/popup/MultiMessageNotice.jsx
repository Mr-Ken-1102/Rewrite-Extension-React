export function MultiMessageNotice({ selection, mergeMultiMsg }) {
  const count = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  if (count <= 1) return null;

  return (
    <div className="rwa2-multi-notice">
      <span className="rwa2-status-dot" aria-hidden="true"></span>
      <span>
        {count} messages · {mergeMultiMsg
          ? 'Merged mode — marker validated; unsafe splits fall back to sequential.'
          : 'Sequential mode — review and apply one message at a time.'}
      </span>
    </div>
  );
}

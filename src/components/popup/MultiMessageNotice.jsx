export function MultiMessageNotice({ language = 'en', selection, mergeMultiMsg }) {
  const vi = language === 'vi';
  const count = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  if (count <= 1) return null;

  return (
    <div className="rwa2-multi-notice">
      <span className="rwa2-status-dot" aria-hidden="true"></span>
      <span>
        {vi
          ? `${count} tin nhắn · ${mergeMultiMsg
            ? 'Chế độ gộp — marker được xác thực; tách không an toàn sẽ tự chuyển sang tuần tự.'
            : 'Chế độ tuần tự — xem lại và áp dụng từng tin nhắn.'}`
          : `${count} messages · ${mergeMultiMsg
            ? 'Merged mode — marker validated; unsafe splits fall back to sequential.'
            : 'Sequential mode — review and apply one message at a time.'}`}
      </span>
    </div>
  );
}

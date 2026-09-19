import { getProviderCapabilities } from '../../services/providers/providerCapabilities.js';

const FREE_MODE_HELP = 'Free Mode Off: best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: best for descriptive scenes, general actions, or setting time/space.';
const FREE_MODE_HELP_VI = 'Tắt Tự do: phù hợp khi viết theo POV nhân vật, hội thoại trực tiếp hoặc nội tâm.\nBật Tự do: phù hợp với miêu tả cảnh, hành động chung hoặc bối cảnh thời gian/không gian.';

function fastRewriteHelp(mode, vi) {
  if (mode === 'marinara') {
    return vi
      ? 'Viết lại nhanh giúp tăng tốc xử lý và trả kết quả sớm hơn. Nếu bạn ưu tiên chất lượng hơn tốc độ, hãy tắt tùy chọn này. Hiện chỉ hỗ trợ kết nối Marinara.'
      : 'Fast Rewrite speeds up rewriting and returns results sooner. Turn it off if you prefer maximum quality over speed. Currently supported only with Marinara connections.';
  }
  return vi
    ? 'Viết lại nhanh hiện chỉ hỗ trợ kết nối Marinara. Chuyển sang Marinara để sử dụng tính năng này.'
    : 'Fast Rewrite is currently supported only with Marinara connections. Switch to Marinara to use this feature.';
}

function streamingHelp(available, vi) {
  if (!available) {
    return vi
      ? 'Kết nối hiện tại không hỗ trợ nhận kết quả theo thời gian thực.'
      : 'The current connection does not support live streaming output.';
  }
  return vi
    ? 'Hiển thị kết quả ngay khi nội dung được nhận thay vì chờ toàn bộ phản hồi hoàn tất.'
    : 'Show rewritten text as it arrives instead of waiting for the full response.';
}

function messageCount(selection) {
  if (Array.isArray(selection?.segments) && selection.segments.length > 1) return selection.segments.length;
  return selection?.source === 'message' ? 1 : 0;
}

export function LiveRail({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  tokenInfo,
  selection,
  inspectorOpen,
  onToggleInspector,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const capabilities = getProviderCapabilities(config.connMode);
  const count = messageCount(selection);
  const countLabel = count > 0
    ? (vi ? `${count} tin` : `${count} ${count === 1 ? 'msg' : 'msgs'}`)
    : text('selection', 'vùng chọn');
  const tokenLabel = tokenInfo.loading && !tokenInfo.parts
    ? `${countLabel} · ${text('calculating…', 'đang tính…')}`
    : tokenInfo.parts
      ? `${countLabel} · ≈${tokenInfo.parts.total.toLocaleString()} tok`
      : `${countLabel} · ≈— tok`;
  const tokenHelp = tokenInfo.error || text(
    'Estimated input size for this rewrite. Open Request Inspector for the breakdown.',
    'Ước lượng kích thước đầu vào cho lần viết lại này. Mở Request Inspector để xem chi tiết.',
  );

  const control = ({
    key,
    label,
    active,
    disabled = false,
    help,
    onClick,
  }) => (
    <button
      type="button"
      className={`rwa2-live-control ${active ? 'rwa2-live-control-on' : ''}`.trim()}
      aria-pressed={active}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={(event) => onTooltip?.(event, help)}
      onMouseLeave={onTooltipLeave}
      onFocus={(event) => onTooltip?.(event, help)}
      onBlur={onTooltipLeave}
      aria-description={help}
    >
      <span className="rwa2-live-dot" aria-hidden="true"></span>
      <span className="rwa2-live-key">{key}</span>
      <span className="rwa2-live-label">{label}</span>
    </button>
  );

  return (
    <section className="rwa2-live-rail" aria-label={text('Live rewrite controls', 'Điều khiển viết lại nhanh')}>
      <div className="rwa2-live-controls">
        {control({
          key: 'FREE',
          label: config.freeMode ? text('On', 'Bật') : text('Off', 'Tắt'),
          active: !!config.freeMode,
          help: vi ? FREE_MODE_HELP_VI : FREE_MODE_HELP,
          onClick: () => {
            updateConfig({ freeMode: !config.freeMode });
            keepFocus();
          },
        })}
        {control({
          key: 'FAST',
          label: capabilities.fastRewrite
            ? (config.fastRewrite !== false ? text('On', 'Bật') : text('Off', 'Tắt'))
            : text('N/A', 'N/A'),
          active: capabilities.fastRewrite && config.fastRewrite !== false,
          disabled: !capabilities.fastRewrite,
          help: fastRewriteHelp(config.connMode, vi),
          onClick: () => {
            updateConfig({ fastRewrite: config.fastRewrite === false });
            keepFocus();
          },
        })}
        {control({
          key: 'STREAM',
          label: capabilities.liveStreaming
            ? (config.liveStreaming !== false ? text('On', 'Bật') : text('Off', 'Tắt'))
            : text('N/A', 'N/A'),
          active: capabilities.liveStreaming && config.liveStreaming !== false,
          disabled: !capabilities.liveStreaming,
          help: streamingHelp(capabilities.liveStreaming, vi),
          onClick: () => {
            updateConfig({ liveStreaming: config.liveStreaming === false });
            keepFocus();
          },
        })}
      </div>

      <button
        type="button"
        className={`rwa2-live-token ${inspectorOpen ? 'rwa2-live-token-open' : ''}`.trim()}
        aria-expanded={inspectorOpen}
        aria-controls="rwa2-request-inspector"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleInspector();
        }}
        onMouseEnter={(event) => onTooltip?.(event, tokenHelp)}
        onMouseLeave={onTooltipLeave}
        onFocus={(event) => onTooltip?.(event, tokenHelp)}
        onBlur={onTooltipLeave}
        aria-description={tokenHelp}
      >
        <span>{tokenLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </section>
  );
}

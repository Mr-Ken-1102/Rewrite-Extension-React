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

export function PerformanceStrip({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const capabilities = getProviderCapabilities(config.connMode);

  const items = [
    {
      key: 'FREE',
      state: config.freeMode ? text('On', 'Bật') : text('Off', 'Tắt'),
      active: !!config.freeMode,
      disabled: false,
      help: vi ? FREE_MODE_HELP_VI : FREE_MODE_HELP,
      toggle: () => updateConfig({ freeMode: !config.freeMode }),
    },
    {
      key: 'FAST',
      state: capabilities.fastRewrite
        ? (config.fastRewrite !== false ? text('On', 'Bật') : text('Off', 'Tắt'))
        : text('Unavailable', 'Không hỗ trợ'),
      active: capabilities.fastRewrite && config.fastRewrite !== false,
      disabled: !capabilities.fastRewrite,
      help: fastRewriteHelp(config.connMode, vi),
      toggle: () => updateConfig({ fastRewrite: config.fastRewrite === false }),
    },
    {
      key: 'STREAM',
      state: capabilities.liveStreaming
        ? (config.liveStreaming !== false ? text('On', 'Bật') : text('Off', 'Tắt'))
        : text('Unavailable', 'Không hỗ trợ'),
      active: capabilities.liveStreaming && config.liveStreaming !== false,
      disabled: !capabilities.liveStreaming,
      help: streamingHelp(capabilities.liveStreaming, vi),
      toggle: () => updateConfig({ liveStreaming: config.liveStreaming === false }),
    },
  ];

  return (
    <div className="rwa2-performance-strip" role="group" aria-label={text('Rewrite modes', 'Chế độ viết lại')}>
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          className={`rwa2-performance-item ${item.active ? 'rwa2-performance-on' : ''}`.trim()}
          aria-pressed={item.active}
          aria-label={`${item.key}: ${item.state}`}
          disabled={item.disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            item.toggle();
            keepFocus();
          }}
          onMouseEnter={(event) => onTooltip?.(event, item.help)}
          onMouseLeave={onTooltipLeave}
          onFocus={(event) => onTooltip?.(event, item.help)}
          onBlur={onTooltipLeave}
          aria-description={item.help}
        >
          <span className="rwa2-performance-key">{item.key}</span>
          <span className="rwa2-performance-meta" data-short={item.state}>{item.state}</span>
          {index < items.length - 1 && <span className="rwa2-performance-divider" aria-hidden="true"></span>}
        </button>
      ))}
    </div>
  );
}

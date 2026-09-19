import { MultiMessageNotice } from './MultiMessageNotice';
import { ProfileGrid } from './ProfileGrid';
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

function streamHelp(available, vi) {
  if (!available) {
    return vi
      ? 'Kết nối hiện tại không hỗ trợ nhận kết quả theo thời gian thực.'
      : 'The current connection does not support live streaming output.';
  }
  return vi
    ? 'Hiển thị kết quả ngay khi nội dung được nhận thay vì chờ toàn bộ phản hồi hoàn tất.'
    : 'Show rewritten text as it arrives instead of waiting for the full response.';
}

export function RewriteSection({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  freeMode = false,
  fastRewrite = false,
  liveStreaming = true,
  connectionMode = 'marinara',
  selection,
  mergeMultiMsg,
  onRun,
  onToggleFreeMode,
  onToggleFastRewrite,
  onToggleStreaming,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const capabilities = getProviderCapabilities(connectionMode);

  const items = [
    {
      key: 'FREE',
      active: !!freeMode,
      disabled: false,
      state: freeMode ? text('On', 'Bật') : text('Off', 'Tắt'),
      help: vi ? FREE_MODE_HELP_VI : FREE_MODE_HELP,
      onToggle: onToggleFreeMode,
    },
    {
      key: 'FAST',
      active: capabilities.fastRewrite && !!fastRewrite,
      disabled: !capabilities.fastRewrite,
      state: capabilities.fastRewrite
        ? (fastRewrite ? text('On', 'Bật') : text('Off', 'Tắt'))
        : text('N/A', 'N/A'),
      help: fastRewriteHelp(connectionMode, vi),
      onToggle: onToggleFastRewrite,
    },
    {
      key: 'STREAM',
      active: capabilities.liveStreaming && !!liveStreaming,
      disabled: !capabilities.liveStreaming,
      state: capabilities.liveStreaming
        ? (liveStreaming ? text('On', 'Bật') : text('Off', 'Tắt'))
        : text('N/A', 'N/A'),
      help: streamHelp(capabilities.liveStreaming, vi),
      onToggle: onToggleStreaming,
    },
  ];

  return (
    <section className="rwa2-rewrite" aria-label={text('Rewrite commands', 'Thiết lập viết lại')}>
      <div className="rwa2-section-head">
        <div>
          <div className="rwa2-kicker">Rewrite</div>
          <div className="rwa2-section-title">{text('Choose a style', 'Chọn kiểu viết')}</div>
        </div>
        <div className="rwa2-section-meta">
          {vi
            ? `${profiles.length} kiểu · cuộn hoặc gõ để tìm`
            : `${profiles.length} ${profiles.length === 1 ? 'style' : 'styles'} · scroll or type`}
        </div>
      </div>

      <div className="rwa2-performance-strip" role="group" aria-label={text('Rewrite modes', 'Chế độ viết lại')}>
        {items.map((item, index) => (
          <div className="rwa2-performance-slot" key={item.key}>
            {index > 0 && <span className="rwa2-performance-divider" aria-hidden="true"></span>}
            <button
              type="button"
              className={`rwa2-performance-item ${item.active ? 'rwa2-performance-on' : ''}`.trim()}
              aria-pressed={item.active}
              disabled={item.disabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                item.onToggle?.();
              }}
              onMouseEnter={(event) => onTooltip?.(event, item.help)}
              onMouseLeave={onTooltipLeave}
              onFocus={(event) => onTooltip?.(event, item.help)}
              onBlur={onTooltipLeave}
              aria-description={item.help}
            >
              <span className="rwa2-performance-key">{item.key}</span>
              <span className="rwa2-performance-meta">{item.state}</span>
            </button>
          </div>
        ))}
      </div>

      <MultiMessageNotice language={language} selection={selection} mergeMultiMsg={mergeMultiMsg} />

      <ProfileGrid
        language={language}
        profiles={profiles}
        colCount={colCount}
        rows={rows}
        compact={compact}
        onRun={onRun}
        onTooltip={onTooltip}
        onTooltipLeave={onTooltipLeave}
      />
    </section>
  );
}

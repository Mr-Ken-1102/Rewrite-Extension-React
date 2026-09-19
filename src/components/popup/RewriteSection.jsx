import { Button } from '../ui/Button';
import { MultiMessageNotice } from './MultiMessageNotice';
import { ProfileGrid } from './ProfileGrid';
import { getProviderCapabilities } from '../../services/providers/providerCapabilities.js';

export function RewriteSection({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  autoProfile,
  fastRewrite = false,
  liveStreaming = true,
  connectionMode = 'marinara',
  selection,
  mergeMultiMsg,
  onRun,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const autoIdentityLabel = autoProfile
    ? `${autoProfile.identityKind === 'persona' ? 'Persona' : 'Char'}: ${autoProfile.identityName || autoProfile.name}`
    : '';
  const capabilities = getProviderCapabilities(connectionMode);
  const fastState = capabilities.fastRewrite
    ? (fastRewrite ? text('Reasoning reduced', 'Giảm reasoning') : text('Off', 'Tắt'))
    : text('Unavailable', 'Không hỗ trợ');
  const streamState = capabilities.liveStreaming
    ? (liveStreaming ? text('Live output', 'Trực tiếp') : text('Off', 'Tắt'))
    : text('Unavailable', 'Không hỗ trợ');
  const performanceAria = text(
    `Fast Rewrite: ${fastState}. Live Streaming: ${streamState}.`,
    `Viết lại nhanh: ${fastState}. Streaming trực tiếp: ${streamState}.`,
  );

  return (
    <section className="rwa2-rewrite" aria-label={text('Rewrite commands', 'Thiết lập viết lại')}>
      <div className="rwa2-section-head">
        <div>
          <div className="rwa2-kicker">Rewrite</div>
          <div className="rwa2-section-title">{text('Choose a style', 'Thiết lập sẵn')}</div>
        </div>
        <div className="rwa2-section-meta">
          {vi
            ? `${profiles.length} thiết lập · cuộn hoặc gõ để tìm`
            : `${profiles.length} ${profiles.length === 1 ? 'style' : 'styles'} · scroll or type`}
        </div>
      </div>

      <div className="rwa2-performance-strip" role="status" aria-label={performanceAria}>
        <div className={`rwa2-performance-item ${capabilities.fastRewrite && fastRewrite ? 'rwa2-performance-on' : ''}`.trim()}>
          <span className="rwa2-performance-key">FAST</span>
          <span className="rwa2-performance-meta">{fastState}</span>
        </div>
        <span className="rwa2-performance-divider" aria-hidden="true"></span>
        <div className={`rwa2-performance-item ${capabilities.liveStreaming && liveStreaming ? 'rwa2-performance-on' : ''}`.trim()}>
          <span className="rwa2-performance-key">STREAM</span>
          <span className="rwa2-performance-meta">{streamState}</span>
        </div>
      </div>

      {autoProfile && (
        <Button
          glow={false}
          className="rwa2-auto-profile"
          aria-label={autoIdentityLabel}
          aria-description={autoProfile.prompt}
          onMouseEnter={(event) => onTooltip(event, `${autoIdentityLabel} · ${autoProfile.name}: ${autoProfile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onFocus={(event) => onTooltip(event, `${autoIdentityLabel} · ${autoProfile.name}: ${autoProfile.prompt}`)}
          onBlur={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(autoProfile);
          }}
        >
          <span aria-hidden="true">✦</span>
          <span>{autoIdentityLabel}</span>
        </Button>
      )}

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

import { Button } from '../ui/Button';
import { MultiMessageNotice } from './MultiMessageNotice';
import { ProfileGrid } from './ProfileGrid';

export function RewriteSection({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  autoProfile,
  fastRewrite = false,
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

      <div
        className={`rwa2-fast-strip ${fastRewrite ? 'rwa2-fast-strip-active' : 'rwa2-fast-strip-idle'}`}
        role="status"
        aria-label={fastRewrite
          ? text('Fast Rewrite enabled with live SSE streaming', 'Viết lại nhanh đang bật với SSE streaming trực tiếp')
          : text('Standard rewrite path active', 'Đang dùng luồng viết lại tiêu chuẩn')}
      >
        <div className="rwa2-fast-copy">
          <span className="rwa2-fast-title">{text('Fast Rewrite', 'Viết lại nhanh')}</span>
          <span className="rwa2-fast-meta">
            {fastRewrite
              ? text('Fast path · SSE live', 'Đường nhanh · SSE trực tiếp')
              : text('Standard path', 'Luồng tiêu chuẩn')}
          </span>
        </div>
        <span className="rwa2-fast-live">{fastRewrite ? text('LIVE', 'NHANH') : text('STD', 'CHUẨN')}</span>
        <span className="rwa2-fast-rail" aria-hidden="true"><span></span></span>
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

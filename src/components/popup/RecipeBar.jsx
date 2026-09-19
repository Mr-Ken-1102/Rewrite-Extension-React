export function RecipeBar({
  language = 'en',
  config,
  contextSources,
  contextExclusions,
  onToggleContext,
  onOpenInspector,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const historyDepth = Math.max(0, Number(config.contextDepth) || 0);
  const sourceItems = contextSources.filter((source) => source.key !== 'history');
  const historyExcluded = !!contextExclusions.history;
  const lengthLabel = config.lengthEnabled
    ? `${text('Length', 'Độ dài')} ${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct || 0}%`
    : text('Length Auto', 'Độ dài Auto');

  const sourceChip = (source) => {
    const excluded = !!contextExclusions[source.key];
    const help = text(
      `${source.detail || source.label}. ${excluded ? 'Excluded from' : 'Included in'} this rewrite only.`,
      `${source.detail || source.label}. ${excluded ? 'Đã loại khỏi' : 'Đang dùng trong'} lần viết lại này.`,
    );
    return (
      <button
        key={source.key}
        type="button"
        className={`rwa2-recipe-chip rwa2-recipe-source ${excluded ? 'rwa2-recipe-chip-off' : ''}`.trim()}
        aria-pressed={!excluded}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleContext(source.key);
        }}
        onMouseEnter={(event) => onTooltip?.(event, help)}
        onMouseLeave={onTooltipLeave}
        onFocus={(event) => onTooltip?.(event, help)}
        onBlur={onTooltipLeave}
        aria-description={help}
      >
        {source.label}
      </button>
    );
  };

  return (
    <section className="rwa2-recipe" aria-label={text('Recipe for this rewrite', 'Công thức cho lần viết lại này')}>
      <span className="rwa2-recipe-title">{text('Recipe', 'Công thức')}</span>
      <div className="rwa2-recipe-chips">
        {sourceItems.map(sourceChip)}
        {historyDepth > 0 && (
          <button
            type="button"
            className={`rwa2-recipe-chip rwa2-recipe-source ${historyExcluded ? 'rwa2-recipe-chip-off' : ''}`.trim()}
            aria-pressed={!historyExcluded}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleContext('history');
            }}
            title={text(
              `History depth ${historyDepth} · click to include/exclude it for this rewrite only`,
              `Độ sâu lịch sử ${historyDepth} · bấm để đưa vào/loại khỏi riêng lần viết lại này`,
            )}
          >
            {text('History', 'Lịch sử')} {historyDepth}
          </button>
        )}
        <button
          type="button"
          className="rwa2-recipe-chip rwa2-recipe-parameter"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenInspector();
          }}
          title={text('Open Length controls in Request Inspector', 'Mở điều chỉnh Độ dài trong Request Inspector')}
        >
          {lengthLabel}
        </button>
      </div>
    </section>
  );
}

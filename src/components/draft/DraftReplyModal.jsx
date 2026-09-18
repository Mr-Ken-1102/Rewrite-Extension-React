import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { DOMUtils } from '../../utils/domUtils.js';
import {
  clampFloatingPanelPosition,
  defaultDraftReplyPanelPosition,
  getVisualViewportBounds,
} from '../../utils/floatingPanelGeometry.js';
import { useFloatingPanelDrag } from '../../hooks/useFloatingPanelDrag.js';

function modeCopy(language, mode) {
  const vi = language === 'vi';
  if (mode === 'continue') return vi ? 'Viết tiếp bản nháp' : 'Continue Draft';
  return vi ? 'Ý tưởng → câu trả lời' : 'Idea → Reply';
}

const sessionPanelPositions = new Map();

export function DraftReplyModal({
  state,
  onUpdateInput,
  onGenerate,
  onCancelGeneration,
  onClose,
  onInsert,
  onRewriteAgain,
}) {
  const language = usePersistentStore((store) => store.config.uiLanguage === 'vi' ? 'vi' : 'en');
  const showToast = useToastStore((store) => store.showToast);
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const [direction, setDirection] = useState(state?.direction || '');
  const [mode, setMode] = useState(state?.mode === 'continue' ? 'continue' : 'idea');
  const [position, setPosition] = useState(null);
  const panelRef = useRef(null);
  const chatMode = state?.chatMode || null;

  useEffect(() => {
    setDirection(state?.direction || '');
    setMode(state?.mode === 'continue' ? 'continue' : 'idea');
  }, [state?.direction, state?.mode]);

  const commitPosition = useCallback((next) => {
    const normalized = { left: Math.round(next.left), top: Math.round(next.top) };
    if (chatMode) sessionPanelPositions.set(chatMode, normalized);
    setPosition(normalized);
  }, [chatMode]);
  const handleDragStart = useFloatingPanelDrag({ panelRef, onPositionChange: commitPosition });

  useLayoutEffect(() => {
    if (!state?.chatId) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    let frame = 0;
    const place = () => {
      frame = 0;
      if (panel.dataset.rwaDragging === 'true') return;
      const rect = panel.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      const bounds = getVisualViewportBounds(window);
      const anchor = DOMUtils.getChatComposerAnchor();
      setPosition((current) => {
        const remembered = state?.chatMode ? sessionPanelPositions.get(state.chatMode) : null;
        const next = current
          ? clampFloatingPanelPosition(current, size, bounds)
          : remembered
            ? clampFloatingPanelPosition(remembered, size, bounds)
            : defaultDraftReplyPanelPosition(size, bounds, anchor);
        if (state?.chatMode) sessionPanelPositions.set(state.chatMode, next);
        return next;
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(place);
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(panel);
    window.addEventListener('resize', schedule, { passive: true });
    window.visualViewport?.addEventListener?.('resize', schedule);
    window.visualViewport?.addEventListener?.('scroll', schedule);
    schedule();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener?.('resize', schedule);
      window.visualViewport?.removeEventListener?.('scroll', schedule);
    };
  }, [state?.chatId, state?.chatMode]);

  if (!state) return null;

  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';
  const isPersonaResolving = state.personaResolving === true;
  const personaLabel = state.persona?.name
    ? 'Persona: ' + state.persona.name
    : isPersonaResolving
      ? text('Resolving Persona…', 'Đang xác định Persona…')
      : text('Persona unavailable', 'Không có Persona');
  const profileLabel = isPersonaResolving
    ? text('Checking Persona card and Voice Profile…', 'Đang kiểm tra Persona card và Voice Profile…')
    : state.voiceProfile?.name
      ? 'Voice Profile: ' + state.voiceProfile.name
      : text('Using current Persona card/style data', 'Đang dùng dữ liệu Persona hiện tại');

  const streamText = state.streamStatus === 'connecting'
    ? text('SSE · connecting…', 'SSE · đang kết nối…')
    : state.streamStatus === 'finalizing'
      ? text('SSE · finalizing ' + state.streamChars.toLocaleString() + ' chars', 'SSE · đang hoàn tất ' + state.streamChars.toLocaleString() + ' ký tự')
      : state.streamStatus === 'done'
        ? text('SSE · received ' + state.streamChars.toLocaleString() + ' chars', 'SSE · đã nhận ' + state.streamChars.toLocaleString() + ' ký tự')
        : state.streamStatus
          ? text('SSE · streaming ' + state.streamChars.toLocaleString() + ' chars', 'SSE · đang nhận ' + state.streamChars.toLocaleString() + ' ký tự')
          : '';

  const submit = () => {
    if (isPersonaResolving || !state.persona?.key) return;
    onUpdateInput?.({ direction, mode });
    onGenerate?.({ direction, mode });
  };

  const copyResult = async () => {
    const ok = await DOMUtils.safeCopy(state.result || '');
    showToast(
      ok
        ? text('Draft copied to clipboard.', 'Đã sao chép bản nháp.')
        : text('Clipboard copy failed. The draft remains selectable here.', 'Không thể sao chép. Bản nháp vẫn có thể chọn trực tiếp tại đây.'),
      ok ? 'ok' : 'warn',
    );
  };

  const closeAction = isLoading ? onCancelGeneration : onClose;

  return (
    <section
      ref={panelRef}
      className="rwa-draft-window"
      role="dialog"
      aria-modal="false"
      aria-label={text('Draft Reply', 'Soạn câu trả lời')}
      data-rwa-feature="draft-reply-window"
      style={{
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      <header className="rwa-draft-header" onPointerDown={handleDragStart}>
        <div className="rwa-draft-brand">
          <span className="rwa-draft-brand-eyebrow">Rewrite Assistant</span>
          <span className="rwa-draft-title">{text('Draft Reply', 'Soạn câu trả lời')}</span>
        </div>
        <div className="rwa-draft-header-right">
          <span className="rwa-draft-persona-chip" title={profileLabel}>✦ {personaLabel}</span>
          <button
            type="button"
            className="rwa-draft-close"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={closeAction}
            aria-label={isLoading
              ? text('Cancel generation', 'Hủy tạo')
              : text('Close Draft Reply', 'Đóng Soạn câu trả lời')}
            title={isLoading
              ? text('Cancel generation', 'Hủy tạo')
              : text('Close', 'Đóng')}
          >
            ×
          </button>
        </div>
      </header>

      <div className="rwa-draft-body">
        {!isSuccess && !isError && (
          <>
            <div className="rwa-draft-guidance-row">
              <span className="rwa-draft-guidance-question">
                {text('How should this reply be written?', 'Bạn muốn câu trả lời theo hướng nào?')}
              </span>
              <span className="rwa-draft-guidance-source" title={profileLabel}>{profileLabel}</span>
            </div>
            <div className="rwa-draft-mode-row" role="group" aria-label={text('Draft Reply mode', 'Chế độ Soạn câu trả lời')}>
              {['idea', 'continue'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={'rwa-draft-mode ' + (mode === value ? 'rwa-draft-mode-active' : '')}
                  aria-pressed={mode === value}
                  disabled={isLoading || isPersonaResolving}
                  onClick={() => {
                    setMode(value);
                    onUpdateInput?.({ mode: value });
                  }}
                >
                  {modeCopy(language, value)}
                </button>
              ))}
            </div>

            <textarea
              className="rwa-inp rwa-draft-direction"
              value={direction}
              disabled={isLoading}
              onChange={(event) => {
                const value = event.target.value;
                setDirection(value);
                onUpdateInput?.({ direction: value });
              }}
              placeholder={mode === 'continue'
                ? text('Write the beginning of your reply here; AI will continue/refine it…', 'Viết phần đầu câu trả lời ở đây; AI sẽ viết tiếp/chỉnh lại…')
                : text('Example: hug her, apologize sincerely, but keep a teasing tone… Leave empty to ask for a fitting suggestion.', 'Ví dụ: ôm cô ấy, xin lỗi thật lòng nhưng vẫn hơi trêu chọc… Có thể để trống để AI tự gợi ý câu phù hợp.')}
              maxLength={6000}
            />
            <div className="rwa-draft-hint">
              {text(
                'Draft Reply writes only the active Persona’s turn. The chat behind this popup remains readable and scrollable.',
                'Soạn câu trả lời chỉ viết lượt của Persona hiện tại. Bạn vẫn có thể đọc và cuộn chat phía sau popup này.',
              )}
            </div>
          </>
        )}

        {isLoading && (
          <div className="rwa-draft-generation">
            {streamText ? (
              <div className="rwar-stream-status" role="status" aria-live="polite">
                <span className="rwar-stream-dot" aria-hidden="true"></span>
                <span>{streamText}</span>
              </div>
            ) : null}
            <div className="rwa-pulse"></div>
            <div className="rwa-draft-loading-copy">
              {state.partialResult
                ? text('Receiving Persona reply…', 'Đang nhận câu trả lời của Persona…')
                : text('Drafting the Persona reply…', 'Đang soạn câu trả lời của Persona…')}
            </div>
            {state.partialResult ? (
              <div className="rwa-prev rwa-draft-live" aria-live="polite">{state.partialResult}</div>
            ) : null}
          </div>
        )}

        {isError && (
          <div className="rwa-draft-error" role="alert">
            <div className="rwa-draft-error-title">{text('Draft Reply could not finish', 'Không thể hoàn tất Soạn câu trả lời')}</div>
            <div className="rwa-prev">{state.error}</div>
          </div>
        )}

        {isSuccess && (
          <>
            <div className="rwa-plbl">{text('Your direction', 'Chỉ dẫn của bạn')}</div>
            <div className="rwa-prev rwa-draft-source">
              {state.direction?.trim() || text('[No direction — context-based suggestion]', '[Không có chỉ dẫn — gợi ý theo ngữ cảnh]')}
            </div>
            <div className="rwa-plbl rwa-draft-result-label">{text('Persona draft', 'Bản nháp Persona')}</div>
            <div className="rwa-prev rwa-draft-result" tabIndex={0}>{state.result}</div>
            <div className="rwa-draft-secondary-actions">
              <Button glow={false} onClick={() => onRewriteAgain?.('another')}>{text('↻ Another', '↻ Bản khác')}</Button>
              <Button glow={false} onClick={() => onRewriteAgain?.('shorter')}>{text('Shorter', 'Ngắn hơn')}</Button>
              <Button glow={false} onClick={() => onRewriteAgain?.('longer')}>{text('Longer', 'Dài hơn')}</Button>
              <Button glow={false} onClick={copyResult}>{text('Copy', 'Sao chép')}</Button>
            </div>
            <div className="rwa-draft-success-note">
              {text(
                'Used up to ' + (state.historyDepth || 0) + ' recent messages. Review the draft before inserting it.',
                'Đã dùng tối đa ' + (state.historyDepth || 0) + ' tin nhắn gần đây. Hãy kiểm tra trước khi chèn.',
              )}
            </div>
          </>
        )}
      </div>

      <footer className="rwa-draft-footer">
        {state.status === 'editing' && (
          <>
            <Button glow={false} className="rwa-draft-footer-btn" onClick={onClose}>{text('Cancel', 'Hủy')}</Button>
            <Button
              glow={false}
              variant="rwa-accept"
              className="rwa-draft-footer-btn"
              onClick={submit}
              disabled={isPersonaResolving || !state.persona?.key}
            >
              {isPersonaResolving
                ? text('Resolving Persona…', 'Đang xác định Persona…')
                : direction.trim()
                  ? text('✦ Draft reply', '✦ Soạn câu trả lời')
                  : text('✦ Suggest a reply', '✦ Gợi ý câu trả lời')}
            </Button>
          </>
        )}

        {isLoading && (
          <>
            <span className="rwa-draft-footer-status">{streamText || text('Generating…', 'Đang tạo…')}</span>
            <Button glow={false} className="rwa-draft-footer-btn rwa-draft-footer-single" onClick={onCancelGeneration}>
              {text('Cancel generation', 'Hủy tạo')}
            </Button>
          </>
        )}

        {isError && (
          state.personaResolutionFailed ? (
            <Button glow={false} className="rwa-draft-footer-btn rwa-draft-footer-full" onClick={onClose}>
              {text('Close and choose a Persona', 'Đóng và chọn Persona')}
            </Button>
          ) : (
            <>
              <Button glow={false} className="rwa-draft-footer-btn" onClick={() => onUpdateInput?.({ status: 'editing', error: '' })}>
                {text('Edit direction', 'Sửa chỉ dẫn')}
              </Button>
              <Button glow={false} variant="rwa-accept" className="rwa-draft-footer-btn" onClick={submit}>
                {text('Try again', 'Thử lại')}
              </Button>
            </>
          )
        )}

        {isSuccess && (
          <>
            <Button glow={false} className="rwa-draft-footer-btn" onClick={onClose}>{text('Close', 'Đóng')}</Button>
            <Button glow={false} variant="rwa-accept" className="rwa-draft-footer-btn" onClick={onInsert}>
              {text('✓ Insert into composer', '✓ Chèn vào ô nhập')}
            </Button>
          </>
        )}
      </footer>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { DOMUtils } from '../../utils/domUtils.js';

function modeCopy(language, mode) {
  const vi = language === 'vi';
  if (mode === 'continue') return vi ? 'Viết tiếp bản nháp' : 'Continue Draft';
  return vi ? 'Ý tưởng → câu trả lời' : 'Idea → Reply';
}

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

  useEffect(() => {
    setDirection(state?.direction || '');
    setMode(state?.mode === 'continue' ? 'continue' : 'idea');
  }, [state?.direction, state?.mode]);

  if (!state) return null;

  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';
  const personaLabel = state.persona?.name
    ? 'Persona: ' + state.persona.name
    : text('Persona will be resolved from the active chat', 'Persona sẽ được xác định từ chat hiện tại');
  const profileLabel = state.voiceProfile?.name
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

  return (
    <Modal
      title={text('Draft Reply', 'Soạn câu trả lời')}
      onClose={isLoading ? onCancelGeneration : onClose}
      width="620px"
      className="rwa-draft-window"
      bodyClassName="rwa-draft-body"
    >
      <div className="rwa-draft-meta">
        <span className="rwa-draft-persona-chip">✦ {personaLabel}</span>
        <span className="rwa-draft-profile-note">{profileLabel}</span>
      </div>

      {!isSuccess && !isError && (
        <>
          <div className="rwa-plbl">{text('How should this reply be written?', 'Bạn muốn câu trả lời được viết như thế nào?')}</div>
          <div className="rwa-draft-mode-row" role="group" aria-label={text('Draft Reply mode', 'Chế độ Soạn câu trả lời')}>
            {['idea', 'continue'].map((value) => (
              <button
                key={value}
                type="button"
                className={'rwa-draft-mode ' + (mode === value ? 'rwa-draft-mode-active' : '')}
                aria-pressed={mode === value}
                disabled={isLoading}
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
              'Draft Reply always writes only the active Persona’s turn. It never sends the message automatically.',
              'Soạn câu trả lời chỉ viết lượt của Persona hiện tại và không bao giờ tự gửi tin nhắn.',
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
          <div className="rwa-draft-single-action">
            <Button glow={false} onClick={onCancelGeneration}>{text('Cancel generation', 'Hủy tạo')}</Button>
          </div>
        </div>
      )}

      {isError && (
        <div className="rwa-draft-error" role="alert">
          <div className="rwa-draft-error-title">{text('Draft Reply could not finish', 'Không thể hoàn tất Soạn câu trả lời')}</div>
          <div className="rwa-prev">{state.error}</div>
          <div className="rwa-draft-error-actions">
            <Button glow={false} onClick={() => onUpdateInput?.({ status: 'editing', error: '' })}>
              {text('Edit direction', 'Sửa chỉ dẫn')}
            </Button>
            <Button glow={false} variant="rwa-accept" onClick={submit}>{text('Try again', 'Thử lại')}</Button>
          </div>
        </div>
      )}

      {state.status === 'editing' && (
        <div className="rwa-draft-edit-actions">
          <Button glow={false} onClick={onClose}>{text('Cancel', 'Hủy')}</Button>
          <Button glow={false} variant="rwa-accept" onClick={submit}>
            {direction.trim()
              ? text('✦ Draft reply', '✦ Soạn câu trả lời')
              : text('✦ Suggest a reply', '✦ Gợi ý câu trả lời')}
          </Button>
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
          <div className="rwa-draft-success-note">
            {text(
              'Used up to ' + (state.historyDepth || 0) + ' recent messages. Review the draft before inserting it.',
              'Đã dùng tối đa ' + (state.historyDepth || 0) + ' tin nhắn gần đây. Hãy kiểm tra trước khi chèn.',
            )}
          </div>
          <div className="rwa-draft-actions">
            <Button glow={false} variant="rwa-accept" className="rwa-draft-primary" onClick={onInsert}>
              {text('✓ Insert into composer', '✓ Chèn vào ô nhập')}
            </Button>
            <Button glow={false} onClick={() => onRewriteAgain?.('another')}>{text('↻ Another version', '↻ Phiên bản khác')}</Button>
            <Button glow={false} onClick={() => onRewriteAgain?.('shorter')}>{text('Shorter', 'Ngắn hơn')}</Button>
            <Button glow={false} onClick={() => onRewriteAgain?.('longer')}>{text('Longer', 'Dài hơn')}</Button>
            <Button glow={false} onClick={copyResult}>{text('Copy', 'Sao chép')}</Button>
            <Button glow={false} onClick={onClose}>{text('Close', 'Đóng')}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

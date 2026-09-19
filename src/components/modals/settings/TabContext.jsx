import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { APIService } from '../../../services/apiService';
import { DOMUtils } from '../../../utils/domUtils';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Button } from '../../ui/Button';
import { useToastStore } from '../../../store/useToastStore';
import { useRuntimeStore } from '../../../store/useRuntimeStore';
import { listVoiceProfiles } from '../../../services/voiceProfileIdentity.js';

const Row = ({ title, note, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
    <div>
      <div style={{ fontSize: '12px', fontWeight: 650 }}>{title}</div>
      {note ? <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '3px', lineHeight: 1.45 }}>{note}</div> : null}
    </div>
    {children}
  </div>
);

export const TabContext = () => {
  const config = usePersistentStore((state) => state.config);
  const updateConfig = usePersistentStore((state) => state.updateConfig);
  const autoProfiles = usePersistentStore((state) => state.autoProfiles);
  const removeAutoProfile = usePersistentStore((state) => state.removeAutoProfile);
  const showToast = useToastStore((state) => state.showToast);
  const selection = useRuntimeStore((state) => state.selection);
  const vi = config.uiLanguage === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [characterLoadError, setCharacterLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const generateControllerRef = useRef(null);
  const chatId = DOMUtils.getChatId();
  const chatVoiceProfiles = useMemo(() => listVoiceProfiles(autoProfiles, chatId), [autoProfiles, chatId]);
  const selectedMessageId = selection?.cid === chatId ? selection?.mid : null;

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    if (!chatId) return () => controller.abort();
    setLoadingChars(true);
    setCharacterLoadError('');
    APIService.fetchChatCharacters(chatId, controller.signal)
      .then((rows) => { if (alive) { setCharacters(rows); setCharacterLoadError(''); } })
      .catch((err) => {
        if (!alive || controller.signal.aborted) return;
        setCharacters([]);
        setCharacterLoadError(err?.message || 'Could not load current-chat characters.');
      })
      .finally(() => { if (alive) setLoadingChars(false); });
    return () => { alive = false; controller.abort(); };
  }, [chatId]);

  useEffect(() => () => generateControllerRef.current?.abort(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? characters.filter((item) => `${item.name}\n${item.id}`.toLowerCase().includes(q)) : characters;
  }, [characters, query]);

  const selected = new Set(Array.isArray(config.charCardIds) ? config.charCardIds : []);
  const toggleCharacter = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    updateConfig({ charCardIds: [...next].slice(0, 8) });
  };

  const generateNow = async () => {
    if (!chatId) {
      showToast(text('No active chat found.', 'Không tìm thấy chat đang hoạt động.'), 'warn');
      return;
    }
    generateControllerRef.current?.abort();
    const controller = new AbortController();
    generateControllerRef.current = controller;
    setGenerating(true);
    try {
      let profileOptions = {
        messageId: selectedMessageId || undefined,
        preferredCharacterIds: config.charCardIds,
        force: true,
      };

      if (selectedMessageId && selection?.cid === chatId) {
        const target = await APIService.resolveVoiceProfileTarget(selection, controller.signal);
        if (controller.signal.aborted) return;
        if (!target?.identity?.key || !target?.targetMessage) {
          showToast(text(
            'The selected Character/Persona identity could not be resolved safely. Re-select exactly one speaker message and try again.',
            'Không thể xác định an toàn Character/Persona đã chọn. Hãy chọn lại đúng một tin nhắn của một người nói rồi thử lại.',
          ), 'warn');
          return;
        }
        profileOptions = {
          ...profileOptions,
          targetMessage: target.targetMessage,
          expectedIdentityKey: target.identity.key,
        };
      }

      const result = await APIService.generateAutoProfile(chatId, controller.signal, profileOptions);
      if (controller.signal.aborted) return;
      if (result?.profile) {
        const kind = result.profile.identityKind === 'persona' ? 'Persona' : 'Char';
        const label = result.profile.identityName || result.profile.name;
        showToast(text(`Voice profile ready: ${kind}: ${label}`, `Hồ sơ giọng đã sẵn sàng: ${kind}: ${label}`), 'ok');
      }
      else if (result?.error) showToast(result.error, 'err');
    } finally {
      if (generateControllerRef.current === controller) {
        generateControllerRef.current = null;
        setGenerating(false);
      }
    }
  };

  return (
    <>
      <div className="rwa-lbl">{text('DEFAULT REWRITE SOURCES', 'NGUỒN VIẾT LẠI MẶC ĐỊNH')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {text(
          'These defaults are shared with the source switches in the popup. Changing either place is saved and applies to future rewrites.',
          'Các mặc định này được dùng chung với các nút nguồn trong popup. Thay đổi ở một trong hai nơi sẽ được lưu và áp dụng cho các lần viết lại sau.',
        )}
      </div>
      <Row title={text('Character', 'Nhân vật')} note={text('Include the resolved Character card when available.', 'Dùng Character card đã xác định khi có.')}>
        <ToggleSwitch checked={config.injectChar} onChange={(value) => updateConfig({ injectChar: value })} />
      </Row>
      <Row title="Persona" note={text('Include the active Persona context when available.', 'Dùng ngữ cảnh Persona hiện tại khi có.')}>
        <ToggleSwitch checked={config.injectUser} onChange={(value) => updateConfig({ injectUser: value })} />
      </Row>
      <Row title="Lore" note={text('Include relevant Lorebook context.', 'Dùng ngữ cảnh Lorebook phù hợp.')}>
        <ToggleSwitch checked={config.injectLorebook} onChange={(value) => updateConfig({ injectLorebook: value })} />
      </Row>
      <Row title={text('Around', 'Xung quanh')} note={text('Include nearby prose around the selected text.', 'Dùng phần văn bản lân cận quanh vùng chọn.')}>
        <ToggleSwitch checked={config.localContextEnabled} onChange={(value) => updateConfig({ localContextEnabled: value })} />
      </Row>
      <Row title={text('History', 'Lịch sử')} note={text('Include previous visible messages up to the History depth shown in the popup.', 'Dùng các tin nhắn hiển thị trước đó theo Độ sâu lịch sử trong popup.')}>
        <ToggleSwitch
          checked={config.historyContextEnabled !== false && (Number(config.contextDepth) || 0) > 0}
          onChange={(value) => updateConfig({
            historyContextEnabled: value,
            ...(value && (Number(config.contextDepth) || 0) <= 0 ? { contextDepth: 1 } : {}),
          })}
        />
      </Row>

      <div className="rwa-lbl" style={{ marginTop: '22px' }}>{text('CONTEXT BEHAVIOR', 'HÀNH VI NGỮ CẢNH')}</div>
      <Row
        title={text('Speaker-aware editing', 'Chỉnh sửa theo vai người nói')}
        note={text('Adds a small role-derived reference note so user prose is not rewritten in character voice and character prose keeps its register.', 'Thêm một ghi chú ngắn theo vai để văn bản của người dùng không bị viết theo giọng nhân vật và văn bản nhân vật vẫn giữ đúng sắc thái.')}
      >
        <ToggleSwitch checked={config.speakerAware} onChange={(value) => updateConfig({ speakerAware: value })} />
      </Row>
      <Row
        title={text('Marinara Extender memory', 'Bộ nhớ Marinara Extender')}
        note={text('Fetches the Extender memory block only when explicitly enabled. Memory is never persisted by Rewrite Assistant.', 'Chỉ lấy khối bộ nhớ Extender khi bạn bật rõ ràng. Rewrite Assistant không lưu bộ nhớ này.')}
      >
        <ToggleSwitch checked={config.useExtenderMemory} onChange={(value) => updateConfig({ useExtenderMemory: value })} />
      </Row>
      <Row
        title={text('Automatic Character / Persona voice profiles', 'Tự động tạo Hồ sơ giọng cho Character / Persona')}
        note={text(
          'OFF by default. When enabled, Rewrite Assistant identifies the exact Character or Persona that owns the selected message and keeps a separate reusable voice profile for each identity in this chat. Character-card or Persona data may be sent to your selected inference provider.',
          'Mặc định TẮT. Khi bật, Rewrite Assistant xác định đúng Character hoặc Persona của tin nhắn đang chọn và lưu Hồ sơ giọng riêng cho từng danh tính trong chat. Dữ liệu Character Card hoặc Persona có thể được gửi tới nhà cung cấp AI bạn đang dùng.',
        )}
      >
        <ToggleSwitch checked={config.autoProfileEnabled} onChange={(value) => updateConfig({ autoProfileEnabled: value })} />
      </Row>
      <Row
        title={text('Draft Reply for the active Persona', 'Soạn trả lời theo Persona hiện tại')}
        note={text(
          'Shows a small ✦ action above Marinara’s composer. It turns a rough idea or partial draft into one unsent Persona reply, streams a preview, and only inserts it into the composer after you approve it. It never presses Send.',
          'Hiện nút ✦ cạnh ô nhập Marinara. Từ một ý tưởng hoặc bản nháp dở, tính năng tạo một lượt trả lời cho Persona, hiển thị bản xem trước theo thời gian thực và chỉ chèn vào ô nhập khi bạn xác nhận. Không tự gửi tin nhắn.',
        )}
      >
        <ToggleSwitch checked={config.draftReplyEnabled !== false} onChange={(value) => updateConfig({ draftReplyEnabled: value })} />
      </Row>
      <Row
        title={text('Draft Reply history depth', 'Số tin nhắn tham chiếu khi soạn trả lời')}
        note={text(
          'How many recent visible chat messages Draft Reply may use. Character names and historical Persona names are preserved when available.',
          'Số tin nhắn gần đây có thể được dùng làm ngữ cảnh khi soạn trả lời. Tên Character và Persona trước đó được giữ nguyên khi Marinara có dữ liệu.',
        )}
      >
        <input
          type="number"
          className="rwa-inp"
          min="1"
          max="30"
          value={config.draftReplyHistoryDepth || 8}
          aria-label={text('Draft Reply history depth', 'Số tin nhắn tham chiếu khi soạn trả lời')}
          onChange={(event) => {
            const parsed = parseInt(event.target.value, 10);
            if (Number.isNaN(parsed)) return;
            updateConfig({ draftReplyHistoryDepth: Math.max(1, Math.min(30, parsed)) });
          }}
          style={{ width: '72px', margin: 0, padding: '6px 8px', fontSize: '12px', textAlign: 'center' }}
        />
      </Row>
      <Row
        title={text('Merge multi-message selections', 'Gộp vùng chọn qua nhiều tin nhắn')}
        note={text('OFF by default. When enabled, selected message spans are rewritten as one passage with tamper-checked section markers, then split back. Invalid markers fall back to sequential mode instead of guessing.', 'Mặc định TẮT. Khi bật, các đoạn đã chọn ở nhiều tin nhắn được xử lý như một khối chung rồi tách trả về đúng từng tin. Nếu dấu phân cách không hợp lệ, hệ thống chuyển sang xử lý tuần tự thay vì đoán.')}
      >
        <ToggleSwitch checked={config.mergeMultiMsg} onChange={(value) => updateConfig({ mergeMultiMsg: value })} />
      </Row>
      <Row
        title={text('Surrounding context words / side', 'Số từ ngữ cảnh gần / mỗi phía')}
        note={text('Applies when Around context is enabled. Controls how much captured prose before and after the selection participates in the rewrite prompt.', 'Áp dụng khi bật Ngữ cảnh gần. Quy định lượng văn bản trước và sau vùng chọn được đưa vào yêu cầu viết lại.')}
      >
        <input
          type="number"
          className="rwa-inp"
          min="50"
          max="400"
          value={config.localContextWords}
          aria-label={text('Surrounding context words per side', 'Số từ ngữ cảnh xung quanh mỗi phía')}
          onChange={(event) => {
            const parsed = parseInt(event.target.value, 10);
            if (Number.isNaN(parsed)) return;
            updateConfig({ localContextWords: Math.max(50, Math.min(400, parsed)) });
          }}
          style={{ width: '72px', margin: 0, padding: '6px 8px', fontSize: '12px', textAlign: 'center' }}
        />
      </Row>

      <div className="rwa-lbl" style={{ marginTop: '22px' }}>{text('CHARACTER CONTEXT PICKER', 'CHỌN CHARACTER THAM CHIẾU')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {text(
          'Assistant messages always use their authoritative sender Character. Selections here are only a fallback for user/narrator/legacy text that has no authoritative Character sender.',
          'Tin nhắn assistant luôn dùng đúng Character đã gửi tin. Lựa chọn ở đây chỉ là phương án dự phòng cho văn bản user/narrator/legacy khi không xác định được Character gửi.',
        )}
      </div>
      <input
        className="rwa-inp"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={loadingChars ? text('Loading characters…', 'Đang tải nhân vật…') : text('Search current-chat characters', 'Tìm nhân vật trong chat hiện tại')}
        aria-label={text('Search current-chat characters', 'Tìm nhân vật trong chat hiện tại')}
        style={{ marginBottom: '8px' }}
      />
      <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
        {filtered.map((character) => (
          <label key={character.id} className="rwa-item" style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={selected.has(character.id)} onChange={() => toggleCharacter(character.id)} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{character.name}</strong>
              <span style={{ display: 'block', fontSize: '9px', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{character.id}</span>
            </span>
          </label>
        ))}
        {!loadingChars && characterLoadError ? <div role="alert" style={{ fontSize: '10px', color: '#ff9b9b' }}>{text('Character loading failed:', 'Tải nhân vật thất bại:')} {characterLoadError}</div> : null}
        {!loadingChars && !characterLoadError && filtered.length === 0 ? <div style={{ fontSize: '10px', opacity: 0.6 }}>{text('No matching current-chat characters.', 'Không có nhân vật nào khớp trong chat hiện tại.')}</div> : null}
      </div>
      {selected.size ? (
        <Button glow={false} onClick={() => updateConfig({ charCardIds: [] })} style={{ width: '100%', marginBottom: '16px' }}>
          {text(`Clear explicit character selection (${selected.size})`, `Xóa lựa chọn nhân vật (${selected.size})`)}
        </Button>
      ) : null}

      <div className="rwa-lbl" style={{ marginTop: '20px' }}>{text('VOICE PROFILES', 'HỒ SƠ GIỌNG')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {selectedMessageId
          ? text(
            'Generate now uses the Character or Persona attached to the message you selected before opening Settings.',
            'Tạo ngay sẽ dùng đúng Character hoặc Persona của tin nhắn đã chọn trước khi mở Cài đặt.',
          )
          : text(
            'With no selected message, manual generation is limited to one explicitly selected Character (or the only Character in the chat) so group-chat identities are never guessed.',
            'Nếu chưa chọn tin nhắn, việc tạo thủ công chỉ dùng một Character đã chọn rõ ràng hoặc Character duy nhất trong chat, tránh đoán sai trong chat nhóm.',
          )}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <Button glow={false} onClick={generateNow} disabled={!chatId || generating} style={{ flex: 1 }}>
          {generating
            ? text('Generating…', 'Đang tạo…')
            : selectedMessageId
              ? text('Generate for selected identity', 'Tạo cho danh tính đã chọn')
              : text('Generate Character profile', 'Tạo hồ sơ Character')}
        </Button>
        <Button
          glow={false}
          variant="rwa-dng"
          disabled={!chatId || chatVoiceProfiles.length === 0}
          onClick={() => { if (chatId) removeAutoProfile(chatId); }}
          style={{ flex: 1 }}
        >
          {text('Remove all voice profiles', 'Xóa tất cả Hồ sơ giọng')}
        </Button>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        {chatVoiceProfiles.map((profile) => {
          const kind = profile.identityKind === 'persona' ? 'Persona' : (profile.identityKind === 'legacy' ? 'Legacy' : 'Char');
          const identity = profile.identityName || profile.name;
          return (
            <div key={profile.identityKey} className="rwa-item" style={{ alignItems: 'center', gap: '8px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {kind}: {identity}
                </strong>
                <span style={{ display: 'block', fontSize: '9px', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.legacy
                    ? text('Legacy chat-wide profile — kept for safety but never auto-matched.', 'Hồ sơ cũ dùng cho toàn chat — vẫn được giữ để an toàn nhưng không tự ghép với Character/Persona.')
                    : profile.name}
                </span>
              </div>
              <Button
                glow={false}
                variant="rwa-dng"
                onClick={() => removeAutoProfile(chatId, profile.identityKey)}
                style={{ flex: '0 0 auto', padding: '5px 9px' }}
              >
                {text('Remove', 'Xóa')}
              </Button>
            </div>
          );
        })}
        {!chatVoiceProfiles.length ? (
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            {text('No Voice Profiles stored for this chat yet.', 'Chat này chưa lưu Hồ sơ giọng nào.')}
          </div>
        ) : null}
      </div>
    </>
  );
};

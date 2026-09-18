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
      const result = await APIService.generateAutoProfile(chatId, controller.signal, {
        messageId: selectedMessageId || undefined,
        preferredCharacterIds: config.charCardIds,
        force: true,
      });
      if (controller.signal.aborted) return;
      if (result?.profile) {
        const kind = result.profile.identityKind === 'persona' ? 'Persona' : 'Char';
        const label = result.profile.identityName || result.profile.name;
        showToast(text(`Voice profile ready: ${kind}: ${label}`, `Voice profile đã sẵn sàng: ${kind}: ${label}`), 'ok');
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
      <div className="rwa-lbl">{text('CONTEXT BEHAVIOR', 'HÀNH VI NGỮ CẢNH')}</div>
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
        title={text('Automatic Character / Persona voice profiles', 'Tự động tạo Voice Profile cho Character / Persona')}
        note={text(
          'OFF by default. When enabled, Rewrite Assistant identifies the exact Character or Persona that owns the selected message and keeps a separate reusable voice profile for each identity in this chat. Character-card or Persona data may be sent to your selected inference provider.',
          'Mặc định TẮT. Khi bật, Rewrite Assistant xác định đúng Character hoặc Persona của tin nhắn đang chọn và lưu Voice Profile riêng cho từng danh tính trong chat. Dữ liệu Character Card hoặc Persona có thể được gửi tới provider đang chọn.',
        )}
      >
        <ToggleSwitch checked={config.autoProfileEnabled} onChange={(value) => updateConfig({ autoProfileEnabled: value })} />
      </Row>
      <Row
        title={text('Merge multi-message selections', 'Gộp lựa chọn qua nhiều tin nhắn')}
        note={text('OFF by default. When enabled, selected message spans are rewritten as one passage with tamper-checked section markers, then split back. Invalid markers fall back to sequential mode instead of guessing.', 'Mặc định TẮT. Khi bật, các đoạn ở nhiều tin nhắn được viết lại như một đoạn chung với marker được kiểm tra, sau đó tách trả lại. Nếu marker không hợp lệ, hệ thống chuyển về chế độ tuần tự thay vì đoán.')}
      >
        <ToggleSwitch checked={config.mergeMultiMsg} onChange={(value) => updateConfig({ mergeMultiMsg: value })} />
      </Row>
      <Row
        title={text('Surrounding context words / side', 'Số từ ngữ cảnh xung quanh / mỗi phía')}
        note={text('Applies when Around context is enabled. Controls how much captured prose before and after the selection participates in the rewrite prompt.', 'Áp dụng khi bật ngữ cảnh Xung quanh. Kiểm soát lượng văn bản trước và sau vùng chọn được đưa vào prompt viết lại.')}
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

      <div className="rwa-lbl" style={{ marginTop: '22px' }}>{text('CHARACTER CONTEXT PICKER', 'CHỌN NGỮ CẢNH NHÂN VẬT')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {text('Leave all unchecked to use the authoritative sender character for assistant messages. Selecting characters here explicitly overrides that fallback for Character context and Extender memory.', 'Để trống tất cả để dùng nhân vật người gửi chính xác của tin nhắn assistant. Việc chọn nhân vật tại đây sẽ ghi đè fallback đó cho ngữ cảnh Character và bộ nhớ Extender.')}
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

      <div className="rwa-lbl" style={{ marginTop: '20px' }}>{text('VOICE PROFILES', 'VOICE PROFILE')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {selectedMessageId
          ? text(
            'Generate now uses the Character or Persona attached to the message you selected before opening Settings.',
            'Tạo ngay sẽ dùng đúng Character hoặc Persona của tin nhắn bạn đã chọn trước khi mở Cài đặt.',
          )
          : text(
            'With no selected message, manual generation is limited to one explicitly selected Character (or the only Character in the chat) so group-chat identities are never guessed.',
            'Khi không có tin nhắn được chọn, tạo thủ công chỉ dùng một Character được chọn rõ ràng (hoặc Character duy nhất trong chat) để không đoán sai trong group chat.',
          )}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <Button glow={false} onClick={generateNow} disabled={!chatId || generating} style={{ flex: 1 }}>
          {generating
            ? text('Generating…', 'Đang tạo…')
            : selectedMessageId
              ? text('Generate for selected identity', 'Tạo cho danh tính đang chọn')
              : text('Generate Character profile', 'Tạo profile Character')}
        </Button>
        <Button
          glow={false}
          variant="rwa-dng"
          disabled={!chatId || chatVoiceProfiles.length === 0}
          onClick={() => { if (chatId) removeAutoProfile(chatId); }}
          style={{ flex: 1 }}
        >
          {text('Remove all voice profiles', 'Xóa tất cả Voice Profile')}
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
                    ? text('Legacy chat-wide profile — kept for safety but never auto-matched.', 'Profile cũ theo toàn chat — được giữ lại an toàn nhưng không tự ghép vào Character/Persona.')
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
            {text('No Voice Profiles stored for this chat yet.', 'Chat này chưa có Voice Profile nào được lưu.')}
          </div>
        ) : null}
      </div>
    </>
  );
};

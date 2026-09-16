import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { APIService } from '../../../services/apiService';
import { DOMUtils } from '../../../utils/domUtils';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Button } from '../../ui/Button';
import { useToastStore } from '../../../store/useToastStore';

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
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [characterLoadError, setCharacterLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const generateControllerRef = useRef(null);
  const chatId = DOMUtils.getChatId();

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
      showToast('No active chat found.', 'warn');
      return;
    }
    generateControllerRef.current?.abort();
    const controller = new AbortController();
    generateControllerRef.current = controller;
    setGenerating(true);
    try {
      const result = await APIService.generateAutoProfile(chatId, controller.signal, { preferredCharacterIds: config.charCardIds });
      if (controller.signal.aborted) return;
      if (result?.profile) showToast(`Auto-profile ready: ${result.profile.name}`, 'ok');
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
      <div className="rwa-lbl">CONTEXT BEHAVIOR</div>
      <Row
        title="Speaker-aware editing"
        note="Adds a small role-derived reference note so user prose is not rewritten in character voice and character prose keeps its register."
      >
        <ToggleSwitch checked={config.speakerAware} onChange={(value) => updateConfig({ speakerAware: value })} />
      </Row>
      <Row
        title="Marinara Extender memory"
        note="Fetches the Extender memory block only when explicitly enabled. Memory is never persisted by Rewrite Assistant."
      >
        <ToggleSwitch checked={config.useExtenderMemory} onChange={(value) => updateConfig({ useExtenderMemory: value })} />
      </Row>
      <Row
        title="Automatic character voice profile"
        note="OFF by default. When enabled, character-card data may be sent to your currently selected inference provider to generate a reusable chat-specific rewrite profile."
      >
        <ToggleSwitch checked={config.autoProfileEnabled} onChange={(value) => updateConfig({ autoProfileEnabled: value })} />
      </Row>
      <Row
        title="Merge multi-message selections"
        note="OFF by default. When enabled, selected message spans are rewritten as one passage with tamper-checked section markers, then split back. Invalid markers fall back to sequential mode instead of guessing."
      >
        <ToggleSwitch checked={config.mergeMultiMsg} onChange={(value) => updateConfig({ mergeMultiMsg: value })} />
      </Row>

      <div className="rwa-lbl" style={{ marginTop: '22px' }}>CHARACTER CONTEXT PICKER</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        Leave all unchecked to use the authoritative sender character for assistant messages. Selecting characters here explicitly overrides that fallback for Character context and Extender memory.
      </div>
      <input
        className="rwa-inp"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={loadingChars ? 'Loading characters…' : 'Search current-chat characters'}
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
        {!loadingChars && characterLoadError ? <div role="alert" style={{ fontSize: '10px', color: '#ff9b9b' }}>Character loading failed: {characterLoadError}</div> : null}
        {!loadingChars && !characterLoadError && filtered.length === 0 ? <div style={{ fontSize: '10px', opacity: 0.6 }}>No matching current-chat characters.</div> : null}
      </div>
      {selected.size ? (
        <Button className="rwa-glow-button" onClick={() => updateConfig({ charCardIds: [] })} style={{ width: '100%', marginBottom: '16px' }}>
          Clear explicit character selection ({selected.size})
        </Button>
      ) : null}

      <div className="rwa-lbl" style={{ marginTop: '20px' }}>AUTO-PROFILE</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button className="rwa-glow-button" onClick={generateNow} disabled={!chatId || generating} style={{ flex: 1 }}>
          {generating ? 'Generating…' : 'Generate for current chat'}
        </Button>
        <Button
          className="rwa-glow-button"
          variant="rwa-dng"
          disabled={!chatId || !autoProfiles?.[chatId]}
          onClick={() => { if (chatId) removeAutoProfile(chatId); }}
          style={{ flex: 1 }}
        >
          Remove current auto-profile
        </Button>
      </div>
    </>
  );
};

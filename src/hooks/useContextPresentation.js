import { useMemo } from 'react';

export function useContextPresentation({
  activeRole,
  config,
  tokenInfo,
  voiceIdentity = null,
  text,
}) {
  const characterNameText = Array.isArray(tokenInfo.identities?.characterNames)
    ? tokenInfo.identities.characterNames.join(' · ')
    : '';
  const personaNameText = Array.isArray(tokenInfo.identities?.personaNames)
    ? tokenInfo.identities.personaNames.join(' · ')
    : '';
  const targetCharacterName = voiceIdentity?.kind === 'character' ? String(voiceIdentity.name || '').trim() : '';
  const targetPersonaName = voiceIdentity?.kind === 'persona' ? String(voiceIdentity.name || '').trim() : '';
  const characterLabel = targetCharacterName
    ? 'Char: ' + targetCharacterName
    : (characterNameText ? 'Char: ' + characterNameText : text('Character', 'Nhân vật'));
  const personaLabel = targetPersonaName
    ? 'Persona: ' + targetPersonaName
    : (personaNameText ? 'Persona: ' + personaNameText : 'Persona');

  const radar = useMemo(() => {
    if (config.freeMode) return { radarText: text('✨ Free Mode', '✨ Chế độ tự do'), radarColor: 'var(--rwa2-brand)' };
    if (activeRole === 'user') return {
      radarText: targetPersonaName
        ? '✍️ Persona: ' + targetPersonaName
        : (personaNameText ? '✍️ Persona: ' + personaNameText : text('✍️ User Persona', '✍️ Persona người dùng')),
      radarColor: 'var(--rwa2-positive)',
    };
    if (activeRole === 'assistant') return {
      radarText: targetCharacterName
        ? '🤖 Char: ' + targetCharacterName
        : (characterNameText ? '🤖 Char: ' + characterNameText : text('🤖 Character Card', '🤖 Thẻ nhân vật')),
      radarColor: 'var(--rwa2-brand)',
    };
    return { radarText: text('❓ System Context', '❓ Ngữ cảnh hệ thống'), radarColor: 'var(--rwa2-text-2)' };
  }, [activeRole, characterNameText, config.freeMode, personaNameText, targetCharacterName, targetPersonaName, text]);

  const contextSources = useMemo(() => {
    const freeModeBlocked = !!config.freeMode;
    const source = (key, label, detail, enabled, disabled = false) => ({
      key,
      label,
      detail,
      enabled: disabled ? false : !!enabled,
      disabled,
    });

    const sources = [
      source('character', text('Character', 'Nhân vật'), characterLabel, config.injectChar, freeModeBlocked),
      source('persona', 'Persona', personaLabel, config.injectUser, freeModeBlocked),
      source('lore', 'Lore', 'Lore', config.injectLorebook, freeModeBlocked),
      source('surrounding', text('Around', 'Xung quanh'), text('Nearby context around the selection', 'Ngữ cảnh gần vùng chọn'), config.localContextEnabled),
      source(
        'history',
        text('History', 'Lịch sử'),
        text('History depth: ', 'Độ sâu lịch sử: ') + Math.max(1, Number(config.contextDepth) || 1),
        config.historyContextEnabled !== false && (Number(config.contextDepth) || 0) > 0,
      ),
    ];

    return sources;
  }, [
    characterLabel,
    config.contextDepth,
    config.freeMode,
    config.injectChar,
    config.injectLorebook,
    config.injectUser,
    config.localContextEnabled,
    personaLabel,
    text,
  ]);

  return { ...radar, contextSources, characterLabel, personaLabel };
}

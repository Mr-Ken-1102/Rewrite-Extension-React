import { useMemo } from 'react';

export function useContextPresentation({ activeRole, config, tokenInfo, voiceIdentity = null, text }) {
  const characterNameText = Array.isArray(tokenInfo.identities?.characterNames)
    ? tokenInfo.identities.characterNames.join(' · ')
    : '';
  const personaNameText = Array.isArray(tokenInfo.identities?.personaNames)
    ? tokenInfo.identities.personaNames.join(' · ')
    : '';
  const targetCharacterName = voiceIdentity?.kind === 'character' ? String(voiceIdentity.name || '').trim() : '';
  const targetPersonaName = voiceIdentity?.kind === 'persona' ? String(voiceIdentity.name || '').trim() : '';
  const characterLabel = targetCharacterName
    ? `Char: ${targetCharacterName}`
    : (characterNameText ? `Char: ${characterNameText}` : text('Character', 'Nhân vật'));
  const personaLabel = targetPersonaName
    ? `Persona: ${targetPersonaName}`
    : (personaNameText ? `Persona: ${personaNameText}` : 'Persona');

  const radar = useMemo(() => {
    if (config.freeMode) return { radarText: text('✨ Free Mode', '✨ Chế độ tự do'), radarColor: 'var(--rwa2-brand)' };
    if (activeRole === 'user') return {
      radarText: targetPersonaName
        ? `✍️ Persona: ${targetPersonaName}`
        : (personaNameText ? `✍️ Persona: ${personaNameText}` : text('✍️ User Persona', '✍️ Persona người dùng')),
      radarColor: 'var(--rwa2-positive)',
    };
    if (activeRole === 'assistant') return {
      radarText: targetCharacterName
        ? `🤖 Char: ${targetCharacterName}`
        : (characterNameText ? `🤖 Char: ${characterNameText}` : text('🤖 Character Card', '🤖 Thẻ nhân vật')),
      radarColor: 'var(--rwa2-brand)',
    };
    return { radarText: text('❓ System Context', '❓ Ngữ cảnh hệ thống'), radarColor: 'var(--rwa2-text-2)' };
  }, [activeRole, characterNameText, config.freeMode, personaNameText, targetCharacterName, targetPersonaName, text]);

  const contextSources = useMemo(() => {
    const sources = [];
    if (!config.freeMode && config.injectChar) {
      sources.push({ key: 'character', label: text('Character', 'Nhân vật'), detail: characterLabel });
    }
    if (!config.freeMode && config.injectUser) {
      sources.push({ key: 'persona', label: 'Persona', detail: personaLabel });
    }
    if (!config.freeMode && config.injectLorebook) sources.push({ key: 'lore', label: 'Lore', detail: 'Lore' });
    if (!config.freeMode && config.useExtenderMemory) {
      sources.push({ key: 'memory', label: text('Memory', 'Bộ nhớ'), detail: text('Extender memory', 'Bộ nhớ Extender') });
    }
    if (config.localContextEnabled) {
      sources.push({ key: 'surrounding', label: text('Around', 'Xung quanh'), detail: text('Nearby context around the selection', 'Ngữ cảnh gần vùng chọn') });
    }
    if ((config.contextDepth || 0) > 0) {
      sources.push({
        key: 'history',
        label: text('History', 'Lịch sử'),
        detail: text(`History depth: ${config.contextDepth}`, `Độ sâu lịch sử: ${config.contextDepth}`),
      });
    }
    return sources;
  }, [
    characterLabel,
    config.contextDepth,
    config.freeMode,
    config.injectChar,
    config.injectLorebook,
    config.injectUser,
    config.localContextEnabled,
    config.useExtenderMemory,
    personaLabel,
    text,
  ]);

  return { ...radar, contextSources };
}

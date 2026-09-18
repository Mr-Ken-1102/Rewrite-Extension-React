import { useMemo } from 'react';

export function useContextPresentation({ activeRole, config, tokenInfo, text }) {
  const characterNames = tokenInfo.identities?.characterNames || [];
  const personaNames = tokenInfo.identities?.personaNames || [];
  const characterLabel = characterNames.length
    ? `Char: ${characterNames.join(' · ')}`
    : text('Character', 'Nhân vật');
  const personaLabel = personaNames.length
    ? `Persona: ${personaNames.join(' · ')}`
    : 'Persona';

  const radar = useMemo(() => {
    if (config.freeMode) return { radarText: text('✨ Free Mode', '✨ Chế độ tự do'), radarColor: 'var(--rwa2-brand)' };
    if (activeRole === 'user') return {
      radarText: personaNames.length ? `✍️ Persona: ${personaNames.join(' · ')}` : text('✍️ User Persona', '✍️ Persona người dùng'),
      radarColor: 'var(--rwa2-positive)',
    };
    if (activeRole === 'assistant') return {
      radarText: characterNames.length ? `🤖 Char: ${characterNames.join(' · ')}` : text('🤖 Character Card', '🤖 Thẻ nhân vật'),
      radarColor: 'var(--rwa2-brand)',
    };
    return { radarText: text('❓ System Context', '❓ Ngữ cảnh hệ thống'), radarColor: 'var(--rwa2-text-2)' };
  }, [activeRole, characterNames, config.freeMode, personaNames, text]);

  const contextSources = useMemo(() => {
    const sources = [];
    if (!config.freeMode && config.injectChar) sources.push({ key: 'character', label: characterLabel });
    if (!config.freeMode && config.injectUser) sources.push({ key: 'persona', label: personaLabel });
    if (!config.freeMode && config.injectLorebook) sources.push({ key: 'lore', label: 'Lore' });
    if (!config.freeMode && config.useExtenderMemory) sources.push({ key: 'memory', label: text('Memory', 'Bộ nhớ') });
    if (config.localContextEnabled) sources.push({ key: 'surrounding', label: text('Around', 'Xung quanh') });
    if ((config.contextDepth || 0) > 0) sources.push({ key: 'history', label: text('History', 'Lịch sử') });
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

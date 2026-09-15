import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { apiJson, fetchJson, SIDECAR_PROMPT_MAX_CHARS } from '../../services/marinaraBridge';

const MAX_ARCHITECT_INPUT_CHARS = 5_000;

export const AIArchitectModal = ({ onClose, onDone }) => {
  const { config, profiles, updateProfiles } = usePersistentStore();
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [generatedName, setGeneratedName] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleGenerate = async () => {
    const description = inputValue.trim().slice(0, MAX_ARCHITECT_INPUT_CHARS);
    if (!description) return;

    setIsGenerating(true);
    setStatusText('AI engine structural modeling in progress...');

    const systemPrompt = 'Output ONLY valid JSON (no markdown fences) with keys "name" (1-3 words) and "prompt" (starts with "Rewrite the following text").';
    const userPrompt = `Create a rewrite style for: ${description}`;

    try {
      let resultText = '';
      const model = typeof config.ollamaModel === 'string' ? config.ollamaModel.trim() : '';

      if (model) {
        const url = (config.ollamaUrl || 'http://127.0.0.1:11434/v1').replace(/\/$/, '');
        const data = await fetchJson(
          `${url}/chat/completions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.7,
            }),
          },
          25_000,
        );
        if (data?.error) throw new Error(data.error.message || data.error);
        resultText = data?.choices?.[0]?.message?.content || '';
      } else {
        const result = await apiJson('/sidecar/tracker', {
          method: 'POST',
          body: {
            systemPrompt: systemPrompt.slice(0, SIDECAR_PROMPT_MAX_CHARS),
            userPrompt: userPrompt.slice(0, SIDECAR_PROMPT_MAX_CHARS),
          },
        });
        resultText = result?.result || '';
      }

      if (!resultText.trim()) throw new Error('Received empty modeling response');

      let text = resultText.trim();
      const fence = String.fromCharCode(96, 96, 96);
      if (text.startsWith(fence)) {
        text = text.replace(new RegExp(`^${fence}(?:json)?`, 'i'), '');
        text = text.replace(new RegExp(`${fence}$`), '');
      }
      text = text.trim();

      const dataJSON = JSON.parse(text);
      if (!dataJSON.name || !dataJSON.prompt) {
        throw new Error("JSON payload missing 'name' or 'prompt' attributes");
      }

      setGeneratedName(String(dataJSON.name).slice(0, 80));
      setGeneratedPrompt(String(dataJSON.prompt).slice(0, 5_000));
      setHasResult(true);
      setStatusText('');
    } catch (error) {
      setStatusText(`Error modeling: ${error.message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStyle = () => {
    const name = generatedName.trim().slice(0, 80);
    const prompt = generatedPrompt.trim().slice(0, 5_000);
    if (!name || !prompt) return;

    const newProfiles = [...profiles];
    newProfiles.push({ id: String(Date.now()), name, prompt, order: newProfiles.length });
    updateProfiles(newProfiles);
    onClose();
    onDone?.();
  };

  const handleGlowMouseMove = (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest('.rwa-glow-button');
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--y', `${event.clientY - rect.top}px`);
    }
  };

  return (
    <div onMouseMove={handleGlowMouseMove}>
      <Modal title="✨ AI Prompt Architect" onClose={onClose} width="640px">
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', lineHeight: '1.55' }}>
          State the desired rewrite tone. System automatically parses and structures a professional preset name and prompt logic.
        </div>

        <textarea
          className="rwa-inp"
          placeholder='e.g., "A cynical, old, grumbling sailor who uses heavy nautical metaphors"'
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={isGenerating}
          maxLength={MAX_ARCHITECT_INPUT_CHARS}
          style={{ height: '120px', resize: 'vertical', borderRadius: '12px' }}
        />

        <div style={{ display: hasResult ? 'block' : 'none' }}>
          <div className="rwa-lbl">Generated Preset Name</div>
          <input
            type="text"
            className="rwa-inp"
            value={generatedName}
            onChange={(event) => setGeneratedName(event.target.value)}
            disabled={isGenerating}
            maxLength={80}
          />

          <div className="rwa-lbl">Generated Instruction Prompt</div>
          <textarea
            className="rwa-inp"
            value={generatedPrompt}
            onChange={(event) => setGeneratedPrompt(event.target.value)}
            disabled={isGenerating}
            maxLength={5000}
            style={{ height: '200px', resize: 'vertical', fontSize: '13px', borderRadius: '12px' }}
          />
        </div>

        <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', minHeight: '16px', marginBottom: '8px' }}>
          {statusText}
        </div>

        <div className="rwa-foot">
          <Button
            className="rwa-glow-button"
            variant="rwa-replace"
            onClick={handleAddStyle}
            style={{ display: hasResult ? 'inline-flex' : 'none', flex: '1 1 0%', justifyContent: 'center' }}
          >
            Add Style
          </Button>

          <Button
            className="rwa-glow-button"
            variant="rwa-accept"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{ flex: '1 1 0%', color: hasResult ? 'white' : undefined }}
          >
            {isGenerating ? '...' : (hasResult ? 'ReGenerate' : 'Generate')}
          </Button>

          <Button className="rwa-glow-button" onClick={onClose} style={{ flex: '1 1 0%' }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

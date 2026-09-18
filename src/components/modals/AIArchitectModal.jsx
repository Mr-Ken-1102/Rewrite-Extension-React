import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { APIService } from '../../services/apiService';
import { DOMUtils } from '../../utils/domUtils';

const ARCHITECT_SYSTEM_PROMPT = `You design concise rewrite presets for a writing assistant.
Return ONLY one valid JSON object with exactly these string keys:
{"name":"1-3 word preset name","prompt":"Rewrite the following text ..."}
The prompt must be a direct editing instruction, must begin with "Rewrite the following text", and must not contain markdown fences.`;

function parseArchitectPayload(raw) {
  let text = String(raw || '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) text = text.slice(first, last + 1);

  const data = JSON.parse(text);
  const name = String(data?.name || '').trim().slice(0, 80);
  let prompt = String(data?.prompt || '').trim().slice(0, 5000);
  if (!name || !prompt) throw new Error("JSON payload is missing 'name' or 'prompt'.");
  if (!/^rewrite the following text\b/i.test(prompt)) {
    prompt = `Rewrite the following text ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`;
  }
  return { name, prompt };
}

export const AIArchitectModal = ({ onClose, onDone }) => {
  const profiles = usePersistentStore((state) => state.profiles);
  const updateProfiles = usePersistentStore((state) => state.updateProfiles);

  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [generatedName, setGeneratedName] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [statusText, setStatusText] = useState('');
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const handleGenerate = async () => {
    const description = inputValue.trim();
    if (!description || isGenerating) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsGenerating(true);
    setStatusText('AI engine structural modeling in progress...');

    try {
      const response = await APIService.runInference(
        ARCHITECT_SYSTEM_PROMPT,
        `Create a rewrite style for this request:\n<request>\n${description.replace(/<\/?request>/gi, '[request]')}\n</request>`,
        controller.signal,
        { chatId: DOMUtils.getChatId() || '' },
      );
      if (response?.aborted || controller.signal.aborted) return;
      if (response?.error) throw new Error(response.error);

      const parsed = parseArchitectPayload(response?.result);
      setGeneratedName(parsed.name);
      setGeneratedPrompt(parsed.prompt);
      setHasResult(true);
      setStatusText('');
    } catch (err) {
      if (!controller.signal.aborted) setStatusText(`Error modeling: ${err?.message || String(err)}`);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setIsGenerating(false);
    }
  };

  const handleClose = () => {
    requestRef.current?.abort();
    onClose();
  };

  const handleAddStyle = () => {
    const name = generatedName.trim().slice(0, 80);
    const prompt = generatedPrompt.trim().slice(0, 5000);
    if (!name || !prompt) return;

    const next = [...profiles, {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      prompt,
      order: profiles.length,
    }];
    updateProfiles(next);
    handleClose();
    onDone?.();
  };

  return (
    <Modal title="✨ AI Prompt Architect" onClose={handleClose} width="640px" animate={false}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', lineHeight: '1.55' }}>
        Describe the rewrite tone or editing behavior. The architect uses the same model connection configured in API &amp; LLM.
      </div>

      <textarea
        className="rwa-inp"
        aria-label="Desired rewrite style"
        placeholder='e.g., "A cynical, old, grumbling sailor who uses heavy nautical metaphors"'
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        disabled={isGenerating}
        maxLength={4000}
        style={{ height: '120px', resize: 'vertical', borderRadius: '12px' }}
      />

      {hasResult && (
        <div>
          <div className="rwa-lbl">Generated Preset Name</div>
          <input
            type="text"
            className="rwa-inp"
            aria-label="Generated preset name"
            value={generatedName}
            maxLength={80}
            onChange={(event) => setGeneratedName(event.target.value)}
            disabled={isGenerating}
          />

          <div className="rwa-lbl">Generated Instruction Prompt</div>
          <textarea
            className="rwa-inp"
            aria-label="Generated instruction prompt"
            value={generatedPrompt}
            maxLength={5000}
            onChange={(event) => setGeneratedPrompt(event.target.value)}
            disabled={isGenerating}
            style={{ height: '200px', resize: 'vertical', fontSize: '13px', borderRadius: '12px' }}
          />
        </div>
      )}

      <div role="status" aria-live="polite" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', minHeight: '16px', marginBottom: '8px' }}>
        {statusText}
      </div>

      <div className="rwa-foot">
        {hasResult && (
          <Button glow={false} variant="rwa-replace" onClick={handleAddStyle} disabled={isGenerating} style={{ flex: '1 1 0%', justifyContent: 'center' }}>
            Add Style
          </Button>
        )}
        <Button glow={false} variant="rwa-accept" onClick={handleGenerate} disabled={isGenerating || !inputValue.trim()} style={{ flex: '1 1 0%', color: hasResult ? 'white' : undefined }}>
          {isGenerating ? '...' : (hasResult ? 'ReGenerate' : 'Generate')}
        </Button>
        <Button glow={false} onClick={handleClose} style={{ flex: '1 1 0%' }}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { APIService } from '../../services/apiService';
import { unwrapMatchingOuterQuotes } from '../../utils/textSanitizers';

const REFINE_SYSTEM = 'Turn a rough rewrite request into one clear, specific editing instruction. Preserve the user intent. Start with a verb. Output only one instruction sentence or short paragraph, with no quotes, preamble, markdown fence, or alternatives.';

export const CustomPromptModal = ({ onClose, onRunRewrite, onSaveAsProfile }) => {
  const { customs, updateCustoms } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [promptValue, setPromptValue] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const textareaRef = useRef(null);
  const refineControllerRef = useRef(null);

  useEffect(() => () => refineControllerRef.current?.abort(), []);

  const handleClose = () => {
    refineControllerRef.current?.abort();
    onClose();
  };

  const handleRun = () => {
    const v = promptValue.trim();
    if (!v) {
      showToast('⚠️ Please enter your custom prompt first!', 'warn');
      textareaRef.current?.focus();
      return;
    }

    const newCustoms = [...customs];
    if (!newCustoms.includes(v)) {
      newCustoms.unshift(v);
      if (newCustoms.length > 8) newCustoms.length = 8;
      updateCustoms(newCustoms);
    }

    handleClose();
    onRunRewrite({ id: 'custom', name: 'Custom', order: -1, prompt: v });
  };

  const handleSaveAsProfile = () => {
    const value = promptValue.trim();
    if (!value) {
      showToast('⚠️ Please enter a custom prompt first!', 'warn');
      textareaRef.current?.focus();
      return;
    }
    const next = [...customs];
    if (!next.includes(value)) {
      next.unshift(value);
      if (next.length > 8) next.length = 8;
      updateCustoms(next);
    }
    refineControllerRef.current?.abort();
    onSaveAsProfile?.(value);
  };

  const handleRefine = async () => {
    const rough = promptValue.trim();
    if (!rough || isRefining) {
      if (!rough) textareaRef.current?.focus();
      return;
    }

    refineControllerRef.current?.abort();
    const controller = new AbortController();
    refineControllerRef.current = controller;
    setIsRefining(true);
    try {
      const response = await APIService.runInference(
        REFINE_SYSTEM,
        `Rough rewrite request:\n<request>\n${rough.replace(/<\/?request>/gi, '[request]')}\n</request>`,
        controller.signal,
      );
      if (controller.signal.aborted || response?.aborted) return;
      if (response?.error) throw new Error(response.error);
      const refined = unwrapMatchingOuterQuotes(response?.result).slice(0, 5000);
      if (!refined) throw new Error('The model returned an empty refinement.');
      setPromptValue(refined);
      showToast('✓ Custom prompt refined', 'ok');
    } catch (err) {
      if (!controller.signal.aborted) showToast(`✕ Refine failed: ${err?.message || String(err)}`, 'err');
    } finally {
      if (refineControllerRef.current === controller) refineControllerRef.current = null;
      if (!controller.signal.aborted) setIsRefining(false);
    }
  };

  const handleDeleteCustom = (index) => {
    const newCustoms = [...customs];
    newCustoms.splice(index, 1);
    updateCustoms(newCustoms);
  };

  return (
    <Modal title="✉️ Compile Custom Prompt" onClose={handleClose} width="640px">
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', lineHeight: '1.5' }}>
        Describe detailed rewrite instructions. Prompt registers automatically in the history log for reuse. Refine uses the same model source configured in API &amp; LLM.
      </div>

      <textarea
        ref={textareaRef}
        className="rwa-inp"
        placeholder='e.g., "Make Sarah sound incredibly furious, stammering under her breath, and expand prose by 30%"'
        value={promptValue}
        onChange={(event) => setPromptValue(event.target.value)}
        maxLength={5000}
        aria-label="Custom rewrite instructions"
        disabled={isRefining}
        style={{ height: '140px', resize: 'vertical', marginBottom: '10px', fontSize: '13px', borderRadius: '12px' }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <Button glow={false} onClick={handleRefine} disabled={isRefining || !promptValue.trim()}>
          {isRefining ? 'Refining…' : '✨ Refine with AI'}
        </Button>
      </div>

      {customs.length > 0 && (
        <>
          <div className="rwa-lbl">History Log (Custom Prompts)</div>
          <div style={{ maxHeight: '130px', overflowY: 'auto', marginBottom: '10px' }}>
            {customs.map((custom, index) => (
              <div
                key={`${custom.slice(0, 80)}-${index}`}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', marginBottom: '6px', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div style={{ flex: '1', fontSize: '11.5px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.45' }}>
                  {custom}
                </div>

                <Button glow={false} onClick={() => setPromptValue(custom)} style={{ flexShrink: 0, fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}>
                  Use
                </Button>

                <Button glow={false} variant="rwa-dng" onClick={() => handleDeleteCustom(index)} aria-label={`Delete saved custom prompt ${index + 1}`} style={{ flexShrink: 0, fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="rwa-foot">
        <Button glow={false} variant="rwa-accept" onClick={handleRun} disabled={isRefining} style={{ flex: 1 }}>
          Run
        </Button>
        <Button glow={false} onClick={handleSaveAsProfile} disabled={isRefining || !promptValue.trim()} style={{ flex: 1 }}>
          Save as Profile
        </Button>
        <Button glow={false} onClick={handleClose} style={{ flex: 1 }}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';

const ENDPOINTS = {
  tracker: "/sidecar/tracker",
  chats: "/chats",
  chars: "/characters",
  personas: "/personas"
};

// [BẢN VÁ TỐI THƯỢNG]: Mở rộng Selector để tương thích 100% với SillyTavern và các UI khác
const SELECTORS = {
  message: '.mari-message, .message, .mes, [data-message-id]',
  userMessage: '.message-user, .mes_user, [is_user="true"], [data-is-user="true"]',
  avatar: '.user-avatar'
};

const deadPersonasCache = new Set();

export class APIService {
  
  static fetchWithTimeout(url, options, timeoutMs = 25000) {
    const controller = new AbortController();
    if (!options.signal) options.signal = controller.signal;
    
    const marinara = useRuntimeStore.getState().marinara;
    const timerFn = (marinara && typeof marinara.setTimeout === 'function') ? marinara.setTimeout : window.setTimeout;
    
    const timeout = timerFn(() => controller.abort(), timeoutMs);
    
    return fetch(url, options)
      .then((res) => { clearTimeout(timeout); return res; })
      .catch((err) => { clearTimeout(timeout); throw err; });
  }

  static fetchCharCard(cid, signal) {
    const marinara = useRuntimeStore.getState().marinara;
    if (!cid || !marinara) return Promise.resolve("");
    return marinara.apiFetch(`${ENDPOINTS.chats}/${cid}`)
      .then((chat) => {
        if (signal && signal.aborted) throw new Error("cancelled");
        let ids = [];
        try { ids = typeof chat.characterIds === "string" ? JSON.parse(chat.characterIds) : chat.characterIds || []; } catch (e) {}
        if (!ids.length) return "";
        return marinara.apiFetch(`${ENDPOINTS.chars}/${ids[0]}`).then((char) => {
          if (signal && signal.aborted) throw new Error("cancelled");
          let data = {};
          try { data = typeof char.data === "string" ? JSON.parse(char.data) : char.data || {}; } catch (e) {}
          const name = data.name || char.name || "";
          const personality = data.personality || char.personality || "";
          const description = data.description || char.description || "";
          const parts = [];
          if (name) parts.push(`Character: ${name}`);
          if (personality) parts.push(`Personality: ${personality.slice(0, 300)}`);
          if (description) parts.push(`Description: ${description.slice(0, 200)}`);
          return parts.length ? `\n\n[Speaker Profile: CHARACTER (${name})]\n${parts.join("\n")}` : "";
        });
      })
      .catch((e) => { if (e.message !== "cancelled") return ""; else throw e; });
  }

  static fetchUserPersona(cid, signal) {
    const marinara = useRuntimeStore.getState().marinara;
    const defaultPersona = "\n\n[Speaker Profile: USER (Author/Editor)]\nCRITICAL DIRECTIVE: You are editing the AUTHOR'S text. You are completely independent from the story's characters. DO NOT use character voices, DO NOT roleplay, and DO NOT add conversational commentary.";
    
    if (!cid || !marinara) return Promise.resolve(defaultPersona);
    
    return marinara.apiFetch(`${ENDPOINTS.chats}/${cid}`)
      .then((chat) => {
        if (signal && signal.aborted) throw new Error("cancelled");
        if (!chat.personaId) throw new Error("No persona");
        
        if (deadPersonasCache.has(chat.personaId)) {
          throw new Error("dead_persona_cache"); 
        }

        return marinara.apiFetch(`${ENDPOINTS.personas}/${chat.personaId}`)
          .catch((err) => {
            deadPersonasCache.add(chat.personaId);
            throw err;
          });
      })
      .then((persona) => {
        if (signal && signal.aborted) throw new Error("cancelled");
        let data = {};
        try { data = typeof persona.data === "string" ? JSON.parse(persona.data) : persona.data || {}; } catch (e) {}
        const name = data.name || persona.name || "User";
        const desc = data.description || persona.description || "";
        if (!desc) throw new Error("Empty persona");
        return `\n\n[Speaker Profile: USER (${name})]\n${desc}\n(Note: Maintain an objective editor tone, do not roleplay as story characters.)`;
      })
      .catch((e) => { 
        if (e.message !== "cancelled") return defaultPersona; 
        else throw e; 
      });
  }

  static getChatHistoryContext(targetMid, depth) {
    if (depth <= 0) return "";
    const msgs = Array.from(document.querySelectorAll(SELECTORS.message));
    const targetIdx = msgs.findIndex((m) => (m.getAttribute('data-message-id') || m.id) === targetMid);
    if (targetIdx <= 0) return "";

    const startIdx = Math.max(0, targetIdx - depth);
    const historyText = [];
    for (let i = startIdx; i < targetIdx; i++) {
      const el = msgs[i];
      const isUserClass = el.matches(SELECTORS.userMessage) || el.closest(SELECTORS.userMessage);
      const isUser = isUserClass || el.querySelector(SELECTORS.avatar);
      const role = isUser ? "User" : "Character";

      const clone = el.cloneNode(true);
      clone.querySelectorAll('.message-actions, button, textarea, input, .rwa').forEach((b) => b.remove());

      const cleanText = clone.innerText.trim();
      if (cleanText && cleanText.length > 2) {
        historyText.push(`${role}: ${cleanText.substring(0, 400)}`);
      }
    }
    return historyText.length > 0 ? `\n\n[RECENT STORY CONTEXT]\n${historyText.join("\n\n")}` : "";
  }

  static composePrompt(profile, cardCtx, historyCtx, targetText, config) {
    const core = `[CORE INSTRUCTION]:\n${profile.prompt.trim()}`;
    let constraints = "";
    if (config.lengthEnabled && config.lengthPct !== 0) {
      const pct = config.lengthPct;
      constraints = pct < 0
        ? `\n\n[CONSTRAINT]: Make the final rewritten output approximately ${Math.abs(pct)}% shorter (more concise) than the original text.`
        : `\n\n[CONSTRAINT]: Make the final rewritten output approximately ${pct}% longer (more detailed) than the original text.`;
    }
    const context = [cardCtx, historyCtx].map(c => c.trim()).filter(Boolean).join("\n\n");
    const contextBlock = context ? `\n\n[CONTEXT DATA]:\n${context}` : "";
    return `${core}${constraints}${contextBlock}\n\n[TARGET TEXT TO REWRITE]:\n${targetText}`;
  }

  static async fetchAIResponse(profile, savedSel, signal) {
    const config = usePersistentStore.getState().config;
    const marinara = useRuntimeStore.getState().marinara;
    const resolvedMidForLogic = savedSel.mid;
    
    let isUser = savedSel.detectedRole === 'user';
    let isAssistant = savedSel.detectedRole === 'assistant';

    // [BẢN VÁ TỐI THƯỢNG]: Logic dò tìm Vai trò chính xác 100% qua DOM
    if (!savedSel.detectedRole) {
      const msgEl = document.querySelector(`[data-message-id="${resolvedMidForLogic}"]`) || document.getElementById(resolvedMidForLogic);
      
      if (msgEl) {
        const isInputField = msgEl.tagName === 'TEXTAREA' || msgEl.tagName === 'INPUT';
        const isUserClass = msgEl.matches(SELECTORS.userMessage) || msgEl.closest(SELECTORS.userMessage);
        
        if (isInputField || isUserClass || msgEl.querySelector(SELECTORS.avatar)) {
          isUser = true;
        } else {
          isAssistant = true;
        }
      } else {
        isUser = true; // Fallback an toàn
      }
    }

    let cardCtx = "";
    if (!config.freeMode) {
      if (isUser && config.injectUser) cardCtx = await this.fetchUserPersona(savedSel.cid, signal);
      else if (isAssistant && config.injectChar) cardCtx = await this.fetchCharCard(savedSel.cid, signal);
    }

    if (signal.aborted) throw new Error("cancelled");

    const safeText = savedSel.text.length > 10000 ? `${savedSel.text.slice(0, 10000)}…` : savedSel.text;
    const userPrompt = this.composePrompt(profile, cardCtx, this.getChatHistoryContext(resolvedMidForLogic, config.contextDepth), safeText, config);
    
    const sysP = `You are a NEUTRAL, objective writing assistant transforming text for an author.
Rules:
- Follow the requested operation exactly.
- STRICT ROLE ISOLATION (CRITICAL): You are an editing tool, NOT a character in the story. DO NOT roleplay. DO NOT adopt the persona, emotions, pronouns (like I, me, my, Em, Anh), or speaking style of any characters found in the Recent Story Context.
- STRICT LANGUAGE LOCK: Identify and match the language of the user's input text Auditorily and Structurally. Output the transformed prose in the EXACT SAME LANGUAGE. Do NOT translate the text.
- LINGUISTIC & GRAMMAR FIDELITY: Adapt perfectly to the natural grammatical flow and cultural nuances inherent to the input text's language. Preserve the original narrative perspective.
- NARRATIVE CONTINUITY: Preserve established story facts. Use the Recent Story Context ONLY for factual reference, NEVER to mimic the characters' voices.
- OUTPUT FORMAT: Output ONLY the transformed prose. Absolutely no introduction, no chat commentary, no explanations, and no surrounding quotes.
- Preserve wrapping markdown or punctuation (like *...*, (...), "...") ONLY IF they exist in the original text.`;

    if (config.ollamaModel && config.ollamaModel.trim() !== "") {
      const url = (config.ollamaUrl || "http://127.0.0.1:11434/v1").replace(/\/$/, "");
      return this.fetchWithTimeout(`${url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.ollamaModel.trim(),
          messages: [
            { role: "system", content: sysP },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        }),
        signal: signal 
      }, 25000)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          if (data.error) return { error: data.error.message || data.error };
          if (!data.choices || !data.choices[0]) return { error: "No response from language model" };
          return { result: data.choices[0].message.content };
        });
    } else {
      if (!marinara) throw new Error("Marinara instance is missing, unable to route to default sidecar.");
      return marinara.apiFetch(ENDPOINTS.tracker, {
        method: "POST",
        body: JSON.stringify({ systemPrompt: sysP, userPrompt }),
      }).then(res => {
        if (signal.aborted) throw new Error("cancelled");
        return res;
      });
    }
  }
}
# Vietnamese UI Copy Guide

Rewrite Assistant uses natural Vietnamese UI copy rather than word-for-word translation. Product/technical identifiers may stay in English when translating them would reduce precision.

## Core glossary

| English concept | Preferred Vietnamese UI copy |
| --- | --- |
| Style preset / preset | Thiết lập sẵn |
| Custom Prompt | Yêu cầu tùy chỉnh |
| Draft Reply | Soạn trả lời |
| Persona Reply | Trả lời theo Persona |
| Voice Profile | Hồ sơ giọng |
| Around context | Ngữ cảnh gần |
| Settings | Cài đặt |
| Undo / Redo | Hoàn tác / Làm lại |
| Insert into composer | Chèn vào ô nhập |

## Keep as technical terms

Keep these names unchanged when they refer to Marinara/runtime concepts:
- Rewrite Assistant
- Persona
- Character
- Lore
- Memory
- SSE
- reasoning
- Roleplay / Conversation / Game when naming Marinara modes

## Style rules

1. Prefer short action labels over literal translations.
2. Avoid mixing Vietnamese with unnecessary English nouns such as "style", "profile", "prompt", or "provider" when a clear Vietnamese UI term exists.
3. Use technical English only where it carries a specific runtime meaning.
4. Descriptions should explain user impact first, implementation details second.
5. Buttons should be verbs or clear actions: "Đặt lại", "Sửa ý", "Soạn trả lời", "Chèn vào ô nhập".
6. Do not translate user-created preset names, prompts, Persona names, Character names, or generated chat content.
7. Keep punctuation and capitalization restrained; uppercase is reserved for compact section headings already styled as labels.

This guide is normative for new Vietnamese UI copy. If wording changes later, update this glossary and the localization regression checks in the same pull request.

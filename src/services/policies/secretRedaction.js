const SECRET_KEY = /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|secret|credential)/i;

export function redactSecretText(value) {
  let text = String(value ?? '');
  // Query-string and form-style secrets.
  text = text.replace(/([?&;]\s*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret|credential)\s*=\s*)[^&#;\s]+/gi, '$1[redacted]');
  // Authorization bearer tokens that arrive inside an otherwise unstructured message.
  // Do this before generic key/value redaction so `Authorization: Bearer TOKEN`
  // cannot leave TOKEN behind after only the word `Bearer` is replaced.
  text = text.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [redacted]');
  // JSON / log-field style secrets.
  text = text.replace(/(["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|secret|credential)["']?\s*[:=]\s*["']?)([^"'\s,;}]{4,})/gi, '$1[redacted]');
  // URL user-info is never needed in diagnostics.
  text = text.replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[redacted]@');
  return text;
}

export function isSecretLikeKey(key) {
  return SECRET_KEY.test(String(key || ''));
}

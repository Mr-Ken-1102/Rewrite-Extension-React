export const LOCAL_SIDECAR_CONNECTION_ID = '__local_sidecar__';

const CAPABILITIES = Object.freeze({
  marinara: Object.freeze({
    fastRewrite: true,
    fastRewriteStrategy: 'reasoning-override',
    liveStreaming: true,
    liveStreamingStrategy: 'marinara-raw-sse',
  }),
  sidecar: Object.freeze({
    fastRewrite: false,
    fastRewriteStrategy: null,
    liveStreaming: true,
    liveStreamingStrategy: 'marinara-raw-sse',
  }),
  direct: Object.freeze({
    fastRewrite: false,
    fastRewriteStrategy: null,
    liveStreaming: true,
    liveStreamingStrategy: 'openai-compatible-sse',
  }),
  extender: Object.freeze({
    fastRewrite: false,
    fastRewriteStrategy: null,
    liveStreaming: true,
    liveStreamingStrategy: 'openai-compatible-sse',
  }),
});

export function normalizeConnectionMode(mode) {
  return Object.hasOwn(CAPABILITIES, mode) ? mode : 'marinara';
}

export function getProviderCapabilities(mode) {
  return CAPABILITIES[normalizeConnectionMode(mode)];
}

export function isFastRewriteSupported(mode) {
  return getProviderCapabilities(mode).fastRewrite;
}

export function isLiveStreamingSupported(mode) {
  return getProviderCapabilities(mode).liveStreaming;
}

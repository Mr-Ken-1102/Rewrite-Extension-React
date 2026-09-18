const EVOLUTION_ROWS = [
  {
    en: 'Engine & AI connections',
    vi: 'Engine & kết nối AI',
    detailEn: 'Certified Marinara Engine v2.4.4–v2.4.6 integration with private extension storage, safer host APIs, Marinara Connections, Sidecar, Extender, OpenAI-compatible endpoints, and local Ollama routing.',
    detailVi: 'Tích hợp được kiểm chứng với Marinara Engine v2.4.4–v2.4.6, lưu trữ riêng của extension, host API an toàn hơn, Marinara Connections, Sidecar, Extender, endpoint tương thích OpenAI và định tuyến Ollama cục bộ.',
  },
  {
    en: 'Context & identity',
    vi: 'Ngữ cảnh & danh tính',
    detailEn: 'Character, Persona, Lore, Memory, nearby context and hidden-from-AI policies, plus exact selected-Character resolution in group chats and identity-scoped Voice Profiles.',
    detailVi: 'Character, Persona, Lore, Memory, ngữ cảnh gần và chính sách hidden-from-AI, đồng thời xác định chính xác Character được chọn trong chat nhóm và Hồ sơ giọng tách biệt theo danh tính.',
  },
  {
    en: 'Safe editing at scale',
    vi: 'Chỉnh sửa an toàn ở quy mô lớn',
    detailEn: 'Exact selection mapping, fail-closed writes, multi-message rewriting, merged passes, Ledger for large selections, resumable flows, Preview, Undo/Redo, and guarded recovery paths.',
    detailVi: 'Ánh xạ chính xác vùng chọn, ghi dữ liệu fail-closed, viết lại nhiều tin nhắn, chế độ gộp, Ledger cho vùng chọn lớn, tiếp tục phiên, Preview, Hoàn tác/Làm lại và các đường khôi phục có kiểm soát.',
  },
  {
    en: 'Streaming & workflow',
    vi: 'Streaming & quy trình làm việc',
    detailEn: 'SSE streaming, real cancellation, diagnostics, searchable presets, Custom Prompt, AI Architect, bilingual controls, and safer long-running generation feedback.',
    detailVi: 'SSE streaming, hủy thật, chẩn đoán, thiết lập sẵn có thể tìm kiếm, Yêu cầu tùy chỉnh, AI Architect, điều khiển song ngữ và phản hồi trạng thái rõ ràng hơn cho các tác vụ sinh nội dung kéo dài.',
  },
];

const RELEASE_HIGHLIGHTS = [
  {
    en: 'Fast Rewrite',
    vi: 'Viết lại nhanh',
    detailEn: 'Rewrite requests can bypass model reasoning when the provider supports it while keeping live SSE streaming, dramatically reducing wait time without changing the chat model or its saved connection settings.',
    detailVi: 'Request viết lại có thể bỏ qua reasoning khi provider hỗ trợ nhưng vẫn giữ SSE streaming trực tiếp, giảm mạnh thời gian chờ mà không thay đổi model chat hay cấu hình kết nối đã lưu.',
  },
  {
    en: 'Persona Draft Reply',
    vi: 'Soạn trả lời theo Persona',
    detailEn: 'Idea → reply, Continue Draft, suggestions, alternatives, shorter/longer variants, streaming preview, safe composer insertion, and no automatic sending.',
    detailVi: 'Từ ý tưởng → trả lời, Viết tiếp bản nháp, gợi ý, bản khác, ngắn hơn/dài hơn, preview theo streaming, chèn an toàn vào ô nhập và tuyệt đối không tự gửi.',
  },
  {
    en: 'Identity-locked generation',
    vi: 'Sinh nội dung khóa theo danh tính',
    detailEn: 'Character/Persona identity and source fingerprints are revalidated before generation and insertion so stale or switched identities fail closed.',
    detailVi: 'Danh tính Character/Persona và source fingerprint được kiểm tra lại trước khi sinh và trước khi chèn; khi danh tính hoặc card thay đổi, quy trình sẽ fail-closed thay vì dùng dữ liệu cũ.',
  },
  {
    en: 'Three-mode placement',
    vi: 'Định vị theo ba chế độ',
    detailEn: 'Roleplay, Conversation and Game each resolve their local composer context; the launcher can follow automatically or remember a dragged position per mode.',
    detailVi: 'Roleplay, Conversation và Game đều nhận diện đúng vùng nhập cục bộ; launcher có thể tự bám theo ô nhập hoặc ghi nhớ vị trí kéo riêng cho từng chế độ.',
  },
];

export function AboutPanel({ vi }) {
  const text = (en, viText) => (vi ? viText : en);

  return (
    <div className="rwa-about-container">
      <div className="rwa-about-identity">
        <div className="rwa-about-mark">RA</div>
        <div className="rwa-about-identity-copy">
          <h3 className="rwa-about-title">Rewrite Assistant V3</h3>
          <p className="rwa-about-subtitle">
            Version 3.0.3 · {text('Developed by', 'Phát triển bởi')} <strong>Mr.Kiều.1102</strong>
          </p>
        </div>
        <span className="rwa-about-status">{text('Marinara Engine compatible', 'Tương thích Marinara Engine')}</span>
      </div>

      <section className="rwa-about-release" aria-labelledby="rwa-about-release-title">
        <div className="rwa-about-release-head">
          <div>
            <div className="rwa-about-section-kicker">V3.0.3 · {text('HIGHLIGHTS', 'ĐIỂM NHẤN')}</div>
            <h4 id="rwa-about-release-title" className="rwa-about-section-title">
              {text('Beyond a basic rewrite workflow', 'Vượt xa một quy trình viết lại cơ bản')}
            </h4>
            <p className="rwa-about-section-note">
              {text(
                'This release adds identity-aware reply generation, safer state locking, and mode-aware interaction that turn rewriting into a context-sensitive writing workflow.',
                'Bản phát hành này bổ sung sinh câu trả lời theo đúng danh tính, khóa trạng thái an toàn và tương tác theo từng chế độ — biến việc viết lại thành một quy trình viết có ngữ cảnh hoàn chỉnh hơn.',
              )}
            </p>
          </div>
          <span className="rwa-about-release-badge">3.0.3</span>
        </div>

        <div className="rwa-about-feature-rail" aria-hidden="true">
          <span className="rwa-about-feature-runner"></span>
        </div>

        <div className="rwa-about-highlight-grid">
          {RELEASE_HIGHLIGHTS.map((item) => (
            <article key={item.en} className="rwa-about-highlight-card">
              <strong>{text(item.en, item.vi)}</strong>
              <span>{text(item.detailEn, item.detailVi)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rwa-about-section" aria-labelledby="rwa-about-whats-new">
        <div className="rwa-about-section-kicker">{text('EVOLUTION', 'HÀNH TRÌNH PHÁT TRIỂN')}</div>
        <div className="rwa-about-section-heading">
          <div>
            <h4 id="rwa-about-whats-new" className="rwa-about-section-title">
              {text('What’s new since the first React build', 'Có gì mới từ bản React đầu tiên')}
            </h4>
            <p className="rwa-about-section-note">
              {text(
                'Major product layers added since the first Rewrite-Extension-React upload.',
                'Những lớp tính năng lớn được phát triển thêm kể từ bản Rewrite-Extension-React đầu tiên.',
              )}
            </p>
          </div>
          <span className="rwa-about-baseline">{text('Baseline', 'Mốc')} · 21/06/2026</span>
        </div>

        <div className="rwa-about-evolution-list">
          {EVOLUTION_ROWS.map((item, index) => (
            <article key={item.en} className="rwa-about-evolution-row">
              <span className="rwa-about-evolution-index">{String(index + 1).padStart(2, '0')}</span>
              <strong className="rwa-about-evolution-title">{text(item.en, item.vi)}</strong>
              <span className="rwa-about-evolution-detail">{text(item.detailEn, item.detailVi)}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

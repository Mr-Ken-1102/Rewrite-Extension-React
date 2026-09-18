const EVOLUTION_ROWS = [
  {
    en: 'Engine & AI connections',
    vi: 'Engine & kết nối AI',
    detailEn: 'Certified Marinara Engine v2.4.4–v2.4.6 integration, private extension storage, safer host APIs, Marinara Connections, Sidecar, Extender, OpenAI-compatible endpoints, and local Ollama.',
    detailVi: 'Tích hợp được kiểm chứng với Marinara Engine v2.4.4–v2.4.6, lưu trữ riêng của extension, host API an toàn hơn, Marinara Connections, Sidecar, Extender, endpoint tương thích OpenAI và Ollama cục bộ.',
  },
  {
    en: 'Context & identity',
    vi: 'Ngữ cảnh & danh tính',
    detailEn: 'Character, Persona, Lore, Memory and nearby context; exact Character targeting in group chats; identity-scoped Voice Profiles with source-fingerprint revalidation.',
    detailVi: 'Character, Persona, Lore, Memory và ngữ cảnh gần; xác định chính xác Character trong chat nhóm; Hồ sơ giọng theo đúng danh tính với source fingerprint được kiểm tra lại.',
  },
  {
    en: 'Safe editing at scale',
    vi: 'Chỉnh sửa an toàn ở quy mô lớn',
    detailEn: 'Exact selection mapping, fail-closed writes, multi-message rewriting, merged passes, Ledger for large selections, resumable flows, Preview, Undo/Redo, and result recovery.',
    detailVi: 'Ánh xạ chính xác vùng chọn, ghi dữ liệu fail-closed, viết lại nhiều tin nhắn, chế độ gộp, Ledger cho đoạn dài, tiếp tục phiên, Preview, Hoàn tác/Làm lại và khôi phục kết quả.',
  },
  {
    en: 'Workflow & Persona Reply',
    vi: 'Quy trình & Trả lời theo Persona',
    detailEn: 'Searchable presets, Custom Prompt, AI Architect, SSE streaming, real cancellation, diagnostics, bilingual UI, and modeless Persona Draft Reply with safe composer insertion and per-mode positioning.',
    detailVi: 'Thiết lập sẵn có thể tìm kiếm, Yêu cầu tùy chỉnh, AI Architect, SSE streaming, hủy thật, chẩn đoán, giao diện song ngữ và Soạn trả lời theo Persona dạng modeless với chèn an toàn cùng vị trí riêng theo từng mode.',
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

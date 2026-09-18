const FEATURE_ITEMS = [
  {
    en: 'Marinara Engine integration',
    vi: 'Tích hợp Marinara Engine',
    detailEn: 'Certified integration across Engine v2.4.4–v2.4.6, private extension storage, safer host APIs, and mode-aware Roleplay / Conversation / Game composer handling.',
    detailVi: 'Tích hợp được kiểm chứng với Engine v2.4.4–v2.4.6, lưu trữ riêng của extension, host API an toàn hơn và nhận diện đúng ô nhập ở Roleplay / Conversation / Game.',
  },
  {
    en: 'Local and routed AI connections',
    vi: 'Kết nối AI cục bộ và qua Marinara',
    detailEn: 'Stable Marinara Connections, Sidecar, Extender, OpenAI-compatible endpoints, and local Ollama workflows without forcing a second heavy model beside the active chat model.',
    detailVi: 'Hỗ trợ ổn định Marinara Connections, Sidecar, Extender, endpoint tương thích OpenAI và Ollama cục bộ mà không buộc phải chạy thêm một model nặng bên cạnh model chat.',
  },
  {
    en: 'Context-aware rewriting',
    vi: 'Viết lại có ngữ cảnh',
    detailEn: 'Character, Persona, Lore, Memory, nearby context, token estimates, one-shot exclusions, hidden-from-AI handling, and identity-aware context collection.',
    detailVi: 'Kết hợp Character, Persona, Lore, Memory, ngữ cảnh gần, ước lượng token, loại trừ theo từng lần và xử lý dữ liệu ẩn khỏi AI theo đúng danh tính.',
  },
  {
    en: 'Safer editing at scale',
    vi: 'Chỉnh sửa dài và nhiều tin nhắn an toàn hơn',
    detailEn: 'Exact selection mapping, guarded writes, multi-message rewriting, merged passes, Ledger handling for large selections, resumable flows, Preview, Undo/Redo, and recovery paths.',
    detailVi: 'Ánh xạ chính xác vùng chọn, ghi dữ liệu có kiểm tra, viết lại nhiều tin nhắn, chế độ gộp, Ledger cho đoạn dài, tiếp tục phiên, Preview, Hoàn tác/Làm lại và nhiều đường khôi phục kết quả.',
  },
  {
    en: 'Presets and authoring tools',
    vi: 'Thiết lập sẵn và công cụ biên soạn',
    detailEn: 'Searchable/reorderable presets, Custom Prompt, Save as Profile, AI Architect, compact layouts, and bilingual interface controls.',
    detailVi: 'Thiết lập sẵn có thể tìm kiếm/sắp xếp, Yêu cầu tùy chỉnh, lưu thành hồ sơ, AI Architect, bố cục gọn và giao diện song ngữ.',
  },
  {
    en: 'Streaming and diagnostics',
    vi: 'Streaming và chẩn đoán',
    detailEn: 'SSE streaming, real cancellation, Fast Rewrite, bounded diagnostics, LAN/local-endpoint guidance, and clearer provider/connection lifecycle feedback.',
    detailVi: 'SSE streaming, hủy thật, Viết lại nhanh, chẩn đoán có giới hạn, hướng dẫn endpoint LAN/cục bộ và trạng thái kết nối rõ ràng hơn.',
  },
  {
    en: 'Identity-scoped Voice Profiles',
    vi: 'Hồ sơ giọng theo đúng danh tính',
    detailEn: 'Exact Character targeting in group chats, separate Character/Persona voice profiles, source fingerprints, safe reuse, and stale-result rejection.',
    detailVi: 'Xác định đúng Character trong chat nhóm, Hồ sơ giọng riêng cho Character/Persona, source fingerprint, tái sử dụng an toàn và loại bỏ kết quả đã lỗi thời.',
  },
  {
    en: 'Persona Draft Reply',
    vi: 'Soạn trả lời theo Persona',
    detailEn: 'Idea-to-reply, Continue Draft, suggestions, alternatives, shorter/longer variants, streaming preview, safe composer insertion, modeless dragging, and per-mode launcher positioning.',
    detailVi: 'Từ ý tưởng thành câu trả lời, Viết tiếp bản nháp, gợi ý, bản khác, ngắn hơn/dài hơn, xem trước theo streaming, chèn an toàn vào ô nhập, popup kéo thả và vị trí launcher riêng theo từng mode.',
  },
];

export function AboutPanel({ vi }) {
  const text = (en, viText) => (vi ? viText : en);

  return (
    <div className="rwa-about-container">
      <div className="rwa-about-box">
        <div className="rwa-about-header-zone">
          <div className="rwa-about-mark">RA</div>
          <div>
            <h3 className="rwa-about-title">Rewrite Assistant V3</h3>
            <p className="rwa-about-subtitle">
              Version 3.0.3<br/>
              {text('Developed by', 'Phát triển bởi')} <strong>Mr.Kiều.1102</strong>
            </p>
          </div>
        </div>

        <div className="rwa-about-sep"></div>

        <section className="rwa-about-section" aria-labelledby="rwa-about-whats-new">
          <div className="rwa-about-section-kicker">{text('EVOLUTION', 'HÀNH TRÌNH PHÁT TRIỂN')}</div>
          <h4 id="rwa-about-whats-new" className="rwa-about-section-title">
            {text('What’s new since the first React build', 'Có gì mới từ bản React đầu tiên')}
          </h4>
          <p className="rwa-about-section-note">
            {text(
              'Baseline: the first Rewrite-Extension-React upload on June 21, 2026. The items below summarize the major product layers added after that starting point.',
              'Mốc so sánh: bản Rewrite-Extension-React đầu tiên được đưa lên ngày 21/06/2026. Danh sách dưới đây tóm tắt những lớp tính năng lớn được phát triển thêm kể từ mốc đó.',
            )}
          </p>

          <div className="rwa-about-feature-grid">
            {FEATURE_ITEMS.map((item) => (
              <article key={item.en} className="rwa-about-feature-card">
                <strong>{text(item.en, item.vi)}</strong>
                <span>{text(item.detailEn, item.detailVi)}</span>
              </article>
            ))}
          </div>
        </section>

        <div className="rwa-about-sep"></div>

        <section className="rwa-about-section" aria-labelledby="rwa-about-credits">
          <div className="rwa-about-section-kicker">{text('CREDITS', 'GHI CÔNG')}</div>
          <h4 id="rwa-about-credits" className="rwa-about-section-title">
            {text('People and projects behind the journey', 'Những người và dự án đứng sau hành trình này')}
          </h4>

          <div className="rwa-about-credit-list">
            <article className="rwa-about-credit-card rwa-about-credit-special">
              <strong>TCLowe1982 / HolyKnight3</strong>
              <p>
                {text(
                  'I started this project with almost no programming experience and, at the time, could not afford access to AI tools powerful enough to reliably help me write and debug code. Whenever I got stuck on a bug I did not know how to fix, TCLowe was always generous with his time and guidance, even though we live in Vietnam and the United States, twelve time zones apart. At times he was even willing to use his own Claude Code just to help me track down a bug. His help and encouragement were an important part of what kept me going and helped me bring Rewrite Assistant to completion.',
                  'Tôi bắt đầu dự án này gần như từ con số 0 về lập trình và khi ấy cũng không có điều kiện sử dụng những công cụ AI đủ mạnh để hỗ trợ. Mỗi khi tôi mắc kẹt với một lỗi mà không biết phải sửa thế nào, TCLowe luôn nhiệt tình giúp đỡ và hướng dẫn tôi, dù chúng tôi ở Việt Nam và Mỹ, cách nhau tới 12 múi giờ. Có những lúc anh ấy còn sẵn lòng dùng chính Claude Code của mình chỉ để giúp tôi tìm bug. Sự giúp đỡ và động viên của anh ấy là một phần quan trọng giúp tôi tiếp tục và hoàn thiện Rewrite Assistant.',
                )}
              </p>
            </article>

            <article className="rwa-about-credit-card">
              <strong>Beoopo — Marinara Rewrite</strong>
              <p>
                {text(
                  'Rewrite Assistant began from the inspiration and practical experience I found in Beoopo’s Marinara Rewrite extension. I especially appreciate the idea and the work that showed how useful an AI-assisted rewriting workflow could be inside Marinara. Rewrite Assistant was rebuilt independently in React and has since grown in a different technical direction, but Marinara Rewrite remains an important origin of the idea.',
                  'Rewrite Assistant bắt đầu từ nguồn cảm hứng và trải nghiệm thực tế mà tôi có được khi sử dụng extension Marinara Rewrite của Beoopo. Tôi đặc biệt trân trọng ý tưởng và công sức của anh ấy vì chính dự án đó đã cho tôi thấy một quy trình viết lại bằng AI bên trong Marinara có thể hữu ích đến mức nào. Rewrite Assistant sau đó được tôi xây dựng lại độc lập bằng React và phát triển theo một hướng kỹ thuật khác, nhưng Marinara Rewrite vẫn là một nguồn cảm hứng quan trọng từ những ngày đầu.',
                )}
              </p>
            </article>
          </div>
        </section>

        <div className="rwa-about-footer">
          <span className="rwa-about-status">{text('Marinara Engine compatible', 'Tương thích Marinara Engine')}</span>
        </div>
      </div>
    </div>
  );
}

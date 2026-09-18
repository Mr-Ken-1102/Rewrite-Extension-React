export function CreditsPanel({ vi }) {
  const text = (en, viText) => (vi ? viText : en);

  return (
    <div className="rwa-credits-container">
      <div className="rwa-credit-list">
        <article className="rwa-credit-card rwa-credit-card-special">
          <div className="rwa-credit-name">TCLowe1982 / HolyKnight3</div>
          <p>
            {text(
              'I started this project with almost no programming experience and, at the time, could not afford access to AI tools powerful enough to reliably help me write and debug code. Whenever I got stuck on a bug I did not know how to fix, TCLowe1982 / HolyKnight3 was always generous with his time and guidance, even though we live in Vietnam and the United States, twelve time zones apart. At times he was even willing to use his own Claude Code just to help me track down a bug. His help and encouragement were an important part of what kept me going and helped me bring Rewrite Assistant to completion.',
              'Tôi bắt đầu dự án này gần như từ con số 0 về lập trình và khi ấy cũng không có điều kiện sử dụng những công cụ AI đủ mạnh để hỗ trợ. Mỗi khi tôi mắc kẹt với một lỗi mà không biết phải sửa thế nào, TCLowe1982 / HolyKnight3 luôn nhiệt tình giúp đỡ và hướng dẫn tôi, dù chúng tôi ở Việt Nam và Mỹ, cách nhau tới 12 múi giờ. Có những lúc anh ấy còn sẵn lòng dùng chính Claude Code của mình chỉ để giúp tôi tìm bug. Sự giúp đỡ và động viên của anh ấy là một phần quan trọng giúp tôi tiếp tục và hoàn thiện Rewrite Assistant.',
            )}
          </p>
        </article>

        <article className="rwa-credit-card">
          <div className="rwa-credit-name">Beoopo — Marinara Rewrite</div>
          <p>
            {text(
              'Rewrite Assistant began from the inspiration and practical experience I found in Beoopo’s Marinara Rewrite extension. I especially appreciate the idea and the work that showed how useful an AI-assisted rewriting workflow could be inside Marinara. Rewrite Assistant was rebuilt independently in React and has since grown in a different technical direction, but Marinara Rewrite remains an important origin of the idea.',
              'Rewrite Assistant bắt đầu từ nguồn cảm hứng và trải nghiệm thực tế mà tôi có được khi sử dụng extension Marinara Rewrite của Beoopo. Tôi đặc biệt trân trọng ý tưởng và công sức của anh ấy vì chính dự án đó đã cho tôi thấy một quy trình viết lại bằng AI bên trong Marinara có thể hữu ích đến mức nào. Rewrite Assistant sau đó được tôi xây dựng lại độc lập bằng React và phát triển theo một hướng kỹ thuật khác, nhưng Marinara Rewrite vẫn là một nguồn cảm hứng quan trọng từ những ngày đầu.',
            )}
          </p>
        </article>
      </div>
    </div>
  );
}

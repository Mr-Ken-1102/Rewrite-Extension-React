import { usePersistentStore } from '../../../store/usePersistentStore';

const OPTIONS = [
  {
    value: 'vi',
    name: 'Tiếng Việt',
    detail: 'Dùng tiếng Việt cho giao diện Rewrite Assistant.',
  },
  {
    value: 'en',
    name: 'English',
    detail: 'Use English for the Rewrite Assistant interface.',
  },
];

export const TabLanguage = () => {
  const config = usePersistentStore((state) => state.config);
  const updateConfig = usePersistentStore((state) => state.updateConfig);
  const language = config.uiLanguage === 'vi' ? 'vi' : 'en';
  const vi = language === 'vi';

  return (
    <>
      <div className="rwa-lbl">{vi ? 'NGÔN NGỮ GIAO DIỆN' : 'INTERFACE LANGUAGE'}</div>
      <div className="rwa-prev" style={{ fontSize: '10.5px', lineHeight: 1.55, marginBottom: '14px', resize: 'none' }}>
        {vi
          ? 'Thay đổi ngôn ngữ có hiệu lực ngay và được lưu cùng cấu hình Rewrite Assistant. Tên thiết lập tùy chỉnh, yêu cầu tùy chỉnh và nội dung bạn tạo sẽ luôn được giữ nguyên.'
          : 'Language changes take effect immediately and are saved with Rewrite Assistant settings. Custom style names, custom prompts, and user-authored content are never translated automatically.'}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} aria-label={vi ? 'Chọn ngôn ngữ giao diện' : 'Choose interface language'}>
        <legend style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {vi ? 'Ngôn ngữ' : 'Language'}
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          {OPTIONS.map((option) => {
            const selected = language === option.value;
            return (
              <label
                key={option.value}
                style={{
                  minWidth: 0,
                  minHeight: '104px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px',
                  border: selected ? '1px solid rgba(209,154,69,.46)' : '1px solid rgba(255,255,255,.09)',
                  borderRadius: '11px',
                  background: selected ? 'rgba(209,154,69,.08)' : 'rgba(255,255,255,.018)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <strong style={{ color: selected ? '#d19a45' : 'rgba(255,255,255,.92)', fontSize: '14px' }}>{option.name}</strong>
                  <input
                    type="radio"
                    name="rwa-ui-language"
                    value={option.value}
                    checked={selected}
                    onChange={() => updateConfig({ uiLanguage: option.value })}
                    aria-label={option.name}
                  />
                </div>
                <span style={{ color: 'rgba(255,255,255,.56)', fontSize: '10.5px', lineHeight: 1.45 }}>{option.detail}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginTop: '14px', marginBottom: 0, resize: 'none' }}>
        {vi
          ? 'Ghi chú: nhãn của các thiết lập sẵn mặc định có thể được Việt hóa cho giao diện, nhưng ID, yêu cầu gốc và dữ liệu lưu trữ vẫn giữ nguyên. Thiết lập do bạn tự tạo luôn giữ nguyên tên và nội dung.'
          : 'Note: built-in preset display labels may be translated for the interface, but their IDs, prompts, and stored preset data remain unchanged. User-created styles always keep their original names and prompts.'}
      </div>
    </>
  );
};

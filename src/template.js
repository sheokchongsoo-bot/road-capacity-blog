// 의존성 없는 최소 템플릿 유틸.
// {{key}} 자리표시자를 data[key] 값으로 치환한다. 값이 없으면 빈 문자열.
export function render(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    return value == null ? '' : String(value);
  });
}

// 텍스트를 HTML 컨텍스트에 안전하게 넣기 위한 이스케이프.
// (제목·요약 등 사용자 텍스트를 속성/본문에 넣을 때 사용)
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

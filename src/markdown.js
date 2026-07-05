// 마크다운 → HTML 렌더링.
// gray-matter로 프론트매터를 분리하고, marked로 본문을 변환하며,
// 코드 블록은 highlight.js로 빌드 타임에 강조한다. (브라우저에 JS 부담 없음)
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';
import { escapeHtml } from './template.js';

// 코드 블록을 빌드 타임에 강조해서 <pre><code class="hljs ...">로 출력한다.
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // marked 버전에 따라 토큰 객체 또는 (code, lang) 위치 인자로 들어온다.
    code(codeOrToken, infostring) {
      const text =
        typeof codeOrToken === 'object' ? codeOrToken.text : codeOrToken;
      const rawLang =
        typeof codeOrToken === 'object' ? codeOrToken.lang : infostring;
      const lang = (rawLang || '').trim().split(/\s+/)[0];
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      const cls = language ? ` language-${language}` : '';
      return `<pre><code class="hljs${cls}">${highlighted}</code></pre>\n`;
    },
  },
});

// 수식을 빌드 타임에 KaTeX로 렌더링한다. (브라우저 런타임 JS 없이 CSS만 로드)
//  - 블록 수식:  $$ ... $$
//  - 인라인 수식: $ ... $
function renderMath(tex, displayMode) {
  return katex.renderToString(tex.trim(), {
    displayMode,
    throwOnError: false, // 오류 시 붉은 텍스트로 표시하고 빌드는 계속
  });
}

// 짧은 텍스트(제목·요약)에서 $...$ 인라인 수식만 KaTeX로 렌더하고, 나머지는
// 이스케이프한다. 목록·헤딩처럼 마크다운 전체 파싱은 원치 않는 곳에서 사용.
export function renderInlineMath(text) {
  return String(text)
    .split(/\$([^$\n]+?)\$/)
    .map((part, i) => (i % 2 === 1 ? renderMath(part, false) : escapeHtml(part)))
    .join('');
}

// 수식 마크업을 제거해 평문으로 만든다. <title>·<meta description>처럼 HTML 수식을
// 넣을 수 없는 곳에서 사용. 예) "$f_{HV}$" → "f_HV", "$\mathrm{MSF}_i$" → "MSF_i"
export function stripMath(text) {
  return String(text).replace(/\$([^$\n]+?)\$/g, (_, m) =>
    m
      .replace(/\\[a-zA-Z]+/g, '') // \mathrm, \times 등 명령 제거
      .replace(/[{}\\]/g, '')
      .trim()
  );
}

marked.use({
  extensions: [
    {
      name: 'blockMath',
      level: 'block',
      start(src) {
        const i = src.indexOf('$$');
        return i < 0 ? undefined : i;
      },
      tokenizer(src) {
        const m = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (m) return { type: 'blockMath', raw: m[0], text: m[1] };
      },
      renderer(token) {
        return `<div class="math-block">${renderMath(token.text, true)}</div>\n`;
      },
    },
    {
      name: 'inlineMath',
      level: 'inline',
      start(src) {
        const i = src.indexOf('$');
        return i < 0 ? undefined : i;
      },
      tokenizer(src) {
        // 줄바꿈 없는 $...$ (달러 사이가 비어있지 않아야 함)
        const m = /^\$([^$\n]+?)\$/.exec(src);
        if (m) return { type: 'inlineMath', raw: m[0], text: m[1] };
      },
      renderer(token) {
        return renderMath(token.text, false);
      },
    },
  ],
});

// 파일명에서 slug 생성: "hello-world.md" → "hello-world"
export function slugFromPath(filePath) {
  return basename(filePath).replace(/\.md$/i, '');
}

// 마크다운 파일 경로를 받아 { meta, html, slug }를 반환한다.
export function renderMarkdownFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const html = marked.parse(content);

  const meta = {
    title: data.title ?? slugFromPath(filePath),
    date: data.date ? new Date(data.date) : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    description: data.description ?? '',
    // 강의 번호. 지정 시 목록을 이 값의 오름차순으로 정렬한다.
    order: Number.isFinite(data.order) ? data.order : null,
  };

  return { meta, html, slug: slugFromPath(filePath) };
}

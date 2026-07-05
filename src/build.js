// 빌드 엔트리: content/*.md → dist/ 정적 사이트.
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  existsSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderMarkdownFile, renderInlineMath, stripMath } from './markdown.js';
import { render, escapeHtml } from './template.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 사이트 전역 설정
const SITE = {
  title: '도로용량분석의 이론과 실제',
  description: '교통용량분석 강의 노트 — 도로용량편람과 HCM을 바탕으로 정리합니다.',
};

const dirs = {
  content: join(root, 'content'),
  templates: join(root, 'templates'),
  public: join(root, 'public'),
  dist: join(root, 'dist'),
};

const templates = {
  layout: readFileSync(join(dirs.templates, 'layout.html'), 'utf8'),
  post: readFileSync(join(dirs.templates, 'post.html'), 'utf8'),
  index: readFileSync(join(dirs.templates, 'index.html'), 'utf8'),
};

// 날짜 표시용 포맷터
function formatDate(date) {
  if (!date) return '';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}
function toISODate(date) {
  return date ? date.toISOString().slice(0, 10) : '';
}

// 태그 배열 → <span class="tag"> 목록
function tagsToHtml(tags) {
  if (!tags.length) return '';
  return (
    '<span class="tags">' +
    tags.map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join(' ') +
    '</span>'
  );
}

// 레이아웃에 페이지 본문을 끼워 최종 HTML 생성.
// title(<title>)·description(<meta>)은 HTML 수식을 넣을 수 없으므로 평문으로 처리.
function wrapInLayout({ title, description, content, base }) {
  return render(templates.layout, {
    title: escapeHtml(stripMath(title)),
    description: escapeHtml(stripMath(description)),
    siteTitle: escapeHtml(SITE.title),
    content,
    base,
  });
}

function build() {
  // dist 초기화
  rmSync(dirs.dist, { recursive: true, force: true });
  mkdirSync(join(dirs.dist, 'posts'), { recursive: true });

  // 1. 마크다운 글 수집 및 렌더
  const mdFiles = readdirSync(dirs.content).filter((f) => f.endsWith('.md'));
  const posts = mdFiles.map((file) => renderMarkdownFile(join(dirs.content, file)));

  // 정렬 규칙:
  //  1) order(강의 번호)가 있는 글을 먼저, order 오름차순으로.
  //  2) order가 없는 글끼리는 날짜 역순(최신 먼저).
  posts.sort((a, b) => {
    const oa = a.meta.order;
    const ob = b.meta.order;
    if (oa != null && ob != null) return oa - ob; // 둘 다 번호 있음 → 오름차순
    if (oa != null) return -1; // 번호 있는 글이 앞으로
    if (ob != null) return 1;
    const ta = a.meta.date ? a.meta.date.getTime() : 0;
    const tb = b.meta.date ? b.meta.date.getTime() : 0;
    return tb - ta; // 둘 다 번호 없음 → 날짜 역순
  });

  // 2. 각 글 페이지 출력 (dist/posts/<slug>.html)
  for (const post of posts) {
    const body = render(templates.post, {
      title: renderInlineMath(post.meta.title),
      dateISO: toISODate(post.meta.date),
      dateDisplay: formatDate(post.meta.date),
      tagsHtml: tagsToHtml(post.meta.tags),
      body: post.html,
      base: '../',
    });
    const html = wrapInLayout({
      title: `${post.meta.title} · ${SITE.title}`,
      description: post.meta.description,
      content: body,
      base: '../',
    });
    writeFileSync(join(dirs.dist, 'posts', `${post.slug}.html`), html);
  }

  // 3. 목록 페이지 (dist/index.html)
  const items = posts
    .map((post) => {
      const desc = post.meta.description
        ? `<p class="post-list-desc">${renderInlineMath(post.meta.description)}</p>`
        : '';
      return `<li class="post-list-item">
  <a class="post-list-link" href="posts/${post.slug}.html">
    <h2 class="post-list-title">${renderInlineMath(post.meta.title)}</h2>
    <p class="post-list-meta">
      <time datetime="${toISODate(post.meta.date)}">${formatDate(post.meta.date)}</time>
      ${tagsToHtml(post.meta.tags)}
    </p>
    ${desc}
  </a>
</li>`;
    })
    .join('\n');

  const indexContent = render(templates.index, {
    siteTitle: escapeHtml(SITE.title),
    siteDescription: escapeHtml(SITE.description),
    items,
  });
  const indexHtml = wrapInLayout({
    title: SITE.title,
    description: SITE.description,
    content: indexContent,
    base: '',
  });
  writeFileSync(join(dirs.dist, 'index.html'), indexHtml);

  // 4. 정적 자산 복사 (public/* → dist/)
  if (existsSync(dirs.public)) {
    for (const file of readdirSync(dirs.public)) {
      copyFileSync(join(dirs.public, file), join(dirs.dist, file));
    }
  }

  // 5. KaTeX 자산 복사 (CSS + woff2 폰트). 빌드 타임 렌더 결과를 표시하는 데만 필요.
  copyKatexAssets();

  console.log(`✓ 빌드 완료: 글 ${posts.length}개 → ${dirs.dist}`);
}

// KaTeX CSS와 woff2 폰트만 dist로 복사한다. (CSS가 fonts/ 상대경로로 참조)
function copyKatexAssets() {
  const katexDist = join(root, 'node_modules', 'katex', 'dist');
  copyFileSync(join(katexDist, 'katex.min.css'), join(dirs.dist, 'katex.min.css'));
  const fontsSrc = join(katexDist, 'fonts');
  const fontsDst = join(dirs.dist, 'fonts');
  mkdirSync(fontsDst, { recursive: true });
  for (const file of readdirSync(fontsSrc)) {
    if (file.endsWith('.woff2')) {
      copyFileSync(join(fontsSrc, file), join(fontsDst, file));
    }
  }
}

build();

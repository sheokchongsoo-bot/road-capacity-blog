const docx = require("docx");
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, Footer, PageNumber, LevelFormat, TabStopType, TabStopPosition
} = docx;

// ---------- 색상/폰트 토큰 ----------
const NAVY = "1F3A5F";     // 제목/헤딩
const ACCENT = "EA580C";   // 강조(주황)
const GREY = "555555";
const LIGHT = "F2F5F9";    // 표 헤더 배경
const LIGHT2 = "FBFCFE";   // 표 줄무늬
const BORDER = "C9D3DF";
const FONT = "맑은 고딕";

const CONTENT_W = 9026; // A4 - 좌우여백(1in*2)

// ---------- 헬퍼 ----------
function t(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || 20,
    bold: opts.bold || false, color: opts.color || "222222", italics: opts.italics || false });
}
function p(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0, line: opts.line || 300 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.indent,
  });
}
function body(text, opts = {}) {
  return p([t(text, { size: 20, color: "222222" })], opts);
}
// 불릿(가짜 아님 — numbering 사용)
function bullet(text, level = 0, refName = "biz") {
  return new Paragraph({
    numbering: { reference: refName, level },
    children: [t(text, { size: 20 })],
    spacing: { after: 60, line: 288 },
  });
}
function h1(num, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 140 },
    border: { bottom: { color: NAVY, size: 12, style: BorderStyle.SINGLE, space: 4 } },
    children: [
      new TextRun({ text: num + ". ", font: FONT, size: 26, bold: true, color: ACCENT }),
      new TextRun({ text, font: FONT, size: 26, bold: true, color: NAVY }),
    ],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 90 },
    children: [
      new TextRun({ text: "▪ ", font: FONT, size: 22, bold: true, color: ACCENT }),
      new TextRun({ text, font: FONT, size: 22, bold: true, color: NAVY }),
    ],
  });
}

function cell(children, opts = {}) {
  const arr = Array.isArray(children) ? children : [children];
  return new TableCell({
    width: { size: opts.w, type: WidthType.DXA },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: docx.VerticalAlign.CENTER,
    children: arr,
  });
}
function cellText(text, opts = {}) {
  return cell(
    (Array.isArray(text) ? text : text.split("\n")).map((line, i) =>
      new Paragraph({
        children: [t(line, { size: opts.size || 19, bold: opts.bold || false, color: opts.color || "222222" })],
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { after: 20, line: 264 },
      })
    ), { w: opts.w, shade: opts.shade }
  );
}
function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((c, i) => cellText(c, { w: widths[i], bold: true, color: NAVY, shade: LIGHT, align: AlignmentType.CENTER, size: 19 })),
  });
}
function dataRow(cells, widths, idx) {
  const shade = idx % 2 === 1 ? LIGHT2 : undefined;
  return new TableRow({
    children: cells.map((c, i) => cellText(c, { w: widths[i], shade })),
  });
}
function makeTable(headers, rows, widths) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
    rows: [headerRow(headers, widths), ...rows.map((r, i) => dataRow(r, widths, i))],
  });
}
function spacer(after = 120) { return new Paragraph({ children: [], spacing: { after } }); }

// ================= 문서 내용 =================
const children = [];

// ----- 표지 -----
children.push(new Paragraph({ spacing: { before: 1400, after: 0 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "🥕", size: 96 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
  children: [new TextRun({ text: "인천연구원 나눔장터", font: FONT, size: 60, bold: true, color: NAVY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: "원내 직원 전용 중고물품·재능 거래 플랫폼", font: FONT, size: 28, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
  children: [new TextRun({ text: "기획 · 제안서", font: FONT, size: 24, bold: true, color: ACCENT })] }));

// 표지 정보 표
{
  const w = [2600, 6426];
  const info = [
    ["문서명", "인천연구원 나눔장터 구축 기획·제안서"],
    ["버전", "v0.1 (MVP 프로토타입 기반 초안)"],
    ["작성일", "2026-07-19"],
    ["구분", "내부 검토용 (기획 합의 및 보안 검토 요청)"],
    ["산출물 상태", "클릭 가능한 프론트엔드 프로토타입 완료 · 실서비스 미착수"],
  ];
  children.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: w,
    alignment: AlignmentType.CENTER,
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
    rows: info.map((r, i) => new TableRow({ children: [
      cellText(r[0], { w: w[0], bold: true, color: NAVY, shade: LIGHT, align: AlignmentType.CENTER }),
      cellText(r[1], { w: w[1] }),
    ] })),
  }));
}
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 1. 사업 개요 =====
children.push(h1("1", "사업 개요"));
children.push(h2("1.1 추진 배경 및 필요성"));
children.push(body("원내 직원 사이에서 개인 간 중고물품 거래와 재능 교환(품앗이) 수요가 꾸준히 있으나, 현재는 사내 메신저·게시판·구두 전달 등 비정형 경로에 의존하고 있다. 이로 인해 (1) 물품·재능 정보가 흩어져 검색이 어렵고, (2) 거래 이력·연락이 관리되지 않으며, (3) 외부 중고 플랫폼 이용 시 낯선 상대와의 직거래에 따른 안전·신뢰 부담이 존재한다."));
children.push(body("‘인천연구원 나눔장터’는 이러한 수요를 원내 구성원이라는 신뢰 기반 위에서 안전하고 편리하게 충족시키는 것을 목표로 한다. 회원이 원내 직원으로 한정되므로 외부 중고 플랫폼의 복잡한 요소(불특정 다수 응대, 위치 기반 인증, 사기 방지 등) 대부분을 덜어낼 수 있어 소규모로도 실효성 있는 서비스 구축이 가능하다."));

children.push(h2("1.2 목적"));
children.push(bullet("원내 자원의 재사용을 촉진하여 비용 절감과 자원 순환(ESG)에 기여", 0));
children.push(bullet("직원 간 재능 교환·품앗이를 활성화하여 부서 간 교류와 조직 문화 개선", 0));
children.push(bullet("신뢰 가능한 폐쇄형 거래 공간을 제공하여 안전한 직거래 환경 조성", 0));

children.push(h2("1.3 기대효과"));
children.push(bullet("정량: 물품 재사용 건수, 나눔·재능 교환 참여자 수, 월 활성 이용자(MAU)", 0));
children.push(bullet("정성: 사내 소통 활성화, 자원 절약 문화 확산, 구성원 만족도 제고", 0));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 2. 서비스 개요 =====
children.push(h1("2", "서비스 개요"));
children.push(h2("2.1 한 줄 정의"));
children.push(new Paragraph({
  spacing: { after: 140, line: 300 }, alignment: AlignmentType.CENTER,
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT }, bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT },
    left: { style: BorderStyle.SINGLE, size: 4, color: ACCENT }, right: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } },
  shading: { type: ShadingType.CLEAR, fill: "FFF6F1", color: "auto" },
  children: [t("“인천연구원 직원끼리 중고물품과 재능을 안전하게 사고팔고 나누는, 당근마켓의 원내 버전”", { size: 22, bold: true, color: NAVY })],
}));

children.push(h2("2.2 대상 사용자"));
{
  const w = [2400, 6626];
  children.push(makeTable(
    ["구분", "내용"],
    [
      ["주 사용자", "인천연구원 소속 임직원 전원 (원내 이메일 계정 보유자)"],
      ["가입 자격", "원내 이메일 도메인 인증을 통과한 직원으로 한정 (외부 가입 불가)"],
      ["예상 규모", "수백 명 수준 — 서버 부하·확장성 부담이 낮은 소규모 폐쇄형 서비스"],
    ], w
  ));
}

children.push(h2("2.3 서비스 범위"));
{
  const w = [2400, 6626];
  children.push(makeTable(
    ["구분", "내용"],
    [
      ["포함 (In)", "물품/재능 글 등록·조회·검색, 관심 표시, 1:1 채팅, 거래 상태 관리, 마이페이지"],
      ["제외 (Out)", "앱 내 결제·정산(현장 직거래 전제), 배송, 외부인 거래, 실시간 위치기반 기능"],
    ], w
  ));
}
children.push(spacer());
children.push(body("※ 결제·정산을 서비스에서 제외한 것은 의도적 설계다. 앱 내 결제를 도입하면 전자금융거래법 등 규제 검토 부담이 크게 늘어나므로, 초기에는 계좌이체·현금 등 현장 직거래를 전제로 하여 법적 부담을 최소화한다.", { color: GREY }));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 3. 기능 목록 =====
children.push(h1("3", "기능 목록"));
children.push(h2("3.1 MVP 필수 기능"));
children.push(body("아래 기능은 프로토타입에서 이미 화면·흐름이 구현되어 클릭 검증까지 완료된 항목이다.", { color: GREY }));
{
  const w = [1500, 2600, 3626, 1300];
  children.push(makeTable(
    ["분류", "기능", "설명", "우선순위"],
    [
      ["계정", "이메일 인증 로그인", "원내 이메일 도메인 확인으로 직원 신원 검증(초기: 도메인 확인, 이후: SSO/인증코드)", "필수"],
      ["매물", "글 등록", "사진, 제목, 카테고리, 거래방식(판매/나눔/재능교환), 가격, 설명 입력", "필수"],
      ["매물", "목록·검색·필터", "최신순 목록, 키워드 검색, 카테고리 필터, 관심·채팅 수 표시", "필수"],
      ["매물", "상세 보기", "사진, 판매자 정보·매너온도, 상세 설명, 관심/채팅 진입", "필수"],
      ["매물", "거래 상태 관리", "판매중 · 예약중 · 거래완료 상태 전환(판매자)", "필수"],
      ["관심", "찜(하트)", "관심 매물 저장 및 마이페이지에서 모아보기", "필수"],
      ["소통", "1:1 채팅", "구매 희망자와 판매자 간 대화(실서비스: 실시간 서버 연동)", "필수"],
      ["마이", "마이페이지", "내 판매글·관심목록·매너온도, 로그아웃", "필수"],
      ["공통", "다크모드·반응형", "라이트/다크 테마(시스템 설정 존중), 모바일 최적화, 설치형(PWA)", "필수"],
    ], w
  ));
}

children.push(h2("3.2 향후 확장 기능"));
{
  const w = [2600, 4826, 1600];
  children.push(makeTable(
    ["기능", "설명", "우선순위"],
    [
      ["신고·차단", "부적절 게시물/이용자 신고, 관리자 제재", "높음"],
      ["푸시 알림", "채팅·관심 매물 상태 변경 알림", "높음"],
      ["예약·거래 확정", "거래 약속 시간/장소 기록, 완료 후 상호 후기", "중간"],
      ["매너온도·후기", "거래 상대 평가로 신뢰 지표 축적", "중간"],
      ["카테고리 확장", "동호회·스터디·나눔 이벤트 등 원내 특화 카테고리", "낮음"],
      ["관리자 대시보드", "이용 통계, 신고 처리, 공지 관리", "중간"],
    ], w
  ));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 4. 화면 구성 =====
children.push(h1("4", "화면 구성"));
children.push(h2("4.1 정보 구조 및 화면 흐름"));
children.push(body("하단 3개 탭(홈 · 채팅 · 나의거래)을 중심으로 한 단순한 구조로, 학습 없이 바로 사용할 수 있도록 설계했다.", { color: GREY }));
children.push(bullet("로그인 → [홈] 매물 목록", 0, "flow"));
children.push(bullet("홈 → 매물 상세 → (관심 저장 / 채팅하기)", 0, "flow"));
children.push(bullet("홈 → 글쓰기 → 등록 완료 → 상세", 0, "flow"));
children.push(bullet("채팅 목록 → 채팅방(거래 대화)", 0, "flow"));
children.push(bullet("나의거래(마이) → 내 판매글 / 관심목록 / 설정", 0, "flow"));

children.push(h2("4.2 화면별 설명"));
{
  const w = [1900, 3200, 3926];
  children.push(makeTable(
    ["화면", "주요 구성", "핵심 동작"],
    [
      ["로그인", "로고, 회사 이메일 입력, 데모 둘러보기", "도메인 검증 후 진입 / 미인증 차단"],
      ["홈(목록)", "검색바, 카테고리 칩, 매물 카드 리스트, 글쓰기 버튼", "검색·필터·정렬, 상세 진입, 글쓰기"],
      ["매물 상세", "대표 이미지, 판매자·매너온도, 가격, 설명, 하단 액션바", "관심 토글, 채팅 시작, 상태 변경(본인)"],
      ["글쓰기", "사진 업로드, 제목, 카테고리, 거래방식, 가격, 설명", "입력 검증 후 등록"],
      ["채팅 목록", "대화 상대·매물·최근 메시지·시간", "채팅방 진입"],
      ["채팅방", "매물 요약 바, 말풍선 대화, 입력창", "메시지 송수신"],
      ["마이페이지", "프로필·매너온도, 통계, 판매·관심 목록, 설정", "테마 전환, 데이터 초기화, 로그아웃"],
    ], w
  ));
}
children.push(spacer());
children.push(body("※ 위 7개 화면은 프로토타입으로 실제 구현되어 라이트/다크 모드와 모바일 화면에서 동작을 확인했다. 별도 화면 캡처(홈·상세·채팅·다크모드)를 함께 제출한다.", { color: GREY }));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 5. 기술 구성 =====
children.push(h1("5", "기술 구성"));
children.push(h2("5.1 프로토타입 구성 (현재)"));
{
  const w = [2400, 6626];
  children.push(makeTable(
    ["항목", "내용"],
    [
      ["형태", "설치형 웹앱(PWA) — 앱스토어 심사·수수료 없이 URL로 배포, 홈 화면 추가 가능"],
      ["구현", "순수 HTML/CSS/JavaScript (프레임워크 미사용)"],
      ["데이터", "브라우저 localStorage에 저장 — 서버·외부 전송 없음(각 기기에 국한)"],
      ["인증", "원내 이메일 도메인 확인(목업)"],
    ], w
  ));
}
children.push(h2("5.2 실서비스 아키텍처 방향"));
children.push(bullet("클라이언트: 현재 PWA를 그대로 확장(반응형·설치형 유지)", 0, "tech"));
children.push(bullet("백엔드: 인증·데이터·채팅을 담당하는 API 서버 + 데이터베이스 도입", 0, "tech"));
children.push(bullet("인증: 사내 SSO(가능 시) 또는 이메일 인증코드 방식으로 대체", 0, "tech"));
children.push(bullet("채팅: 실시간 통신(WebSocket 등) 기반으로 재구현", 0, "tech"));
children.push(bullet("배포: 사내망 vs 외부 클라우드 — 정보보안 정책에 따라 결정", 0, "tech"));
children.push(spacer());
children.push(body("프로토타입의 데이터 계층(store)은 화면 로직과 분리되어 있어, 이 계층만 백엔드 API 호출로 교체하면 화면 재사용이 가능하도록 설계했다.", { color: GREY }));

children.push(h2("5.3 기술 원칙"));
children.push(bullet("외부 런타임 의존성 최소화, 가벼운 순수 웹 기술 우선", 0, "tech"));
children.push(bullet("가독성·접근성(WCAG AA)·모바일 우선 반응형 준수", 0, "tech"));
children.push(bullet("개인정보는 최소 수집, 목적 외 이용 금지", 0, "tech"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 6. 추진 일정 =====
children.push(h1("6", "추진 일정"));
children.push(body("아래는 MVP를 실서비스로 전환하기 위한 단계별 일정(안)이다. 기간은 소규모 개발 인력 기준의 추정치이며, 보안 검토·의사결정 소요에 따라 조정될 수 있다.", { color: GREY }));
{
  const w = [1050, 2000, 4076, 1900];
  children.push(makeTable(
    ["단계", "기간(안)", "주요 활동", "산출물"],
    [
      ["0. 검토", "1주", "본 제안서 기반 기획 합의, 요구사항 확정, 배포 방식 결정", "확정 요구사항서"],
      ["1. 보안검토", "1–2주", "개인정보·정보보안 부서 협의, 개인정보 처리방침 초안", "보안 검토 결과, 승인"],
      ["2. 설계", "1–2주", "백엔드·DB·인증·채팅 설계, 화면 상세 확정", "설계 문서"],
      ["3. 개발", "3–4주", "API·DB 구축, 프로토타입 연동, 인증·채팅 구현", "동작 가능한 베타"],
      ["4. 내부테스트", "1–2주", "소규모 부서 파일럿, 신고·관리자 기능 점검, 버그 수정", "파일럿 결과"],
      ["5. 오픈", "1주", "전 직원 대상 정식 오픈, 공지·가이드 배포", "정식 서비스"],
    ], w
  ));
}
children.push(spacer());
children.push(body("※ 프로토타입이 이미 완성되어 화면·흐름 논의를 즉시 시작할 수 있으므로, 0~1단계(검토·보안협의)를 우선 진행할 것을 제안한다.", { color: GREY }));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 7. 보안 및 개인정보 검토 항목 =====
children.push(h1("7", "보안 및 개인정보 검토 항목"));
children.push(body("원내 직원 정보를 다루는 만큼, 개발 착수 전 정보보안·개인정보 담당 부서의 검토·승인을 전제로 한다. 주요 검토 항목은 다음과 같다.", { color: GREY }));

children.push(h2("7.1 개인정보 보호"));
{
  const w = [2500, 3626, 2900];
  children.push(makeTable(
    ["항목", "내용", "대응 방향"],
    [
      ["수집 항목 최소화", "이름·부서·이메일 등 최소 정보만 수집", "목적 외 항목 미수집, 수집 근거 명시"],
      ["처리방침·동의", "개인정보 처리방침 수립 및 이용 동의 절차", "가입 시 동의, 방침 게시"],
      ["보관·파기", "탈퇴·미이용 계정의 정보 보관기간·파기 기준", "보관기간 설정, 자동 파기"],
      ["연락처 노출", "판매자·구매자 연락처 직접 노출 최소화", "앱 내 채팅으로 대체, 전화번호 비공개"],
      ["열람·정정권", "본인 정보 열람·수정·삭제 요구 대응", "마이페이지 제공, 처리 절차 마련"],
    ], w
  ));
}

children.push(h2("7.2 정보 보안"));
{
  const w = [2500, 6526];
  children.push(makeTable(
    ["항목", "내용"],
    [
      ["인증·접근통제", "원내 직원만 접근 가능하도록 인증 강화(사내 SSO 또는 이메일 인증코드), 세션 관리"],
      ["전송·저장 암호화", "HTTPS 전 구간 적용, 민감 데이터 저장 시 암호화"],
      ["배포 환경", "사내망 내부 배포 vs 외부 클라우드 여부를 보안 정책에 따라 결정"],
      ["로그·감사", "접근·거래·신고 이력 기록, 이상행위 모니터링"],
      ["콘텐츠 안전", "이미지·게시물 업로드 시 용량·형식 제한, 악성 파일 차단"],
      ["취약점 점검", "오픈 전 보안 점검(취약점 진단) 수행"],
    ], w
  ));
}

children.push(h2("7.3 법적·규제 검토"));
{
  const w = [2500, 6526];
  children.push(makeTable(
    ["항목", "내용"],
    [
      ["결제 규제", "앱 내 결제 미도입(현장 직거래 전제)으로 전자금융 규제 부담 회피 — 향후 도입 시 별도 검토"],
      ["거래 책임", "개인 간 거래로 발생하는 분쟁·하자에 대한 기관·운영자 면책 범위 고지"],
      ["금지 품목", "주류·의약품 등 개인 간 거래 부적합/불법 품목 등록 제한 정책 수립"],
      ["기관 정책 부합", "복무·윤리 규정 등 내부 규정과의 정합성 확인"],
    ], w
  ));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 8. 운영 방안 =====
children.push(h1("8", "운영 방안"));
children.push(h2("8.1 운영 주체·역할"));
children.push(bullet("운영 담당(부서/담당자) 지정 — 공지, 이용 안내, 문의 대응", 0, "ops"));
children.push(bullet("관리자 기능 — 신고 처리, 게시물 관리, 이용 제한", 0, "ops"));
children.push(h2("8.2 이용 정책"));
children.push(bullet("이용 수칙·거래 예절 가이드 게시(안전 직거래 장소로 원내 로비 등 권장)", 0, "ops"));
children.push(bullet("신고 3진 아웃 등 제재 기준, 금지 품목·행위 명시", 0, "ops"));
children.push(bullet("분쟁 발생 시 처리 절차 및 기관 면책 범위 안내", 0, "ops"));

// ===== 9. 리스크 및 대응 =====
children.push(h2("9. 리스크 및 대응"));
{
  const w = [3200, 5826];
  children.push(makeTable(
    ["리스크", "대응 방향"],
    [
      ["초기 이용자·매물 부족", "오픈 이벤트, 관심 부서 파일럿, 나눔 캠페인으로 초기 활성화"],
      ["개인 간 거래 분쟁", "안전 거래 가이드, 채팅 이력 보존, 면책 고지, 신고 절차"],
      ["부적절 게시물", "신고·관리자 제재, 금지 품목 정책, 업로드 제한"],
      ["개인정보·보안 사고", "최소 수집·암호화·접근통제, 사전 보안 점검, 사고 대응 절차"],
      ["운영 리소스 부담", "관리자 자동화 도구, 명확한 담당 지정, 단계적 확장"],
    ], w
  ));
}

// ===== 10. 결론 =====
children.push(h1("10", "결론 및 제언"));
children.push(body("‘인천연구원 나눔장터’는 원내 직원이라는 신뢰 기반 덕분에 외부 중고 플랫폼 대비 훨씬 단순한 구성으로도 실효성 있는 서비스를 구축할 수 있다. 이미 클릭 가능한 프로토타입이 완성되어 화면·흐름을 즉시 검토·합의할 수 있는 상태이며, 결제·배송 등 규제 부담 요소를 제외해 법적·기술적 리스크를 낮췄다."));
children.push(body("다음 단계로 (1) 본 제안서를 토대로 기능·화면을 확정하고, (2) 정보보안·개인정보 부서 검토를 우선 진행한 뒤, (3) 백엔드 연동 개발과 소규모 파일럿을 거쳐 정식 오픈할 것을 제안한다."));
children.push(spacer(200));
children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 300 },
  children: [t("— 이상 —", { color: GREY, size: 20 })] }));

// ================= 문서 조립 =================
const doc = new Document({
  creator: "인천연구원",
  title: "인천연구원 나눔장터 기획·제안서",
  description: "원내 직원 전용 중고물품·재능 거래 플랫폼 제안서",
  styles: {
    default: {
      document: { run: { font: FONT, size: 20, color: "222222" } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 26, bold: true, color: NAVY } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 22, bold: true, color: NAVY } },
    ],
  },
  numbering: {
    config: ["biz", "flow", "tech", "ops"].map((ref) => ({
      reference: ref,
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 240 } }, run: { color: ACCENT } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 240 } }, run: { color: ACCENT } } },
      ],
    })),
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "인천연구원 나눔장터 기획·제안서   |   ", font: FONT, size: 16, color: "999999" }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "999999" }),
        ] })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || "output.docx";
  fs.writeFileSync(out, buf);
  console.log("WROTE " + out + " (" + buf.length + " bytes)");
});

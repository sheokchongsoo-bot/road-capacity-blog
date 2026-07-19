/* =============================================================
   Store — localStorage 기반 간이 데이터 계층 (프로토타입)
   실제 배포에서는 이 계층을 서버 API로 교체한다.
   외부에 window.Store 하나만 노출한다.
   ============================================================= */
(function () {
  "use strict";

  var KEY = "ii-market:v1";
  var EMAIL_DOMAIN = "ii.re.kr"; // 인천연구원 예시 도메인 (실제 도메인으로 교체)

  // ---------- 카테고리 정의 ----------
  var CATEGORIES = [
    { id: "digital", label: "디지털/가전", emoji: "💻" },
    { id: "furniture", label: "가구/생활", emoji: "🪑" },
    { id: "book", label: "도서/자료", emoji: "📚" },
    { id: "ticket", label: "티켓/기프티콘", emoji: "🎟️" },
    { id: "etc", label: "기타 물품", emoji: "📦" },
    { id: "talent", label: "재능/품앗이", emoji: "🤝" }
  ];

  function catOf(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return { id: "etc", label: "기타", emoji: "📦" };
  }

  // ---------- 시드 데이터 ----------
  // createdAt 은 "지금으로부터 N분 전" 오프셋(분)으로 저장하고,
  // 표시할 때 로드 시각 기준으로 상대시간을 계산한다.
  function seed() {
    var users = {
      u_kim: { id: "u_kim", name: "김도현", dept: "교통물류연구실", email: "kim@" + EMAIL_DOMAIN, temp: 39.5 },
      u_lee: { id: "u_lee", name: "이서연", dept: "도시공간연구실", email: "lee@" + EMAIL_DOMAIN, temp: 42.1 },
      u_park: { id: "u_park", name: "박준영", dept: "경제환경연구실", email: "park@" + EMAIL_DOMAIN, temp: 36.5 },
      u_choi: { id: "u_choi", name: "최민지", dept: "행정지원팀", email: "choi@" + EMAIL_DOMAIN, temp: 40.8 }
    };

    var L = [];
    function add(o) { L.push(o); }

    add({ id: "l1", sellerId: "u_lee", title: "로지텍 MX 무선 마우스 (거의 새것)",
      category: "digital", priceType: "sale", price: 35000, status: "selling",
      minutesAgo: 12, likes: ["u_park"], chats: 2, emoji: "🖱️",
      desc: "재택 정리하면서 내놓습니다. 작년 12월 구입, 생활기스 거의 없어요.\n원내 직거래(본관 로비) 선호합니다. 박스/영수증 있습니다." });

    add({ id: "l2", sellerId: "u_kim", title: "이케아 사무용 의자 무료 나눔",
      category: "furniture", priceType: "free", price: 0, status: "selling",
      minutesAgo: 45, likes: ["u_choi", "u_park"], chats: 5, emoji: "🪑",
      desc: "이사로 정리합니다. 상태 양호하고 바퀴 잘 굴러가요.\n무거워서 직접 가져가실 분만! 지하주차장에서 인계 가능합니다." });

    add({ id: "l3", sellerId: "u_park", title: "『도시교통계획』 전공서적 + 필기노트",
      category: "book", priceType: "sale", price: 12000, status: "reserved",
      minutesAgo: 130, likes: [], chats: 1, emoji: "📚",
      desc: "교통 분야 입문용으로 좋습니다. 형광펜 필기 조금 있어요.\n필요하신 분께 저렴하게 넘깁니다." });

    add({ id: "l4", sellerId: "u_choi", title: "스타벅스 아메리카노 기프티콘 2장",
      category: "ticket", priceType: "sale", price: 7000, status: "selling",
      minutesAgo: 200, likes: ["u_kim"], chats: 0, emoji: "🎟️",
      desc: "선물 받았는데 안 마셔서 내놓습니다. 유효기간 넉넉합니다(내년까지).\n2장 묶음 7,000원, 카톡으로 바로 전송해 드려요." });

    add({ id: "l5", sellerId: "u_kim", title: "[재능] 엑셀·데이터 정리 도와드립니다 (품앗이)",
      category: "talent", priceType: "talent", price: 0, status: "selling",
      minutesAgo: 320, likes: ["u_lee", "u_choi"], chats: 3, emoji: "📊",
      desc: "피벗테이블, 함수, 간단한 매크로까지 도와드려요.\n대가는 커피 한 잔 or 다른 재능 교환(PPT 디자인, 사진 보정 등) 환영합니다!" });

    add({ id: "l6", sellerId: "u_lee", title: "몬스테라 화분 나눔 (새끼 화분)",
      category: "etc", priceType: "free", price: 0, status: "sold",
      minutesAgo: 1500, likes: [], chats: 4, emoji: "🪴",
      desc: "잘 자라서 분갈이했어요. 사무실에 두기 좋은 크기입니다.\n초보도 키우기 쉬워요. (나눔 완료)" });

    add({ id: "l7", sellerId: "u_park", title: "[재능] 논문/보고서 영문 교정 봐드려요",
      category: "talent", priceType: "talent", price: 0, status: "selling",
      minutesAgo: 2600, likes: ["u_kim"], chats: 1, emoji: "✍️",
      desc: "영어권 거주 경험 있습니다. 초록·요약 수준 교정 가능해요.\n급하지 않은 분, 재능 교환 또는 점심 한 끼로!" });

    return {
      users: users,
      listings: L,
      chats: [],           // {id, listingId, buyerId, sellerId, messages:[{from, text, minutesAgo}]}
      session: null,       // 로그인 사용자 id
      liked: {},           // 데모 로그인 사용자의 관심 목록 오버레이
      loadedAt: Date.now()
    };
  }

  // ---------- 로드 / 저장 ----------
  var db = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { db = JSON.parse(raw); }
    } catch (e) { db = null; }
    if (!db || !db.listings) {
      db = seed();
      save();
    }
    return db;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { /* 용량 초과 등은 프로토타입에서 무시 */ }
  }

  // ---------- 상대 시간 ----------
  // 시드는 minutesAgo(분)로 저장, 사용자 생성분은 절대 createdAt(ms)로 저장.
  function minutesSince(item) {
    if (typeof item.createdAt === "number") {
      return Math.max(0, Math.round((Date.now() - item.createdAt) / 60000));
    }
    return item.minutesAgo || 0;
  }

  function relTime(min) {
    if (min < 1) return "방금 전";
    if (min < 60) return min + "분 전";
    var h = Math.floor(min / 60);
    if (h < 24) return h + "시간 전";
    var d = Math.floor(h / 24);
    if (d < 30) return d + "일 전";
    return Math.floor(d / 30) + "개월 전";
  }

  // ---------- 조회 헬퍼 ----------
  function currentUser() {
    if (!db.session) return null;
    return db.users[db.session] || null;
  }
  function isLoggedIn() { return !!currentUser(); }

  function getUser(id) { return db.users[id] || { id: id, name: "알 수 없음", dept: "", temp: 36.5 }; }

  function getListing(id) {
    return db.listings.filter(function (l) { return l.id === id; })[0] || null;
  }

  function listListings(opts) {
    opts = opts || {};
    var q = (opts.q || "").trim().toLowerCase();
    var cat = opts.category || "all";
    var out = db.listings.slice();

    if (cat !== "all") out = out.filter(function (l) { return l.category === cat; });
    if (q) {
      out = out.filter(function (l) {
        return (l.title + " " + (l.desc || "")).toLowerCase().indexOf(q) !== -1;
      });
    }
    // 최신순(작성 후 경과 분이 작을수록 위로)
    out.sort(function (a, b) { return minutesSince(a) - minutesSince(b); });
    return out;
  }

  function likedBy(listing, userId) {
    return (listing.likes || []).indexOf(userId) !== -1;
  }

  function toggleLike(listingId) {
    var u = currentUser(); if (!u) return false;
    var l = getListing(listingId); if (!l) return false;
    l.likes = l.likes || [];
    var i = l.likes.indexOf(u.id);
    var on;
    if (i === -1) { l.likes.push(u.id); on = true; }
    else { l.likes.splice(i, 1); on = false; }
    save();
    return on;
  }

  function myListings(userId) {
    return db.listings.filter(function (l) { return l.sellerId === userId; })
      .sort(function (a, b) { return minutesSince(a) - minutesSince(b); });
  }

  function myLikes(userId) {
    return db.listings.filter(function (l) { return likedBy(l, userId); });
  }

  // ---------- 생성/수정 ----------
  function createListing(data) {
    var u = currentUser();
    var id = "l_" + Date.now().toString(36);
    var l = {
      id: id,
      sellerId: u ? u.id : "u_kim",
      title: data.title,
      category: data.category,
      priceType: data.priceType,
      price: data.price || 0,
      status: "selling",
      createdAt: Date.now(),
      likes: [],
      chats: 0,
      emoji: catOf(data.category).emoji,
      photo: data.photo || null,   // dataURL 또는 null
      desc: data.desc || ""
    };
    db.listings.unshift(l);
    save();
    return l;
  }

  function cycleStatus(listingId) {
    var l = getListing(listingId); if (!l) return null;
    var order = ["selling", "reserved", "sold"];
    var i = order.indexOf(l.status);
    l.status = order[(i + 1) % order.length];
    save();
    return l.status;
  }

  // ---------- 채팅 ----------
  function getChat(id) {
    return db.chats.filter(function (c) { return c.id === id; })[0] || null;
  }

  // 특정 매물에 대해 현재 사용자와 판매자 간 채팅방을 찾거나 생성
  function openChatForListing(listingId) {
    var u = currentUser(); if (!u) return null;
    var l = getListing(listingId); if (!l) return null;
    if (l.sellerId === u.id) return null; // 본인 매물

    var found = db.chats.filter(function (c) {
      return c.listingId === listingId && c.buyerId === u.id;
    })[0];
    if (found) return found;

    var c = {
      id: "c_" + Date.now().toString(36),
      listingId: listingId,
      buyerId: u.id,
      sellerId: l.sellerId,
      messages: [
        { from: "system", text: "채팅을 시작했어요. 예의를 지켜 대화해 주세요 🙂", createdAt: Date.now() }
      ]
    };
    db.chats.unshift(c);
    l.chats = (l.chats || 0) + 1;
    save();
    return c;
  }

  function myChats(userId) {
    return db.chats.filter(function (c) {
      return c.buyerId === userId || c.sellerId === userId;
    });
  }

  function sendMessage(chatId, text) {
    var c = getChat(chatId); if (!c) return;
    var u = currentUser();
    c.messages.push({ from: u.id, text: text, createdAt: Date.now() });
    save();

    // 프로토타입용 자동 응답 (상대방 흉내)
    var otherId = (c.buyerId === u.id) ? c.sellerId : c.buyerId;
    var replies = [
      "네 안녕하세요! 아직 있습니다 :)",
      "원내 직거래 가능하세요? 본관 로비 어떠세요?",
      "넵 좋아요. 시간 맞춰서 뵐게요!",
      "확인했습니다. 감사합니다 🙏"
    ];
    var idx = c.messages.filter(function (m) { return m.from === otherId; }).length;
    var reply = replies[Math.min(idx, replies.length - 1)];
    return { otherId: otherId, reply: reply };
  }

  function pushReply(chatId, fromId, text) {
    var c = getChat(chatId); if (!c) return;
    c.messages.push({ from: fromId, text: text, createdAt: Date.now() });
    save();
  }

  // ---------- 인증(목업) ----------
  function login(email) {
    email = (email || "").trim().toLowerCase();
    if (email.indexOf("@") === -1) {
      return { ok: false, error: "이메일 형식이 올바르지 않습니다." };
    }
    var domain = email.split("@")[1];
    if (domain !== EMAIL_DOMAIN) {
      return { ok: false, error: "인천연구원 이메일(@" + EMAIL_DOMAIN + ")만 가입할 수 있어요." };
    }
    // 기존 사용자면 재사용, 없으면 임시 계정 생성
    var existing = null;
    for (var k in db.users) {
      if (db.users[k].email === email) { existing = db.users[k]; break; }
    }
    if (!existing) {
      var id = "u_" + Date.now().toString(36);
      var name = email.split("@")[0];
      db.users[id] = { id: id, name: name, dept: "원내 직원", email: email, temp: 36.5 };
      existing = db.users[id];
    }
    db.session = existing.id;
    save();
    return { ok: true, user: existing };
  }

  function demoLogin() {
    db.session = "u_choi"; // 데모 사용자
    save();
    return db.users.u_choi;
  }

  function logout() { db.session = null; save(); }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    db = seed(); save();
  }

  // ---------- 노출 ----------
  window.Store = {
    EMAIL_DOMAIN: EMAIL_DOMAIN,
    CATEGORIES: CATEGORIES,
    catOf: catOf,
    load: load,
    save: save,
    relTime: relTime,
    minutesSince: minutesSince,
    currentUser: currentUser,
    isLoggedIn: isLoggedIn,
    getUser: getUser,
    getListing: getListing,
    listListings: listListings,
    likedBy: likedBy,
    toggleLike: toggleLike,
    myListings: myListings,
    myLikes: myLikes,
    createListing: createListing,
    cycleStatus: cycleStatus,
    getChat: getChat,
    openChatForListing: openChatForListing,
    myChats: myChats,
    sendMessage: sendMessage,
    pushReply: pushReply,
    login: login,
    demoLogin: demoLogin,
    logout: logout,
    reset: reset
  };
})();

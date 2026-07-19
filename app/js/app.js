/* =============================================================
   App — 해시 라우터 + 화면 렌더링 (순수 JS)
   #/            홈(목록)
   #/post/:id    매물 상세
   #/new         글쓰기
   #/chats       채팅 목록
   #/chat/:id    채팅방
   #/me          마이페이지
   (미로그인 시 로그인 화면 강제)
   ============================================================= */
(function () {
  "use strict";

  var S = window.Store;
  S.load();

  var app = document.getElementById("app");

  // ---------- 인라인 SVG 아이콘 ----------
  var I = {
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9.6 9.6 0 0 1-4-.9L3 21l1.9-4.5a8.38 8.38 0 0 1-.9-4A8.5 8.5 0 0 1 21 11.5z"/></svg>',
    user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>',
    back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2.2 5.5 5.6 5.5 7.7 5.5 9 6.8 12 9c3-2.2 4.3-3.5 6.4-3.5 3.4 0 5 3.4 3.6 6.3C19.5 16.4 12 21 12 21z"/></svg>',
    heartLine: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2.2 5.5 5.6 5.5 7.7 5.5 9 6.8 12 9c3-2.2 4.3-3.5 6.4-3.5 3.4 0 5 3.4 3.6 6.3C19.5 16.4 12 21 12 21z"/></svg>',
    chatSmall: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9.6 9.6 0 0 1-4-.9L3 21l1.9-4.5a8.38 8.38 0 0 1-.9-4A8.5 8.5 0 0 1 21 11.5z"/></svg>',
    heartSmall: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2.2 5.5 5.6 5.5 7.7 5.5 9 6.8 12 9c3-2.2 4.3-3.5 6.4-3.5 3.4 0 5 3.4 3.6 6.3C19.5 16.4 12 21 12 21z"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    pin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    sun: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
    moon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
  };

  // ---------- 유틸 ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function won(n) { return n.toLocaleString("ko-KR") + "원"; }

  function priceLabel(l) {
    if (l.priceType === "free") return '<span class="tag free">나눔</span>';
    if (l.priceType === "talent") return '<span class="tag talent">재능교환</span>';
    return won(l.price);
  }
  function priceLabelBig(l) {
    if (l.priceType === "free") return '나눔 <span class="tag free" style="vertical-align:middle">무료</span>';
    if (l.priceType === "talent") return '재능교환 <span class="tag talent" style="vertical-align:middle">품앗이</span>';
    return won(l.price);
  }

  function statusBadge(l) {
    if (l.status === "selling") return "";
    var t = l.status === "reserved" ? "예약중" : "거래완료";
    return '<span class="status-badge ' + l.status + '">' + t + "</span> ";
  }

  function thumb(l, cls) {
    var inner = l.photo
      ? '<img src="' + l.photo + '" alt="">'
      : esc(l.emoji || "📦");
    return '<div class="thumb ' + (cls || "") + '">' + inner + "</div>";
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function go(hash) { location.hash = hash; }

  // ---------- 테마 ----------
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("ii-market:theme", next); } catch (e) {}
  }
  function themeIcon() { return currentTheme() === "dark" ? I.sun : I.moon; }

  // ---------- 셸 조립 헬퍼 ----------
  function shell(opts) {
    // opts: { header, main, tab, mainClass }
    var header = opts.header || "";
    var main = '<main class="app-main ' + (opts.mainClass || "") + '">' + opts.main + "</main>";
    var tab = opts.tab ? tabbar(opts.tab) : "";
    app.innerHTML = header + main + tab + (opts.after || "");
  }

  function tabbar(active) {
    var unread = 0; // 프로토타입: 채팅 뱃지는 채팅방 수로 간단 표기
    var u = S.currentUser();
    if (u) unread = S.myChats(u.id).length;
    var badge = unread ? '<span class="badge">' + unread + "</span>" : "";
    function item(hash, icon, label, on, extra) {
      return '<a href="' + hash + '" class="' + (on ? "active" : "") + '">' +
        (extra || "") + icon + "<span>" + label + "</span></a>";
    }
    return '<nav class="tabbar">' +
      item("#/", I.home, "홈", active === "home") +
      item("#/chats", I.chat, "채팅", active === "chats", badge) +
      item("#/me", I.user, "나의거래", active === "me") +
      "</nav>";
  }

  function topHeader(title, opts) {
    opts = opts || {};
    var left = opts.back
      ? '<button class="icon-btn" data-back aria-label="뒤로">' + I.back + "</button>"
      : "";
    var right = opts.right || "";
    var titleHtml = opts.locTitle
      ? '<h1><span class="loc">' + I.pin + " 인천연구원</span></h1>"
      : "<h1>" + esc(title) + "</h1>";
    return '<header class="app-header">' + left + titleHtml + right + "</header>";
  }

  var themeBtn = '<button class="icon-btn" data-theme-toggle aria-label="테마 전환">__ICON__</button>';
  function themeBtnHtml() { return themeBtn.replace("__ICON__", themeIcon()); }

  // =============================================================
  //  로그인 화면
  // =============================================================
  function viewLogin() {
    app.innerHTML =
      '<div class="login">' +
        '<div class="logo">🥕</div>' +
        "<h1>인천연구원 나눔장터</h1>" +
        '<p class="lead">원내 직원끼리 안전하게<br>중고물품과 재능을 나눠요</p>' +
        '<form id="loginForm" novalidate>' +
          '<input id="email" type="email" inputmode="email" autocomplete="email" ' +
            'placeholder="회사 이메일 (예: hong@' + S.EMAIL_DOMAIN + ')" />' +
          '<div class="err" id="loginErr"></div>' +
          '<button class="btn primary" type="submit">회사 이메일로 시작하기</button>' +
        "</form>" +
        '<div class="divider">또는</div>' +
        '<button class="btn ghost" id="demoBtn">데모 계정으로 둘러보기</button>' +
        '<p class="foot">프로토타입입니다. 실제 인증·데이터 저장은 브라우저에만 이뤄지며 외부로 전송되지 않습니다.</p>' +
      "</div>";

    document.getElementById("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value;
      var res = S.login(email);
      if (!res.ok) { document.getElementById("loginErr").textContent = res.error; return; }
      toast("환영합니다, " + res.user.name + "님!");
      go("#/");
    });
    document.getElementById("demoBtn").addEventListener("click", function () {
      var u = S.demoLogin();
      toast(u.name + "님으로 둘러봅니다");
      go("#/");
    });
  }

  // =============================================================
  //  홈 (목록)
  // =============================================================
  var homeState = { q: "", category: "all" };

  function viewHome() {
    var header = topHeader("", {
      locTitle: true,
      right: themeBtnHtml()
    });

    var chips = '<button class="chip ' + (homeState.category === "all" ? "on" : "") +
      '" data-cat="all">전체</button>';
    S.CATEGORIES.forEach(function (c) {
      chips += '<button class="chip ' + (homeState.category === c.id ? "on" : "") +
        '" data-cat="' + c.id + '">' + c.emoji + " " + esc(c.label) + "</button>";
    });

    var listHtml = renderList();

    var main =
      '<div class="search-bar">' +
        '<div class="field">' + I.search +
          '<input id="q" type="search" placeholder="어떤 물건이나 재능을 찾으세요?" value="' + esc(homeState.q) + '">' +
        "</div>" +
      "</div>" +
      '<div class="filters">' + chips + "</div>" +
      '<div id="list">' + listHtml + "</div>";

    var fab = '<button class="fab" data-new>' + I.plus + " 글쓰기</button>";

    shell({ header: header, main: main, tab: "home", after: fab });

    // 이벤트
    var q = document.getElementById("q");
    q.addEventListener("input", function () {
      homeState.q = q.value;
      document.getElementById("list").innerHTML = renderList();
    });
    app.querySelectorAll("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        homeState.category = b.getAttribute("data-cat");
        viewHome();
      });
    });
  }

  function renderList() {
    var items = S.listListings(homeState);
    if (!items.length) {
      return '<div class="empty"><div class="big">🔍</div>조건에 맞는 글이 없어요.<br>다른 키워드로 찾아보세요.</div>';
    }
    return items.map(function (l) {
      var seller = S.getUser(l.sellerId);
      var min = S.minutesSince(l);
      var likes = (l.likes || []).length;
      var stats = "";
      if (l.chats) stats += '<span>' + I.chatSmall + " " + l.chats + "</span>";
      if (likes) stats += '<span>' + I.heartSmall + " " + likes + "</span>";
      return '<a class="listing" href="#/post/' + l.id + '">' +
        thumb(l) +
        '<div class="body">' +
          '<div class="title">' + esc(l.title) + "</div>" +
          '<div class="meta">' + esc(seller.dept) + " · " + S.relTime(min) + "</div>" +
          '<div class="price">' + statusBadge(l) + priceLabel(l) + "</div>" +
          (stats ? '<div class="stats">' + stats + "</div>" : "") +
        "</div>" +
      "</a>";
    }).join("");
  }

  // =============================================================
  //  상세
  // =============================================================
  function viewPost(id) {
    var l = S.getListing(id);
    if (!l) { notFound(); return; }
    var seller = S.getUser(l.sellerId);
    var me = S.currentUser();
    var mine = me && me.id === l.sellerId;
    var liked = me && S.likedBy(l, me.id);
    var min = S.minutesSince(l);

    var header = topHeader("", { back: true, right: themeBtnHtml() });

    var hero = '<div class="detail-hero">' +
      (l.photo ? '<img src="' + l.photo + '" alt="">' : esc(l.emoji || "📦")) + "</div>";

    var tempPct = Math.max(0, Math.min(100, (seller.temp / 99) * 100));
    var sellerBlock =
      '<div class="seller">' +
        '<div class="avatar">' + esc(seller.name.slice(0, 1)) + "</div>" +
        '<div class="who"><div class="name">' + esc(seller.name) + "</div>" +
          '<div class="sub">' + esc(seller.dept) + "</div></div>" +
        '<div class="temp"><span class="val">' + seller.temp.toFixed(1) + "°C</span>" +
          '<div class="bar"><i style="width:' + tempPct + '%"></i></div>' +
          "<div>매너온도</div></div>" +
      "</div>";

    var cat = S.catOf(l.category);
    var body =
      '<div class="detail-body">' +
        "<h2>" + statusBadge(l) + esc(l.title) + "</h2>" +
        '<div class="cat">' + cat.emoji + " " + esc(cat.label) + " · " + S.relTime(min) + "</div>" +
        '<div class="price-row">' + priceLabelBig(l) + "</div>" +
        '<div class="desc">' + esc(l.desc) + "</div>" +
        '<div class="stats" style="margin-top:18px;color:var(--text-faint);font-size:.8rem;display:flex;gap:14px">' +
          "<span>관심 " + (l.likes || []).length + "</span><span>채팅 " + (l.chats || 0) + "</span>" +
        "</div>" +
      "</div>";

    var actions;
    if (mine) {
      actions =
        '<div class="action-bar">' +
          '<button class="btn ghost" data-status style="flex:1">상태 변경 (' +
            (l.status === "selling" ? "판매중" : l.status === "reserved" ? "예약중" : "거래완료") + ")</button>" +
        "</div>";
    } else {
      actions =
        '<div class="action-bar">' +
          '<button class="like ' + (liked ? "on" : "") + '" data-like aria-label="관심">' +
            (liked ? I.heart : I.heartLine) + "</button>" +
          '<button class="btn primary" data-chat>채팅하기</button>' +
        "</div>";
    }

    shell({
      header: header,
      main: hero + sellerBlock + body,
      mainClass: "no-tabbar",
      after: actions
    });

    var likeBtn = app.querySelector("[data-like]");
    if (likeBtn) likeBtn.addEventListener("click", function () {
      var on = S.toggleLike(l.id);
      likeBtn.classList.toggle("on", on);
      likeBtn.innerHTML = on ? I.heart : I.heartLine;
      toast(on ? "관심 목록에 담았어요" : "관심을 해제했어요");
    });
    var chatBtn = app.querySelector("[data-chat]");
    if (chatBtn) chatBtn.addEventListener("click", function () {
      var c = S.openChatForListing(l.id);
      if (!c) { toast("채팅을 열 수 없어요"); return; }
      go("#/chat/" + c.id);
    });
    var stBtn = app.querySelector("[data-status]");
    if (stBtn) stBtn.addEventListener("click", function () {
      var s = S.cycleStatus(l.id);
      toast(s === "selling" ? "판매중으로 변경" : s === "reserved" ? "예약중으로 변경" : "거래완료로 변경");
      viewPost(id);
    });
  }

  // =============================================================
  //  글쓰기
  // =============================================================
  var draft = { photo: null };

  function viewNew() {
    var header = topHeader("내 물건 팔기", {
      back: true,
      right: '<button class="icon-btn" data-submit aria-label="완료" style="width:auto;padding:0 12px;font-weight:800;color:var(--accent)">완료</button>'
    });

    var priceSeg =
      '<div class="seg" id="ptype">' +
        '<button type="button" class="chip on" data-pt="sale">판매</button>' +
        '<button type="button" class="chip" data-pt="free">나눔</button>' +
        '<button type="button" class="chip" data-pt="talent">재능교환</button>' +
      "</div>";

    var catOpts = S.CATEGORIES.map(function (c) {
      return '<option value="' + c.id + '">' + c.emoji + " " + esc(c.label) + "</option>";
    }).join("");

    var photoBlock = draft.photo
      ? '<div class="photo-preview"><img src="' + draft.photo + '" alt=""><button class="rm" data-rmphoto>×</button></div>'
      : '<label class="photo-add">' + I.plus + '<span>사진</span>' +
        '<input type="file" accept="image/*" id="photo" class="sr-only"></label>';

    var main =
      '<div class="form">' +
        "<div>" +
          "<label>사진</label>" +
          '<div class="photo-row" id="photoRow">' + photoBlock + "</div>" +
          '<div class="hint">프로토타입에서는 사진 1장까지 미리보기를 지원해요.</div>' +
        "</div>" +
        "<div><label for=\"title\">제목</label>" +
          '<input class="input" id="title" placeholder="글 제목을 입력하세요"></div>' +
        "<div><label for=\"cat\">카테고리</label>" +
          '<select id="cat">' + catOpts + "</select></div>" +
        "<div><label>거래 방식</label>" + priceSeg + "</div>" +
        '<div id="priceWrap"><label for="price">가격</label>' +
          '<input class="input" id="price" type="number" inputmode="numeric" placeholder="₩ 가격을 입력하세요"></div>' +
        "<div><label for=\"desc\">자세한 설명</label>" +
          '<textarea id="desc" placeholder="물건 상태, 거래 방법(예: 본관 로비 직거래) 등을 적어주세요."></textarea></div>' +
        '<button class="btn primary" data-submit2>작성 완료</button>' +
      "</div>";

    shell({ header: header, main: main, mainClass: "no-tabbar" });

    var pt = "sale";
    app.querySelectorAll("#ptype [data-pt]").forEach(function (b) {
      b.addEventListener("click", function () {
        pt = b.getAttribute("data-pt");
        app.querySelectorAll("#ptype [data-pt]").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        document.getElementById("priceWrap").style.display = (pt === "sale") ? "" : "none";
      });
    });

    bindPhoto();

    function submit() {
      var title = document.getElementById("title").value.trim();
      if (!title) { toast("제목을 입력해 주세요"); return; }
      var price = parseInt(document.getElementById("price").value, 10) || 0;
      if (pt === "sale" && price <= 0) { toast("가격을 입력해 주세요"); return; }
      var data = {
        title: title,
        category: document.getElementById("cat").value,
        priceType: pt,
        price: pt === "sale" ? price : 0,
        desc: document.getElementById("desc").value.trim(),
        photo: draft.photo
      };
      var l = S.createListing(data);
      draft.photo = null;
      toast("글이 등록되었어요!");
      go("#/post/" + l.id);
    }

    app.querySelector("[data-submit]").addEventListener("click", submit);
    app.querySelector("[data-submit2]").addEventListener("click", submit);
  }

  function bindPhoto() {
    var input = document.getElementById("photo");
    if (input) {
      input.addEventListener("change", function () {
        var f = input.files && input.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          draft.photo = reader.result;
          refreshPhotoRow();
        };
        reader.readAsDataURL(f);
      });
    }
    var rm = app.querySelector("[data-rmphoto]");
    if (rm) rm.addEventListener("click", function () { draft.photo = null; refreshPhotoRow(); });
  }
  function refreshPhotoRow() {
    var row = document.getElementById("photoRow");
    if (!row) return;
    row.innerHTML = draft.photo
      ? '<div class="photo-preview"><img src="' + draft.photo + '" alt=""><button class="rm" data-rmphoto>×</button></div>'
      : '<label class="photo-add">' + I.plus + '<span>사진</span>' +
        '<input type="file" accept="image/*" id="photo" class="sr-only"></label>';
    bindPhoto();
  }

  // =============================================================
  //  채팅 목록
  // =============================================================
  function viewChats() {
    var me = S.currentUser();
    var chats = S.myChats(me.id);
    var header = topHeader("채팅", { right: themeBtnHtml() });

    var body;
    if (!chats.length) {
      body = '<div class="empty"><div class="big">💬</div>아직 채팅이 없어요.<br>관심 있는 글에서 판매자와 대화를 시작해 보세요.</div>';
    } else {
      body = chats.map(function (c) {
        var l = S.getListing(c.listingId) || {};
        var otherId = (c.buyerId === me.id) ? c.sellerId : c.buyerId;
        var other = S.getUser(otherId);
        var last = c.messages[c.messages.length - 1] || { text: "" };
        var when = last.createdAt ? S.relTime(Math.round((Date.now() - last.createdAt) / 60000)) : "";
        return '<a class="chat-item" href="#/chat/' + c.id + '">' +
          thumb(l) +
          '<div class="who">' +
            '<div class="name">' + esc(other.name) + " <span style=\"font-weight:400;color:var(--text-faint);font-size:.8rem\">" + esc(other.dept) + "</span></div>" +
            '<div class="last">' + esc(last.text) + "</div>" +
          "</div>" +
          '<div class="time">' + esc(when) + "</div>" +
        "</a>";
      }).join("");
    }

    shell({ header: header, main: body, tab: "chats" });
  }

  // =============================================================
  //  채팅방
  // =============================================================
  function viewChat(id) {
    var c = S.getChat(id);
    if (!c) { notFound(); return; }
    var me = S.currentUser();
    var l = S.getListing(c.listingId) || {};
    var otherId = (c.buyerId === me.id) ? c.sellerId : c.buyerId;
    var other = S.getUser(otherId);

    var header = topHeader(other.name, { back: true });

    var ref =
      '<a class="chat-listing-ref" href="#/post/' + l.id + '">' +
        thumb(l) +
        '<div class="t">' + statusBadge(l) + esc(l.title) + "</div>" +
        '<div class="p">' + priceLabel(l) + "</div>" +
      "</a>";

    var stream = '<div class="chat-stream" id="stream">' + renderMessages(c, me) + "</div>";

    var inputBar =
      '<div class="chat-input">' +
        '<textarea id="msg" rows="1" placeholder="메시지를 입력하세요"></textarea>' +
        '<button class="send" id="send" disabled>' + I.send + "</button>" +
      "</div>";

    shell({
      header: header,
      main: ref + stream,
      mainClass: "no-tabbar",
      after: inputBar
    });

    var stream_el = document.getElementById("stream");
    scrollToBottom();

    var msg = document.getElementById("msg");
    var send = document.getElementById("send");

    msg.addEventListener("input", function () {
      send.disabled = !msg.value.trim();
      msg.style.height = "auto";
      msg.style.height = Math.min(msg.scrollHeight, 96) + "px";
    });
    msg.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    send.addEventListener("click", doSend);

    function doSend() {
      var text = msg.value.trim();
      if (!text) return;
      var res = S.sendMessage(c.id, text);
      msg.value = ""; msg.style.height = "auto"; send.disabled = true;
      stream_el.innerHTML = renderMessages(S.getChat(c.id), me);
      scrollToBottom();
      // 자동응답(프로토타입)
      if (res && res.reply) {
        setTimeout(function () {
          S.pushReply(c.id, res.otherId, res.reply);
          stream_el.innerHTML = renderMessages(S.getChat(c.id), me);
          scrollToBottom();
        }, 800);
      }
    }

    function scrollToBottom() {
      var main = app.querySelector(".app-main");
      if (main) main.scrollTop = main.scrollHeight;
    }
  }

  function renderMessages(c, me) {
    return c.messages.map(function (m) {
      if (m.from === "system") {
        return '<div class="day-sep">' + esc(m.text) + "</div>";
      }
      var mine = m.from === me.id;
      var t = m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        : "";
      return '<div class="bubble ' + (mine ? "me" : "them") + '">' + esc(m.text) +
        '<span class="t">' + t + "</span></div>";
    }).join("");
  }

  // =============================================================
  //  마이페이지
  // =============================================================
  function viewMe() {
    var me = S.currentUser();
    var header = topHeader("나의 거래", { right: themeBtnHtml() });

    var myPosts = S.myListings(me.id);
    var likes = S.myLikes(me.id);
    var chats = S.myChats(me.id);
    var tempPct = Math.max(0, Math.min(100, (me.temp / 99) * 100));

    var head =
      '<div class="profile-head">' +
        '<div class="avatar">' + esc(me.name.slice(0, 1)) + "</div>" +
        "<div><div class=\"name\">" + esc(me.name) + "</div>" +
          '<div class="email">' + esc(me.email || "") + " · " + esc(me.dept) + "</div>" +
          '<div class="temp" style="text-align:left;margin-top:6px">' +
            '<span class="val">' + me.temp.toFixed(1) + "°C 매너온도</span>" +
            '<div class="bar" style="width:120px"><i style="width:' + tempPct + '%"></i></div>' +
          "</div>" +
        "</div>" +
      "</div>";

    var stats =
      '<div class="stat-row">' +
        '<div class="cell"><div class="num">' + myPosts.length + '</div><div class="lbl">판매글</div></div>' +
        '<div class="cell"><div class="num">' + likes.length + '</div><div class="lbl">관심</div></div>' +
        '<div class="cell"><div class="num">' + chats.length + '</div><div class="lbl">채팅</div></div>' +
      "</div>";

    var postsSection = '<div class="section-title">판매 내역</div>';
    if (!myPosts.length) {
      postsSection += '<div class="empty" style="padding:28px">아직 등록한 글이 없어요.</div>';
    } else {
      postsSection += myPosts.map(function (l) {
        return '<a class="listing" href="#/post/' + l.id + '">' +
          thumb(l) +
          '<div class="body"><div class="title">' + esc(l.title) + "</div>" +
            '<div class="meta">' + S.relTime(S.minutesSince(l)) + "</div>" +
            '<div class="price">' + statusBadge(l) + priceLabel(l) + "</div></div></a>";
      }).join("");
    }

    var likesSection = "";
    if (likes.length) {
      likesSection = '<div class="section-title">관심 목록</div>' +
        likes.map(function (l) {
          return '<a class="listing" href="#/post/' + l.id + '">' +
            thumb(l) +
            '<div class="body"><div class="title">' + esc(l.title) + "</div>" +
              '<div class="price">' + statusBadge(l) + priceLabel(l) + "</div></div></a>";
        }).join("");
    }

    var menu =
      '<div class="menu-list">' +
        '<button data-toggle-theme>' + themeIcon() + " 화면 테마 전환<span class=\"r\">" +
          (currentTheme() === "dark" ? "다크" : "라이트") + "</span></button>" +
        '<button data-reset>🔄 데모 데이터 초기화<span class="r">' + I.right + "</span></button>" +
        '<button data-logout>🚪 로그아웃<span class="r">' + I.right + "</span></button>" +
      "</div>";

    shell({ header: header, main: head + stats + postsSection + likesSection + menu, tab: "me" });

    app.querySelector("[data-toggle-theme]").addEventListener("click", function () { toggleTheme(); viewMe(); });
    app.querySelector("[data-logout]").addEventListener("click", function () {
      S.logout(); toast("로그아웃되었습니다"); go("#/");
    });
    app.querySelector("[data-reset]").addEventListener("click", function () {
      if (confirm("데모 데이터를 초기 상태로 되돌릴까요? (등록한 글·채팅이 사라집니다)")) {
        S.reset(); toast("초기화되었습니다"); go("#/");
      }
    });
  }

  // =============================================================
  //  공통: 없음
  // =============================================================
  function notFound() {
    shell({
      header: topHeader("", { back: true }),
      main: '<div class="empty"><div class="big">🤔</div>페이지를 찾을 수 없어요.</div>',
      mainClass: "no-tabbar"
    });
  }

  // =============================================================
  //  라우터
  // =============================================================
  function route() {
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\//, "").split("/");

    // 로그인 가드
    if (!S.isLoggedIn()) { viewLogin(); return; }

    var head = parts[0];
    if (head === "" ) { viewHome(); }
    else if (head === "post") { viewPost(parts[1]); }
    else if (head === "new") { viewNew(); }
    else if (head === "chats") { viewChats(); }
    else if (head === "chat") { viewChat(parts[1]); }
    else if (head === "me") { viewMe(); }
    else { viewHome(); }

    // 상단으로 스크롤 (라우팅 시)
    var main = app.querySelector(".app-main");
    if (main && head !== "chat") main.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ---------- 전역 이벤트 위임 ----------
  app.addEventListener("click", function (e) {
    var back = e.target.closest("[data-back]");
    if (back) { e.preventDefault(); if (history.length > 1) history.back(); else go("#/"); return; }

    var tt = e.target.closest("[data-theme-toggle]");
    if (tt) {
      e.preventDefault(); toggleTheme();
      tt.innerHTML = themeIcon();
      return;
    }
    var nw = e.target.closest("[data-new]");
    if (nw) { e.preventDefault(); go("#/new"); return; }
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", route);
  // DOMContentLoaded 가 이미 지난 경우 대비
  if (document.readyState !== "loading") route();

  // 서비스워커 등록 (http(s) 환경에서만; file:// 에서는 건너뜀)
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }
})();

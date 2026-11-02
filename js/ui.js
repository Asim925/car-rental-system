/* ==========================================================================
   VELOCE — ui.js
   --------------------------------------------------------------------------
   SHARED UI TOOLBOX. Loaded on every page after store.js.
   It builds the header + footer, and offers small reusable helpers
   (money/date formatting, toasts, modals, car cards, empty & loading states)
   so that no page has to repeat the same code.
   ========================================================================== */

const UI = (function () {
  "use strict";

  /* ------------------------------------------------------------- ICONS */
  const paths = {
    seat: "M4 18v-5a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v5M4 18h10M17 18v-3.5a2.5 2.5 0 0 1 5 0V18",
    gear: "M6 4v7M6 15v5M12 4v3M12 11v9M18 4v11M18 19v1M3 11h6M9 7h6M15 15h6",
    fuel: "M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M3 21h11M13 9h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0v-7l-2.5-3",
    bag: "M6 8h12l1 12H5L6 8ZM9 8V5a3 3 0 0 1 6 0v3",
    door: "M4 21V6a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v15M4 21h16M14 12h.01",
    star: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
    arrowRight: "M5 12h14M13 6l6 6-6 6",
    arrowLeft: "M19 12H5M11 18l-6-6 6-6",
    chevronDown: "M6 9l6 6 6-6",
    check: "M20 6 9 17l-5-5",
    checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
    close: "M18 6 6 18M6 6l12 12",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    car: "M5 17h14M3 17v-4l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4M6.5 14h.01M17.5 14h.01M3 17v2h3v-2M18 17v2h3v-2",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    bolt: "M13 2 3 14h8l-1 8 10-12h-8l1-8Z",
    gauge: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 15l4-4M20.6 17a9 9 0 1 0-17.2 0",
    wallet: "M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V6a2 2 0 0 1 2-2h11M17 13h.01",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
    plus: "M12 5v14M5 12h14",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    chart: "M3 3v18h18M7 15v3M12 10v8M17 6v12",
    key: "M15 7a4 4 0 1 1-3.9 5H8l-2 2H3v-3l6-6h4.1",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z",
    mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6",
    heart: "M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01",
    alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
    road: "M4 21 8 3M20 21 16 3M12 4v3M12 11v3M12 18v3",
    sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8",
    filter: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
    download: "M12 3v12M7 11l5 5 5-5M4 21h16",
    refresh: "M21 12a9 9 0 1 1-3-6.7M21 3v6h-6",
    menu: "M3 6h18M3 12h18M3 18h18"
  };

  function icon(name, size) {
    const d = paths[name] || paths.info;
    const s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* -------------------------------------------------------- FORMATTERS */
  const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const moneyFmt2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  const numFmt = new Intl.NumberFormat("en-US");

  function money(n, withCents) { return (withCents ? moneyFmt2 : moneyFmt).format(Number(n) || 0); }
  function num(n) { return numFmt.format(Number(n) || 0); }
  function plural(n, one, many) { return n === 1 ? one : (many || one + "s"); }

  function date(iso, opts) {
    if (!iso) return "—";
    const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-US", opts || { day: "numeric", month: "short", year: "numeric" });
  }
  function dateShort(iso) { return date(iso, { day: "numeric", month: "short" }); }
  function dateLong(iso) { return date(iso, { weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
  function dateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function esc(v) {
    return String(v === null || v === undefined ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function q(name) { return new URLSearchParams(window.location.search).get(name); }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  }
  function stars(rating) {
    const full = Math.round(Number(rating) || 0);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }
  const LOCATIONS = ["Downtown Hub · Terminal 1", "Downtown Hub · Terminal 2", "Airport VIP Desk", "Airport Green Bay", "North Yard · Off-road desk", "Private delivery"];

  /* ------------------------------------------------------------ TOASTS */
  function toastStack() {
    let el = document.querySelector(".toast-stack");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast-stack";
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type) {
    const t = type || "info";
    const icons = { success: "checkCircle", error: "alert", warn: "alert", info: "info" };
    const el = document.createElement("div");
    el.className = "toast toast--" + t;
    el.innerHTML = '<span class="t-icon">' + icon(icons[t] || "info", 19) + "</span><span>" + esc(message) + "</span>";
    toastStack().appendChild(el);
    setTimeout(function () {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 320);
    }, 3600);
  }

  /* ------------------------------------------------------------ MODALS */
  function modal(options) {
    const o = options || {};
    const back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML =
      '<div class="modal ' + (o.wide ? "modal--wide" : "") + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><div><h3>' + esc(o.title || "") + "</h3>" +
          (o.subtitle ? "<p>" + esc(o.subtitle) + "</p>" : "") + "</div>" +
          '<button class="modal-close" type="button" aria-label="Close">' + icon("close", 18) + "</button></div>" +
        '<div class="modal-body">' + (o.body || "") + "</div>" +
        (o.footer ? '<div class="modal-foot">' + o.footer + "</div>" : "") +
      "</div>";

    document.body.appendChild(back);
    document.body.classList.add("is-locked");

    function close() {
      back.remove();
      if (!document.querySelector(".modal-backdrop")) document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    back.querySelector(".modal-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    if (typeof o.onMount === "function") o.onMount(back, close);
    return close;
  }

  /* Promise-based confirmation dialog — returns true/false. */
  function confirm(options) {
    const o = options || {};
    return new Promise(function (resolve) {
      const close = modal({
        title: o.title || "Are you sure?",
        subtitle: o.subtitle || "",
        body: "<p style='color:var(--ink-soft)'>" + (o.message || "") + "</p>",
        footer:
          '<button class="btn btn--outline" data-act="no">' + esc(o.cancelText || "Cancel") + "</button>" +
          '<button class="btn ' + (o.danger === false ? "btn--dark" : "btn--danger") + '" data-act="yes">' + esc(o.confirmText || "Confirm") + "</button>",
        onMount: function (root, closeFn) {
          root.querySelector('[data-act="no"]').addEventListener("click", function () { closeFn(); resolve(false); });
          root.querySelector('[data-act="yes"]').addEventListener("click", function () { closeFn(); resolve(true); });
        }
      });
    });
  }

  /* ------------------------------------------------------ STATE BLOCKS */
  function skeletons(n) {
    let html = "";
    for (let i = 0; i < (n || 6); i++) html += '<div class="skeleton sk-card"></div>';
    return html;
  }

  function loading(text) {
    return '<div class="loading-block"><div class="spinner"></div><p class="mt-2 small">' + esc(text || "Loading…") + "</p></div>";
  }

  function emptyState(o) {
    return '<div class="empty-state">' +
      '<div class="empty-icon">' + icon(o.icon || "search", 30) + "</div>" +
      "<h3>" + esc(o.title) + "</h3><p>" + esc(o.text) + "</p>" +
      (o.actionLabel ? '<a class="btn" href="' + o.actionHref + '">' + esc(o.actionLabel) + "</a>" : "") +
      "</div>";
  }

  function statusPill(status) {
    return '<span class="status-pill status-' + esc(status) + '">' + esc(status) + "</span>";
  }

  /* ---------------------------------------------------------- CAR CARD */
  /* Used on the home page, browse page, car page (similar cars) & admin. */
  function carCard(car, opts) {
    const o = opts || {};
    const link = "car.html?id=" + encodeURIComponent(car.id);
    const badges = [];
    if (car.featured) badges.push('<span class="badge badge--gold">' + icon("sparkle", 12) + " Featured</span>");
    else badges.push('<span class="badge">' + esc(car.category) + "</span>");

    return (
      '<article class="car-card reveal">' +
        '<div class="car-card-media">' +
          '<a href="' + link + '" aria-label="' + esc(car.name) + '">' +
            '<img src="' + esc(car.image) + '" alt="' + esc(car.name) + '" loading="lazy" onerror="this.src=\'' + Store.PHOTOS.cityStreet + '\'">' +
          "</a>" +
          '<div class="card-badges"><div class="flex" style="gap:6px">' + badges.join("") + "</div>" +
            '<span class="card-rating">' + icon("star", 12) + " " + Number(car.rating || 0).toFixed(1) + "</span></div>" +
        "</div>" +
        '<div class="car-card-body">' +
          "<div><p class='car-brand'>" + esc(car.brand) + "</p>" +
          '<h3 class="car-name"><a href="' + link + '">' + esc(car.name) + "</a></h3></div>" +
          '<div class="car-specs">' +
            '<span class="chip">' + icon("seat", 14) + " " + car.seats + " seats</span>" +
            '<span class="chip">' + icon("gear", 14) + " " + esc(car.transmission) + "</span>" +
            '<span class="chip">' + icon("fuel", 14) + " " + esc(car.fuel) + "</span>" +
            '<span class="chip">' + icon("bag", 14) + " " + car.luggage + " bags</span>" +
          "</div>" +
          '<div class="car-card-foot">' +
            '<div class="car-price">' + money(car.pricePerDay) + "<small> / day</small></div>" +
            (o.compact
              ? '<a class="btn btn--sm" href="' + link + '">Details ' + icon("arrowRight", 15) + "</a>"
              : '<a class="btn btn--sm" href="' + link + '">Rent now ' + icon("arrowRight", 15) + "</a>") +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ------------------------------------------------------- HEADER/FOOTER */
  const NAV = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "browse", label: "Browse cars", href: "browse.html" },
    { key: "bookings", label: "My bookings", href: "bookings.html", auth: true },
    { key: "admin", label: "Admin", href: "admin.html", admin: true }
  ];

  function renderHeader(active) {
    const host = document.getElementById("siteHeader");
    if (!host) return;
    const user = Store.currentUser();
    // sub-pages keep the parent menu item highlighted
    const alias = { car: "browse", booking: "browse" };
    active = alias[active] || active || "";

    const links = NAV.filter((n) => {
      if (n.admin) return Store.isAdmin();
      if (n.auth) return !!user;
      return true;
    }).map((n) => '<a href="' + n.href + '"' + (n.key === active ? ' class="active" aria-current="page"' : "") + ">" + n.label + "</a>").join("");

    const actions = user
      ? '<div class="user-menu" id="userMenu">' +
          '<button class="user-chip" type="button" aria-haspopup="true" aria-expanded="false">' +
            '<span class="avatar">' + esc(initials(user.name)) + "</span><b>" + esc(user.name.split(" ")[0]) + "</b>" +
            icon("chevronDown", 15) +
          "</button>" +
          '<div class="user-panel">' +
            '<div class="panel-head"><b>' + esc(user.name) + "</b><span>" + esc(user.email) + "</span></div>" +
            '<a href="bookings.html">' + icon("calendar", 16) + " My bookings</a>" +
            '<a href="bookings.html#profile">' + icon("user", 16) + " Profile &amp; settings</a>" +
            (user.role === "admin" ? '<a href="admin.html">' + icon("chart", 16) + " Admin dashboard</a>" : "") +
            '<button type="button" class="danger-link" id="logoutBtn">' + icon("logout", 16) + " Sign out</button>" +
          "</div></div>"
      : '<a class="btn btn--ghost btn--sm hide-sm" href="auth.html">Sign in</a>' +
        '<a class="btn btn--sm" href="auth.html?mode=signup">Join Veloce</a>';

    host.className = "site-header on-dark";
    host.innerHTML =
      '<div class="container header-inner">' +
        '<a class="brand" href="index.html" aria-label="Veloce home">' +
          '<span class="brand-mark">' + icon("road", 20) + "</span>" +
          '<span><span class="brand-name">VELO<span>CE</span></span><span class="brand-sub">car rental</span></span>' +
        "</a>" +
        '<nav class="main-nav" id="primaryNav" aria-label="Primary">' + links + "</nav>" +
        '<div class="header-actions">' + actions +
          '<button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span></button>' +
        "</div>" +
      "</div><div class='scroll-progress' id='scrollProgress'></div>";

    // sticky header shadow + reading progress bar
    const bar = document.getElementById("scrollProgress");
    function onScroll() {
      host.classList.toggle("is-scrolled", window.scrollY > 12);
      if (bar) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // mobile drawer
    const toggle = document.getElementById("navToggle");
    toggle.addEventListener("click", function () {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".main-nav a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("nav-open"))
    );

    // user dropdown
    const menu = document.getElementById("userMenu");
    if (menu) {
      const chip = menu.querySelector(".user-chip");
      chip.addEventListener("click", function (e) {
        e.stopPropagation();
        const open = menu.classList.toggle("open");
        chip.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", (e) => { if (!menu.contains(e.target)) menu.classList.remove("open"); });
      document.getElementById("logoutBtn").addEventListener("click", function () {
        Store.logout();
        Store.clearDraft();
        toast("Signed out. See you soon!", "success");
        setTimeout(() => (window.location.href = "index.html"), 600);
      });
    }
  }

  function renderFooter() {
    const host = document.getElementById("siteFooter");
    if (!host) return;
    const year = new Date().getFullYear();
    host.className = "site-footer on-dark";
    host.innerHTML =
      '<div class="container">' +
        '<div class="footer-top">' +
          "<div class='footer-col'>" +
            '<a class="brand" href="index.html"><span class="brand-mark">' + icon("road", 20) + "</span>" +
            '<span><span class="brand-name">VELO<span>CE</span></span><span class="brand-sub">car rental</span></span></a>' +
            '<p class="footer-blurb">A curated fleet of 16 cars — from a 1971 Miura to a Plaid — picked up in minutes, returned without an argument.</p>' +
            '<div class="socials mt-3">' +
              ['<a href="#" aria-label="Instagram">' + icon("sparkle", 16) + "</a>",
               '<a href="#" aria-label="X">' + icon("bolt", 16) + "</a>",
               '<a href="#" aria-label="YouTube">' + icon("gauge", 16) + "</a>"].join("") +
            "</div>" +
          "</div>" +
          "<div class='footer-col'><h4>Explore</h4><ul class='footer-links'>" +
            "<li><a href='browse.html'>All cars</a></li><li><a href='browse.html?category=Electric'>Electric fleet</a></li>" +
            "<li><a href='browse.html?category=Sports'>Sports cars</a></li><li><a href='browse.html?category=SUV'>SUVs &amp; off-road</a></li>" +
            "<li><a href='browse.html?sort=price-asc'>Best value</a></li></ul></div>" +
          "<div class='footer-col'><h4>Company</h4><ul class='footer-links'>" +
            "<li><a href='index.html#how'>How it works</a></li><li><a href='index.html#why'>Why Veloce</a></li>" +
            "<li><a href='bookings.html'>My bookings</a></li><li><a href='auth.html?mode=signup'>Create account</a></li>" +
            "<li><a href='admin.html'>Admin</a></li></ul></div>" +
          "<div class='footer-col'><h4>Contact</h4><ul class='footer-contact'>" +
            "<li>" + icon("pin", 16) + "<span>1400 Harbour Blvd, Bay 6<br>Los Angeles, CA 90021</span></li>" +
            "<li>" + icon("phone", 16) + "<span>+1 (555) 010-2200<br>24/7 roadside line</span></li>" +
            "<li>" + icon("mail", 16) + "<span>hello@veloce.rental</span></li></ul>" +
            "<form class='newsletter' id='newsletterForm'>" +
              "<input type='email' placeholder='Email for offers' aria-label='Email address' required>" +
              "<button class='btn btn--sm' type='submit'>" + icon("arrowRight", 16) + "</button></form>" +
          "</div>" +
        "</div>" +
        "<div class='footer-bottom'>" +
          "<span>© " + year + " Veloce Car Rental — a front-end demo project. All data is stored in your browser (localStorage).</span>" +
          "<span class='flex' style='gap:16px'><button type='button' id='resetDemo' class='tiny upper' style='color:#7d8ea9'>Reset demo data</button>" +
          "<span>Photos: Pexels</span></span>" +
        "</div>" +
      "</div>";

    const form = document.getElementById("newsletterForm");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      toast("You're on the list. Launch offers incoming.", "success");
      form.reset();
    });

    const reset = document.getElementById("resetDemo");
    if (reset) reset.addEventListener("click", async function () {
      const ok = await confirm({
        title: "Reset demo data?",
        message: "Cars, users, bookings and your session will be restored to the original sample data.",
        confirmText: "Reset everything"
      });
      if (ok) { Store.resetDemoData(); toast("Demo data restored.", "success"); setTimeout(() => window.location.reload(), 700); }
    });
  }

  /* -------------------------------------------------- SCROLL REVEAL */
  function reveal(root) {
    const items = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* Animate a number from 0 to its data-target value. */
  function countUp(el) {
    const target = parseFloat(el.dataset.count || "0");
    const dur = 1200;
    const start = performance.now();
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + num(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* --------------------------------------------------------- GUARDS */
  /* Sends a visitor to the login page, remembering where they were going. */
  function requireLogin(reason) {
    if (Store.currentUser()) return true;
    const next = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
    toast(reason || "Please sign in to continue.", "warn");
    setTimeout(() => { window.location.href = "auth.html?next=" + next; }, 700);
    return false;
  }

  function requireAdmin() {
    const user = Store.currentUser();
    if (user && user.role === "admin") return true;
    return false;
  }

  /* --------------------------------------------------------- BOOTSTRAP */
  function init(activePage) {
    renderHeader(activePage);
    renderFooter();
    reveal();
    // re-run reveal for content injected later
    window.addEventListener("load", () => reveal());
  }

  return {
    icon, money, num, plural, date, dateShort, dateLong, dateTime, esc, q, initials, stars,
    LOCATIONS, toast, modal, confirm, skeletons, loading, emptyState, statusPill, carCard,
    renderHeader, renderFooter, reveal, countUp, requireLogin, requireAdmin, init
  };
})();

/* Every page sets <body data-page="…">, so the shell can build itself. */
document.addEventListener("DOMContentLoaded", function () {
  UI.init(document.body.dataset.page || "");
});

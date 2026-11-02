/* ==========================================================================
   VELOCE — auth.js : simulated sign-up / sign-in (front-end only)
   Accounts live in localStorage. Passwords are stored in plain text because
   this demo has no server — a real product must hash them on the backend.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PERMITTED = ["index.html", "browse.html", "car.html", "booking.html", "bookings.html", "admin.html"];

  /* Where should we go after a successful login? Only our own pages allowed. */
  function safeNext() {
    const raw = UI.q("next");
    if (!raw) return "index.html";
    const decoded = decodeURIComponent(raw);
    const page = decoded.split("?")[0];
    return PERMITTED.indexOf(page) > -1 ? decoded : "index.html";
  }

  /* ------------------------------------------------------------- perks */
  const PERKS = [
    { i: "bolt",   t: "Faster checkout", d: "Driver details are remembered for next time." },
    { i: "calendar", t: "Full rental history", d: "Every past and upcoming trip in one place." },
    { i: "close",  t: "One-click cancellation", d: "Free up to 24 hours before pick-up." },
    { i: "wallet", t: "Member rates", d: "Weekly and monthly discounts applied automatically." }
  ];

  function paintPerks() {
    $("brandIcon").innerHTML = UI.icon("road", 20);
    $("perks").innerHTML = PERKS.map(function (p) {
      return "<li><span class='perk-ico'>" + UI.icon(p.i, 17) + "</span><span><b style='color:#fff'>" + p.t + "</b><br>" + p.d + "</span></li>";
    }).join("");
  }

  /* -------------------------------------------------------------- tabs */
  function setMode(mode) {
    const login = mode !== "signup";
    $("tabLogin").classList.toggle("active", login);
    $("tabSignup").classList.toggle("active", !login);
    $("loginForm").classList.toggle("hidden", !login);
    $("signupForm").classList.toggle("hidden", login);
    $("authMessage").innerHTML = "";
  }

  /* --------------------------------------------------------- validation */
  function mark(fieldId, message) {
    const wrap = $(fieldId).closest(".field");
    wrap.classList.add("has-error");
    const el = wrap.querySelector(".field-error");
    if (el && message) el.textContent = message;
  }
  function unmark(fieldId) { $(fieldId).closest(".field").classList.remove("has-error"); }
  function flash(type, message) {
    $("authMessage").innerHTML = '<div class="alert alert--' + (type === "error" ? "error" : "ok") + '" style="margin-bottom:18px">' +
      UI.icon(type === "error" ? "alert" : "checkCircle", 18) + "<span>" + UI.esc(message) + "</span></div>";
  }

  /* -------------------------------------------------------------- login */
  function initLogin() {
    $("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      unmark("loginEmail"); unmark("loginPassword");
      const email = $("loginEmail").value.trim();
      const pw = $("loginPassword").value;
      let ok = true;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { mark("loginEmail", "Enter a valid email"); ok = false; }
      if (!pw) { mark("loginPassword", "Password is required"); ok = false; }
      if (!ok) return;

      const btn = $("loginBtn");
      btn.disabled = true; btn.textContent = "Signing in…";

      setTimeout(function () {
        const res = Store.login(email, pw);
        btn.disabled = false; btn.textContent = "Sign in";
        if (!res.ok) { flash("error", res.error); return; }
        flash("ok", "Welcome back, " + res.user.name.split(" ")[0] + "!");
        UI.toast("Signed in as " + res.user.name, "success");
        const next = safeNext();
        setTimeout(function () {
          window.location.href = res.user.role === "admin" && next === "index.html" ? "admin.html" : next;
        }, 700);
      }, 500);
    });
  }

  /* ------------------------------------------------------------- signup */
  function initSignup() {
    const pw = $("suPassword");
    pw.addEventListener("input", function () {
      const v = pw.value;
      let score = 0;
      if (v.length >= 6) score++;
      if (v.length >= 10) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const bar = $("pwBar");
      bar.style.width = (score / 4) * 100 + "%";
      bar.style.background = score <= 1 ? "var(--danger)" : score === 2 ? "var(--warn)" : score === 3 ? "#3aa76d" : "var(--ok)";
      $("pwHint").textContent = score <= 1 ? "Weak — add a number or symbol." : score === 2 ? "Fair." : score === 3 ? "Good." : "Strong.";
      unmark("suPassword");
    });

    ["suName", "suEmail", "suPhone", "suPassword2"].forEach((id) => $(id).addEventListener("input", () => unmark(id)));

    $("signupForm").addEventListener("submit", function (e) {
      e.preventDefault();
      ["suName", "suEmail", "suPhone", "suPassword", "suPassword2"].forEach(unmark);
      $("suTermsError").style.display = "none";

      const data = {
        name: $("suName").value.trim(),
        email: $("suEmail").value.trim(),
        phone: $("suPhone").value.trim(),
        license: $("suLicense").value.trim(),
        password: $("suPassword").value
      };
      let ok = true;

      if (data.name.length < 3 || data.name.indexOf(" ") === -1) { mark("suName", "Enter your first and last name"); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) { mark("suEmail", "Enter a valid email address"); ok = false; }
      else if (Store.findUserByEmail(data.email)) { mark("suEmail", "That email is already registered"); ok = false; }
      if (data.phone && data.phone.replace(/\D/g, "").length < 7) { mark("suPhone", "Enter a valid phone number"); ok = false; }
      if (data.password.length < 6) { mark("suPassword", "Use at least 6 characters"); ok = false; }
      if ($("suPassword2").value !== data.password) { mark("suPassword2", "Passwords do not match"); ok = false; }
      if (!$("suTerms").checked) { $("suTermsError").style.display = "block"; ok = false; }
      if (!ok) return;

      const btn = $("signupBtn");
      btn.disabled = true; btn.textContent = "Creating account…";

      setTimeout(function () {
        const res = Store.signup(data);
        btn.disabled = false; btn.textContent = "Create account";
        if (!res.ok) { flash("error", res.error); return; }
        flash("ok", "Account created — welcome to Veloce, " + res.user.name.split(" ")[0] + "!");
        UI.toast("Account created.", "success");
        setTimeout(() => { window.location.href = safeNext(); }, 800);
      }, 600);
    });
  }

  /* --------------------------------------------------------------- go */
  document.addEventListener("DOMContentLoaded", function () {
    paintPerks();
    initLogin();
    initSignup();

    $("tabLogin").addEventListener("click", () => setMode("login"));
    $("tabSignup").addEventListener("click", () => setMode("signup"));

    // demo credential buttons
    document.querySelectorAll(".demo-creds button").forEach(function (b) {
      b.addEventListener("click", function () {
        setMode("login");
        $("loginEmail").value = b.dataset.email;
        $("loginPassword").value = b.dataset.pw;
        flash("ok", "Demo credentials filled in — press Sign in.");
      });
    });

    // already signed in? send them where they were going
    const current = Store.currentUser();
    if (current && !UI.q("next")) {
      flash("ok", "You are already signed in as " + current.name + ".");
      setTimeout(() => { window.location.href = current.role === "admin" ? "admin.html" : "bookings.html"; }, 900);
    }

    setMode(UI.q("mode") === "signup" ? "signup" : "login");
  });
})();

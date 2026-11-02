/* ==========================================================================
   VELOCE — bookings.js : "My bookings" + profile management
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const user = Store.currentUser();
  let filter = "all";

  const TABS = [
    { k: "all", label: "All" },
    { k: "upcoming", label: "Upcoming" },
    { k: "active", label: "On trip" },
    { k: "completed", label: "Completed" },
    { k: "cancelled", label: "Cancelled" }
  ];

  /* ------------------------------------------------------------ guard */
  if (!user) {
    document.addEventListener("DOMContentLoaded", function () {
      $("guardRoot").innerHTML = UI.emptyState({
        icon: "user", title: "Sign in to see your bookings",
        text: "Your reservations are tied to your Veloce account. Sign in or create one in a few seconds.",
        actionLabel: "Go to sign in", actionHref: "auth.html?next=bookings.html"
      });
    });
    return;
  }

  /* ---------------------------------------------------- profile header */
  function renderProfile() {
    const mine = Store.getUserBookings(user.id);
    const spent = mine.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);
    const upcoming = mine.filter((b) => Store.bookingPhase(b) === "upcoming" || Store.bookingPhase(b) === "active").length;

    $("profile").innerHTML =
      '<span class="avatar profile-avatar">' + UI.esc(UI.initials(user.name)) + "</span>" +
      '<div class="profile-info">' +
        "<b>" + UI.esc(user.name) + "</b>" +
        "<span>" + UI.esc(user.email) + "</span>" +
        '<div class="flex wrap mt-2" style="gap:8px">' +
          '<span class="chip" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#c8d5ea">' + UI.icon("key", 13) + " Licence " + UI.esc(user.license || "not set") + "</span>" +
          '<span class="chip" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#c8d5ea">' + UI.icon("phone", 13) + " " + UI.esc(user.phone || "not set") + "</span>" +
          '<span class="chip" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#c8d5ea">' + UI.icon("clock", 13) + " Member since " + UI.date(user.joined, { month: "short", year: "numeric" }) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="profile-stats">' +
        '<div><b>' + mine.length + "</b><span>Bookings</span></div>" +
        '<div><b>' + upcoming + "</b><span>Upcoming</span></div>" +
        '<div><b>' + UI.money(spent) + "</b><span>Total spent</span></div>" +
      "</div>" +
      '<button class="btn btn--ghost" id="editProfile" style="margin-left:8px">' + UI.icon("edit", 16) + " Edit profile</button>";

    $("editProfile").addEventListener("click", openProfileModal);
  }

  function openProfileModal() {
    UI.modal({
      title: "Edit your profile",
      subtitle: "These details are reused every time you book.",
      body:
        '<div class="form-grid">' +
          '<div class="field span-2"><label class="label" for="pName">Full name</label><input class="input" id="pName" value="' + UI.esc(user.name) + '"><span class="field-error">First and last name required</span></div>' +
          '<div class="field"><label class="label" for="pPhone">Phone</label><input class="input" id="pPhone" value="' + UI.esc(user.phone || "") + '"><span class="field-error">Enter a valid phone number</span></div>' +
          '<div class="field"><label class="label" for="pLicense">Driving licence</label><input class="input" id="pLicense" value="' + UI.esc(user.license || "") + '"></div>' +
          '<div class="field span-2"><label class="label" for="pEmail">Email</label><input class="input" id="pEmail" value="' + UI.esc(user.email) + '" disabled><span class="hint">Email is your login ID and cannot be changed in this demo.</span></div>' +
        "</div><hr class='divider'><h4 class='h-sm'>Change password</h4>" +
        '<div class="form-grid mt-2">' +
          '<div class="field"><label class="label" for="pOld">Current password</label><input class="input" id="pOld" type="password" placeholder="Leave blank to keep"><span class="field-error">Incorrect password</span></div>' +
          '<div class="field"><label class="label" for="pNew">New password</label><input class="input" id="pNew" type="password" placeholder="6+ characters"><span class="field-error">Minimum 6 characters</span></div>' +
        "</div>",
      footer: '<button class="btn btn--outline" data-x>Cancel</button><button class="btn" data-ok>Save changes</button>',
      onMount: function (root, close) {
        root.querySelector("[data-x]").addEventListener("click", close);
        root.querySelector("[data-ok]").addEventListener("click", function () {
          const name = root.querySelector("#pName").value.trim();
          const phone = root.querySelector("#pPhone").value.trim();
          const license = root.querySelector("#pLicense").value.trim();
          const oldPw = root.querySelector("#pOld").value;
          const newPw = root.querySelector("#pNew").value;
          let ok = true;

          function bad(id, msg) {
            const f = root.querySelector(id).closest(".field");
            f.classList.add("has-error");
            const e = f.querySelector(".field-error");
            if (e && msg) e.textContent = msg;
            ok = false;
          }
          root.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));

          if (name.length < 3 || name.indexOf(" ") === -1) bad("#pName");
          if (phone && phone.replace(/\D/g, "").length < 7) bad("#pPhone");
          if (newPw && newPw.length < 6) bad("#pNew", "Minimum 6 characters");
          if (newPw && oldPw !== user.password) bad("#pOld", "Incorrect current password");
          if (!ok) return;

          const patch = { name: name, phone: phone, license: license };
          if (newPw) patch.password = newPw;
          Store.updateUser(user.id, patch);
          Object.assign(user, patch);
          close();
          UI.renderHeader("bookings");
          renderProfile();
          UI.toast("Profile updated.", "success");
        });
      }
    });
  }

  /* ------------------------------------------------------------- tabs */
  function renderTabs() {
    const mine = Store.getUserBookings(user.id);
    const count = (k) => (k === "all" ? mine.length : mine.filter((b) => Store.bookingPhase(b) === k).length);

    $("statusTabs").innerHTML = TABS.map(function (t) {
      return '<button type="button" class="pill' + (filter === t.k ? " active" : "") + '" data-k="' + t.k + '">' +
             t.label + ' <span class="mono" style="opacity:.6">' + count(t.k) + "</span></button>";
    }).join("");

    $("statusTabs").querySelectorAll(".pill").forEach(function (b) {
      b.addEventListener("click", function () { filter = b.dataset.k; renderTabs(); renderList(); });
    });
  }

  /* -------------------------------------------------------- list of trips */
  function bookingCard(b) {
    const phase = Store.bookingPhase(b);
    const canCancel = ["confirmed", "pending"].indexOf(b.status) > -1 && phase === "upcoming";
    const carStillThere = !!Store.getCar(b.carId);

    return '<article class="booking-card reveal">' +
      '<div class="booking-media"><img src="' + UI.esc(b.carImage) + '" alt="' + UI.esc(b.carName) + '" loading="lazy"></div>' +
      '<div class="booking-body">' +
        '<div class="booking-top">' +
          "<div><p class='car-brand'>" + UI.esc(b.carBrand) + "</p>" +
          '<h3 class="car-name">' + UI.esc(b.carName) + "</h3>" +
          '<p class="booking-id mt-1">Ref ' + UI.esc(b.id) + " · booked " + UI.dateTime(b.createdAt) + "</p></div>" +
          UI.statusPill(phase === "upcoming" ? b.status : phase) +
        "</div>" +

        '<div class="booking-dates">' +
          '<div class="date-block"><span>Pick-up</span><b>' + UI.date(b.pickupDate) + "</b><span class='tiny' style='letter-spacing:0'>" + b.pickupTime + "</span></div>" +
          '<span class="date-arrow">' + UI.icon("arrowRight", 22) + "</span>" +
          '<div class="date-block"><span>Return</span><b>' + UI.date(b.returnDate) + "</b><span class='tiny' style='letter-spacing:0'>" + b.returnTime + "</span></div>" +
          '<div class="date-block"><span>Duration</span><b>' + b.days + " " + UI.plural(b.days, "day") + "</b></div>" +
          '<div class="date-block"><span>Location</span><b style="font-size:.88rem">' + UI.esc(b.location) + "</b></div>" +
        "</div>" +

        '<div class="booking-foot">' +
          "<div><span class='tiny upper muted'>Total</span><div class='car-price'>" + UI.money(b.total) + "</div></div>" +
          '<div class="flex wrap" style="gap:8px">' +
            '<button class="btn btn--outline btn--sm" data-view="' + b.id + '">View receipt</button>' +
            (carStillThere ? '<a class="btn btn--sm" href="car.html?id=' + b.carId + '">Book again</a>' : '<button class="btn btn--sm" disabled>Car retired</button>') +
            (canCancel ? '<button class="btn btn--danger btn--sm" data-cancel="' + b.id + '">Cancel</button>' : "") +
          "</div>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function renderList() {
    const host = $("bookingsList");
    host.innerHTML = UI.loading("Loading your bookings…");

    setTimeout(function () {
      let mine = Store.getUserBookings(user.id);
      if (filter !== "all") mine = mine.filter((b) => Store.bookingPhase(b) === filter);

      if (!mine.length) {
        host.innerHTML = UI.emptyState({
          icon: "calendar",
          title: filter === "all" ? "No bookings yet" : "Nothing in “" + filter + "”",
          text: filter === "all"
            ? "When you reserve a car it appears here with its reference, dates and status."
            : "Try another tab, or reserve your next car from the fleet.",
          actionLabel: "Browse the fleet", actionHref: "browse.html"
        });
        return;
      }

      host.innerHTML = mine.map(bookingCard).join("");
      UI.reveal(host);

      host.querySelectorAll("[data-view]").forEach((btn) =>
        btn.addEventListener("click", () => showReceipt(btn.dataset.view))
      );
      host.querySelectorAll("[data-cancel]").forEach((btn) =>
        btn.addEventListener("click", () => cancelBooking(btn.dataset.cancel))
      );
    }, 300);
  }

  /* ---------------------------------------------------------- receipt */
  function showReceipt(id) {
    const b = Store.getBooking(id);
    if (!b) return;
    const rows = [
      ["Booking reference", b.id],
      ["Status", b.status],
      ["Car", b.carBrand + " " + b.carName + " · " + (b.carCategory || "")],
      ["Pick-up", UI.dateLong(b.pickupDate) + " at " + b.pickupTime],
      ["Return", UI.dateLong(b.returnDate) + " at " + b.returnTime],
      ["Duration", b.days + " " + UI.plural(b.days, "day") + " @ " + UI.money(b.pricePerDay) + "/day"],
      ["Location", b.location],
      ["Driver", b.userName + " · " + b.userLicense],
      ["Contact", b.userEmail + " · " + b.userPhone],
      ["Extras", [b.insurance && "Full cover (" + UI.money(b.insuranceCost) + ")", b.extraDriver && "Extra driver (" + UI.money(b.extraDriverCost) + ")", b.delivery && "Delivery (" + UI.money(b.deliveryCost) + ")", b.youngDriver && "Young driver (" + UI.money(b.youngDriverCost || 0) + ")"].filter(Boolean).join(", ") || "None"],
      ["Discount", b.discount ? "−" + UI.money(b.discount) + " · " + b.discountLabel : "None"],
      ["VAT", UI.money(b.tax, true)],
      ["Total", UI.money(b.total)]
    ];
    if (b.note) rows.push(["Your note", b.note]);
    if (b.deliveryAddress) rows.push(["Delivery address", b.deliveryAddress]);

    UI.modal({
      wide: true,
      title: "Rental receipt",
      subtitle: b.carName + " · " + b.id,
      body:
        '<div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:22px">' +
          '<img src="' + UI.esc(b.carImage) + '" alt="" style="width:170px;height:110px;object-fit:cover;border-radius:14px">' +
          "<div>" + UI.statusPill(b.status) + "<p class='small muted mt-1'>Booked " + UI.dateTime(b.createdAt) + "</p>" +
          '<p class="car-price mt-1">' + UI.money(b.total) + '<small> total</small></p></div>' +
        "</div>" +
        '<div class="table-wrap" style="border-radius:14px"><table class="data-table" style="min-width:0"><tbody>' +
          rows.map((r) => "<tr><td style='color:var(--muted);width:38%'>" + UI.esc(r[0]) + "</td><td><b>" + UI.esc(r[1]) + "</b></td></tr>").join("") +
        "</tbody></table></div>",
      footer: '<button class="btn btn--outline" data-x>Close</button><button class="btn" data-print>' + UI.icon("download", 16) + " Print</button>",
      onMount: function (root, close) {
        root.querySelector("[data-x]").addEventListener("click", close);
        root.querySelector("[data-print]").addEventListener("click", () => window.print());
      }
    });
  }

  /* ----------------------------------------------------------- cancel */
  async function cancelBooking(id) {
    const b = Store.getBooking(id);
    if (!b) return;
    const ok = await UI.confirm({
      title: "Cancel this booking?",
      subtitle: b.id + " · " + b.carName,
      message: "Pick-up " + UI.date(b.pickupDate) + " → return " + UI.date(b.returnDate) +
               ". Cancelling frees the car immediately and refunds " + UI.money(b.total) + " in full (more than 24h before pick-up).",
      confirmText: "Yes, cancel it"
    });
    if (!ok) return;

    Store.cancelBooking(id);
    UI.toast("Booking " + id + " cancelled.", "warn");
    renderProfile(); renderTabs(); renderList();
  }

  /* -------------------------------------------------------------- go */
  document.addEventListener("DOMContentLoaded", function () {
    $("accountRoot").classList.remove("hidden");
    $("refreshBtn").querySelector(".ico").innerHTML = UI.icon("refresh", 16);
    $("refreshBtn").addEventListener("click", function () {
      renderProfile(); renderTabs(); renderList();
      UI.toast("Bookings refreshed.", "info");
    });
    renderProfile();
    renderTabs();
    renderList();
    UI.reveal();
  });
})();

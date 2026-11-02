/* ==========================================================================
   VELOCE — booking.js : the 3-step reservation form (booking.html?id=…)
   --------------------------------------------------------------------------
   Step 1 trip dates  ->  Step 2 driver  ->  Step 3 extras + review + confirm
   The price panel on the right is recalculated after every change using the
   SAME Store.quote() function that the car page uses.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  const YOUNG_DRIVER_FEE = 45;

  const carId = UI.q("id");
  const car = carId ? Store.getCar(carId) : null;
  const user = Store.currentUser();
  const draft = Store.getDraft();

  const state = {
    step: 1,
    location: UI.q("location") || (draft && draft.location) || (car && car.pickup) || UI.LOCATIONS[0],
    pickup: UI.q("pickup") || (draft && draft.pickupDate) || Store.addDays(Store.todayISO(), 1),
    return: UI.q("return") || (draft && draft.returnDate) || Store.addDays(Store.todayISO(), 4),
    pickupTime: "10:00",
    returnTime: "10:00",
    insurance: UI.q("insurance") === "1" || !!(draft && draft.insurance),
    extraDriver: UI.q("extra") === "1" || !!(draft && draft.extraDriver),
    delivery: UI.q("delivery") === "1" || !!(draft && draft.delivery),
    youngDriver: false,
    deliveryAddress: "",
    notes: ""
  };

  /* ---------------------------------------------------------- guards */
  function guard() {
    if (!car) {
      $("guardRoot").innerHTML = UI.emptyState({
        icon: "alert", title: "No car selected",
        text: "Choose a car from the fleet first — the booking form needs to know what you are renting.",
        actionLabel: "Browse cars", actionHref: "browse.html"
      });
      return false;
    }
    if (!user) {
      $("guardRoot").innerHTML = UI.loading("Redirecting to sign in…");
      UI.requireLogin("Please sign in to book " + car.name + ".");
      const next = encodeURIComponent("booking.html?id=" + car.id + "&pickup=" + state.pickup + "&return=" + state.return);
      setTimeout(() => { window.location.href = "auth.html?next=" + next; }, 900);
      return false;
    }
    return true;
  }

  /* ----------------------------------------------------------- helpers */
  function setError(fieldId, message) {
    const input = $(fieldId);
    const wrap = input.closest(".field");
    wrap.classList.add("has-error");
    const msg = wrap.querySelector(".field-error");
    if (msg) msg.textContent = message || "Required";
  }
  function clearError(fieldId) {
    const wrap = $(fieldId).closest(".field");
    wrap.classList.remove("has-error");
  }
  function clearAllErrors() {
    document.querySelectorAll(".field.has-error").forEach((f) => f.classList.remove("has-error"));
    $("step1Error").innerHTML = ""; $("step3Error").innerHTML = "";
    $("termsError").style.display = "none";
  }

  /* -------------------------------------------------------- 1. init UI */
  function initForm() {
    $("location").innerHTML = UI.LOCATIONS.map((l) => "<option" + (l === state.location ? " selected" : "") + ">" + UI.esc(l) + "</option>").join("");
    const timeOpts = TIMES.map((t) => "<option>" + t + "</option>").join("");
    $("pickupTime").innerHTML = timeOpts;
    $("returnTime").innerHTML = timeOpts;

    $("pickupDate").value = state.pickup;
    $("returnDate").value = state.return;
    $("pickupDate").min = Store.todayISO();
    $("returnDate").min = Store.addDays(state.pickup, 1);
    $("pickupTime").value = state.pickupTime;
    $("returnTime").value = state.returnTime;

    // driver details come straight from the account (editable)
    $("fullName").value = user.name;
    $("email").value = user.email;
    $("phone").value = user.phone || "";
    $("license").value = user.license || "";
    $("noteIcon").innerHTML = UI.icon("info", 17);

    document.querySelectorAll(".ico").forEach((s) => (s.innerHTML = UI.icon("arrowRight", 17)));
    document.querySelectorAll(".ico-back").forEach((s) => (s.innerHTML = UI.icon("arrowLeft", 16)));

    // summary header
    $("sumImg").src = car.image;
    $("sumImg").alt = car.name;
    $("sumBrand").textContent = car.brand + " · " + car.category;
    $("sumName").textContent = car.name;

    renderExtras();
    wireEvents();
    renderSummary();
    renderReview();
  }

  /* --------------------------------------------------- 2. extras block */
  function renderExtras() {
    const rows = [
      { key: "insurance",   icon: "shield", t: "Full-cover protection", d: "Zero excess, includes tyres, glass and roof", p: "+" + UI.money(Store.PRICING.insurancePerDay) + "/day" },
      { key: "extraDriver", icon: "users",  t: "Additional driver",      d: "A second named driver on the contract",       p: "+" + UI.money(Store.PRICING.extraDriverPerDay) + "/day" },
      { key: "delivery",    icon: "pin",    t: "Deliver to my address",  d: "We bring the car within 25 km",               p: "+" + UI.money(Store.PRICING.deliveryFee) + " once" }
    ];
    $("extras").innerHTML = rows.map(function (r) {
      return '<label class="switch-row' + (state[r.key] ? " is-on" : "") + '" data-key="' + r.key + '">' +
               '<input type="checkbox"' + (state[r.key] ? " checked" : "") + ">" +
               '<span class="switch"></span>' +
               '<span class="switch-text" style="display:flex;gap:10px;align-items:center">' +
                 '<span style="color:var(--blue-600)">' + UI.icon(r.icon, 18) + "</span>" +
                 "<span><b>" + r.t + "</b><span>" + r.d + "</span></span></span>" +
               '<span class="switch-price">' + r.p + "</span></label>";
    }).join("");

    $("extras").querySelectorAll(".switch-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        e.preventDefault();
        const key = row.dataset.key;
        state[key] = !state[key];
        row.classList.toggle("is-on", state[key]);
        row.querySelector("input").checked = state[key];
        $("deliveryWrap").classList.toggle("hidden", !state.delivery);
        renderSummary(); renderReview();
      });
    });
    $("deliveryWrap").classList.toggle("hidden", !state.delivery);
  }

  /* ---------------------------------------------------- 3. live summary */
  function currentQuote() {
    const days = Store.daysBetween(state.pickup, state.return);
    const young = state.youngDriver ? YOUNG_DRIVER_FEE : 0;
    const q = Store.quote({
      pricePerDay: car.pricePerDay, days: days,
      insurance: state.insurance, extraDriver: state.extraDriver, delivery: state.delivery
    });
    q.youngDriverCost = young;
    q.tax = Store.round2(q.tax + young * Store.PRICING.taxRate);
    q.total = Store.round2(q.total + young + young * Store.PRICING.taxRate);
    return q;
  }

  function renderSummary() {
    if ($("location")) state.location = $("location").value; // keep the panel in sync
    const days = Store.daysBetween(state.pickup, state.return);
    const valid = days >= 1 && state.pickup >= Store.todayISO();
    const q = currentQuote();

    $("sumPickup").textContent = valid ? UI.dateShort(state.pickup) + " · " + state.pickupTime : "—";
    $("sumReturn").textContent = valid ? UI.dateShort(state.return) + " · " + state.returnTime : "—";
    $("sumDays").textContent = valid ? days + " " + UI.plural(days, "day") : "—";
    $("sumLocation").textContent = state.location.split("·")[0].trim();

    let rows = '<div class="summary-row"><span>' + UI.money(car.pricePerDay) + " × " + Math.max(days, 0) + " " + UI.plural(Math.max(days, 0), "day") + "</span><b>" + UI.money(q.subtotal) + "</b></div>";
    if (q.discount) rows += '<div class="summary-row" style="color:#5fd3a4"><span>' + UI.esc(q.discountLabel) + "</span><b style='color:#5fd3a4'>−" + UI.money(q.discount) + "</b></div>";
    if (q.insuranceCost) rows += '<div class="summary-row"><span>Full-cover protection</span><b>' + UI.money(q.insuranceCost) + "</b></div>";
    if (q.extraDriverCost) rows += '<div class="summary-row"><span>Additional driver</span><b>' + UI.money(q.extraDriverCost) + "</b></div>";
    if (q.deliveryCost) rows += '<div class="summary-row"><span>Delivery</span><b>' + UI.money(q.deliveryCost) + "</b></div>";
    if (q.youngDriverCost) rows += '<div class="summary-row"><span>Young driver fee</span><b>' + UI.money(q.youngDriverCost) + "</b></div>";
    rows += '<div class="summary-row"><span>VAT (8.5%)</span><b>' + UI.money(q.tax, true) + "</b></div>";
    $("sumRows").innerHTML = rows;
    $("sumTotal").textContent = UI.money(q.total);
    return q;
  }

  function renderReview() {
    const q = renderSummary();
    const rows = [
      ["Car", car.brand + " " + car.name + " · " + car.category],
      ["Pick-up", UI.dateLong(state.pickup) + " at " + state.pickupTime],
      ["Return", UI.dateLong(state.return) + " at " + state.returnTime],
      ["Duration", Store.daysBetween(state.pickup, state.return) + " days"],
      ["Location", state.location],
      ["Main driver", $("fullName").value || "—"],
      ["Licence", $("license").value || "—"],
      ["Contact", ($("email").value || "—") + " · " + ($("phone").value || "—")],
      ["Extras", [state.insurance && "Full cover", state.extraDriver && "Extra driver", state.delivery && "Delivery", state.youngDriver && "Young driver"].filter(Boolean).join(", ") || "None"],
      ["Total", UI.money(q.total)]
    ];
    $("reviewList").innerHTML =
      '<div class="table-wrap" style="border-radius:14px"><table class="data-table" style="min-width:0">' +
      "<tbody>" + rows.map((r) => "<tr><td style='color:var(--muted);width:38%'>" + UI.esc(r[0]) + "</td><td><b>" + UI.esc(r[1]) + "</b></td></tr>").join("") + "</tbody></table></div>" +
      (state.delivery ? '<p class="hint mt-2">Delivering to: ' + UI.esc(state.deliveryAddress || "address not provided yet") + "</p>" : "");
  }

  /* ------------------------------------------------- 4. step navigation */
  function goStep(n) {
    state.step = n;
    clearAllErrors();
    document.querySelectorAll(".form-step").forEach((el) => el.classList.toggle("active", Number(el.dataset.step) === n));
    document.querySelectorAll(".flow-step").forEach(function (el) {
      const s = Number(el.dataset.step);
      el.classList.toggle("active", s === n);
      el.classList.toggle("done", s < n);
      el.querySelector(".dot").innerHTML = s < n ? UI.icon("check", 15) : s;
    });
    if (n === 3) renderReview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep1() {
    clearAllErrors();
    let ok = true;
    const p = $("pickupDate").value, r = $("returnDate").value;
    const days = Store.daysBetween(p, r);

    if (!p) { setError("pickupDate", "Pick a pick-up date"); ok = false; }
    else if (p < Store.todayISO()) { setError("pickupDate", "Date is in the past"); ok = false; }
    if (!r) { setError("returnDate", "Pick a return date"); ok = false; }
    else if (days < 1) { setError("returnDate", "Must be after pick-up"); ok = false; }
    else if (days > Store.PRICING.maxDays) { setError("returnDate", "Max " + Store.PRICING.maxDays + " days"); ok = false; }

    if (ok && !Store.isCarAvailable(car.id, p, r)) {
      const clash = Store.bookedRanges(car.id).filter((x) => p < x.to && r > x.from);
      $("step1Error").innerHTML = '<div class="alert alert--error">' + UI.icon("alert", 18) +
        "<span><b>" + car.name + " is already booked</b> for " +
        clash.map((c) => UI.date(c.from) + " → " + UI.date(c.to)).join(" and ") +
        ". Please choose different dates.</span></div>";
      ok = false;
    }
    if (ok) {
      state.pickup = p; state.return = r;
      state.location = $("location").value;
      state.pickupTime = $("pickupTime").value;
      state.returnTime = $("returnTime").value;
      Store.setDraft({ location: state.location, pickupDate: p, returnDate: r });
      renderSummary();
    }
    return ok;
  }

  function validateStep2() {
    clearAllErrors();
    let ok = true;
    const name = $("fullName").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const license = $("license").value.trim();

    if (name.length < 3 || name.indexOf(" ") === -1) { setError("fullName", "Enter your first and last name"); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("email", "That email does not look right"); ok = false; }
    if (phone.replace(/\D/g, "").length < 7) { setError("phone", "Enter a valid phone number"); ok = false; }
    if (license.length < 4) { setError("license", "Licence number is required"); ok = false; }

    if (ok) {
      state.youngDriver = $("ageBand").value === "21-24";
      state.notes = $("notes").value.trim();
      // keep the profile in sync so the next booking is even faster
      Store.updateUser(user.id, { name: name, phone: phone, license: license });
      renderSummary();
    }
    return ok;
  }

  function validateStep3() {
    clearAllErrors();
    let ok = true;
    state.deliveryAddress = $("deliveryAddress").value.trim();
    if (state.delivery && state.deliveryAddress.length < 8) { setError("deliveryAddress", "Enter a full delivery address"); ok = false; }
    if (!$("terms").checked) { $("termsError").style.display = "block"; ok = false; }
    if (!Store.isCarAvailable(car.id, state.pickup, state.return)) {
      $("step3Error").innerHTML = '<div class="alert alert--error">' + UI.icon("alert", 18) +
        "<span>Someone booked this car while you were filling in the form. Please choose new dates.</span></div>";
      ok = false;
    }
    return ok;
  }

  /* ------------------------------------------------------- 5. confirm */
  function confirmBooking() {
    const btn = $("confirmBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:#fff"></span> Reserving…';

    // simulate the short wait a real payment/reservation call would take
    setTimeout(function () {
      const q = currentQuote();
      const days = Store.daysBetween(state.pickup, state.return);

      const booking = Store.createBooking({
        carId: car.id, carName: car.name, carBrand: car.brand, carImage: car.image, carCategory: car.category,
        userId: user.id, userName: $("fullName").value.trim(), userEmail: $("email").value.trim(),
        userPhone: $("phone").value.trim(), userLicense: $("license").value.trim(),
        pickupDate: state.pickup, returnDate: state.return,
        pickupTime: state.pickupTime, returnTime: state.returnTime,
        location: state.location, days: days, pricePerDay: car.pricePerDay,
        insurance: state.insurance, extraDriver: state.extraDriver, delivery: state.delivery,
        deliveryAddress: state.deliveryAddress, youngDriver: state.youngDriver,
        subtotal: q.subtotal, discount: q.discount, discountLabel: q.discountLabel,
        insuranceCost: q.insuranceCost, extraDriverCost: q.extraDriverCost,
        deliveryCost: q.deliveryCost, youngDriverCost: q.youngDriverCost,
        tax: q.tax, total: q.total,
        status: "confirmed", note: state.notes
      });

      Store.clearDraft();
      showSuccess(booking);
    }, 850);
  }

  function showSuccess(b) {
    $("bookingFlow").classList.add("hidden");
    const root = $("successRoot");
    root.classList.remove("hidden");

    const rows = [
      ["Booking reference", b.id],
      ["Car", b.carBrand + " " + b.carName],
      ["Pick-up", UI.dateLong(b.pickupDate) + " · " + b.pickupTime],
      ["Return", UI.dateLong(b.returnDate) + " · " + b.returnTime],
      ["Duration", b.days + " " + UI.plural(b.days, "day") + " @ " + UI.money(b.pricePerDay) + "/day"],
      ["Location", b.location],
      ["Driver", b.userName + " (" + b.userLicense + ")"],
      ["Extras", [b.insurance && "Full cover", b.extraDriver && "Extra driver", b.delivery && "Delivery", b.youngDriver && "Young driver"].filter(Boolean).join(", ") || "None"],
      ["Discount", b.discount ? "−" + UI.money(b.discount) + " (" + b.discountLabel + ")" : "None"],
      ["VAT", UI.money(b.tax, true)],
      ["Total", UI.money(b.total)]
    ];

    root.innerHTML =
      '<div class="panel success-screen reveal in" style="max-width:720px;margin:0 auto">' +
        '<div class="success-tick"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:40"><path d="M20 6 9 17l-5-5"/></svg></div>' +
        '<p class="eyebrow" style="justify-content:center">Reservation confirmed</p>' +
        '<h2 class="h-lg mt-1">Your keys are waiting.</h2>' +
        '<p class="lead mt-2" style="margin-inline:auto">We saved the booking to your account and emailed a copy to <b>' + UI.esc(b.userEmail) + "</b>.</p>" +
        '<div class="confirm-code">' + UI.esc(b.id) + "</div>" +
        '<div class="receipt">' + rows.map(function (r) {
          return '<div class="receipt-row"><span>' + UI.esc(r[0]) + "</span><b>" + UI.esc(r[1]) + "</b></div>";
        }).join("") + "</div>" +
        '<div class="flex wrap mt-4" style="justify-content:center">' +
          '<a class="btn btn--lg" href="bookings.html">Go to My bookings ' + UI.icon("arrowRight", 17) + "</a>" +
          '<button class="btn btn--outline btn--lg" id="printBtn">' + UI.icon("download", 17) + " Print summary</button>" +
          '<a class="btn btn--ghost btn--lg" href="browse.html" style="border-color:var(--line);color:var(--navy-900)">Book another car</a>' +
        "</div>" +
      "</div>";

    $("printBtn").addEventListener("click", () => window.print());
    window.scrollTo({ top: 0, behavior: "smooth" });
    UI.toast("Booking " + b.id + " confirmed!", "success");
  }

  /* ----------------------------------------------------------- events */
  function wireEvents() {
    $("toStep2").addEventListener("click", function () { if (validateStep1()) goStep(2); else UI.toast("Check the highlighted fields.", "error"); });
    $("toStep3").addEventListener("click", function () { if (validateStep2()) goStep(3); else UI.toast("Check the highlighted fields.", "error"); });

    document.querySelectorAll("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () { goStep(Number(b.dataset.back)); });
    });

    $("pickupDate").addEventListener("change", function () {
      $("returnDate").min = Store.addDays($("pickupDate").value, 1);
      if ($("returnDate").value <= $("pickupDate").value) $("returnDate").value = Store.addDays($("pickupDate").value, 3);
      renderSummary();
    });
    ["returnDate", "pickupTime", "returnTime", "location"].forEach(function (id) {
      $(id).addEventListener("change", renderSummary);
    });
    ["fullName", "email", "phone", "license", "notes", "ageBand"].forEach(function (id) {
      $(id).addEventListener("input", function () { clearError(id); if (state.step === 3) renderReview(); });
    });
    $("ageBand").addEventListener("change", function () { state.youngDriver = $("ageBand").value === "21-24"; renderSummary(); renderReview(); });
    $("deliveryAddress").addEventListener("input", function () { clearError("deliveryAddress"); });
    $("bookingForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep3()) { UI.toast("Please fix the highlighted fields.", "error"); return; }
      confirmBooking();
    });
    $("terms").addEventListener("change", function () { $("termsError").style.display = "none"; });
  }

  /* -------------------------------------------------------------- go */
  document.addEventListener("DOMContentLoaded", function () {
    if (!guard()) return;
    $("bookingFlow").classList.remove("hidden");
    initForm();
    goStep(1);
  });
})();

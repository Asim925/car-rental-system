/* ==========================================================================
   VELOCE — car.js : the car detail page (car.html?id=…)
   Shows the gallery, full specification and a live price + availability panel.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const carId = UI.q("id");
  const car = carId ? Store.getCar(carId) : null;

  /* ------------------------------------------------------- not-found UI */
  function notFound() {
    $("similarSection").classList.add("hidden");
    $("headBlock").innerHTML = "<h1>Car not found</h1>";
    $("crumbs").innerHTML = '<a href="index.html">Home</a> <span>/</span> <span style="color:#c8d5ea">Missing</span>';
    $("detailRoot").innerHTML = UI.emptyState({
      icon: "alert",
      title: "We could not find that car",
      text: "The link may be out of date, or the car was removed by an admin. The full fleet is still one click away.",
      actionLabel: "Browse all cars", actionHref: "browse.html"
    });
  }

  /* ------------------------------------------------------------ state */
  const draft = Store.getDraft();
  const state = {
    pickup: UI.q("pickup") || (draft && draft.pickupDate) || Store.addDays(Store.todayISO(), 1),
    return: UI.q("return") || (draft && draft.returnDate) || Store.addDays(Store.todayISO(), 4),
    location: UI.q("location") || (draft && draft.location) || (car && car.pickup) || UI.LOCATIONS[0],
    insurance: false,
    extraDriver: false,
    delivery: false,
    imgIndex: 0
  };

  /* =========================================================== RENDER */
  function renderHead() {
    document.title = car.name + " for rent — Veloce";
    $("crumbs").innerHTML =
      '<a href="index.html">Home</a> <span>/</span> <a href="browse.html">Cars</a> <span>/</span> ' +
      '<a href="browse.html?category=' + encodeURIComponent(car.category) + '">' + UI.esc(car.category) + '</a> <span>/</span> ' +
      '<span style="color:#c8d5ea">' + UI.esc(car.name) + "</span>";

    $("headBlock").innerHTML =
      '<div class="flex-between wrap mt-1" style="align-items:flex-end">' +
        "<div>" +
          '<p class="eyebrow">' + UI.esc(car.brand) + " · " + car.year + " · " + UI.esc(car.category) + "</p>" +
          "<h1 style='font-size:clamp(2rem,4.4vw,3.3rem);margin-top:12px'>" + UI.esc(car.name) + "</h1>" +
          '<p style="color:#a9bbd8;margin-top:12px;max-width:56ch">' + UI.esc(car.tagline || "") + "</p>" +
          '<div class="flex wrap mt-3" style="gap:10px">' +
            '<span class="chip"><span class="stars" style="color:#ffc542">' + UI.stars(car.rating) + "</span> " + car.rating.toFixed(1) + " · " + car.reviews + " reviews</span>" +
            '<span class="chip">' + UI.icon("pin", 14) + " " + UI.esc(car.pickup) + "</span>" +
            (car.featured ? '<span class="chip">' + UI.icon("sparkle", 14) + " Featured</span>" : "") +
          "</div>" +
        "</div>" +
        '<div style="text-align:right">' +
          '<div class="price-hero" style="justify-content:flex-end"><b style="color:#fff">' + UI.money(car.pricePerDay) + '</b><span style="color:#8ba0c2">/ day</span></div>' +
          '<p class="tiny upper" style="color:#7d8ea9;margin-top:6px">incl. 150 km / day</p>' +
        "</div>" +
      "</div>";
  }

  function renderBody() {
    $("detailRoot").innerHTML =
      '<div class="detail-layout">' +
        /* ---------------- LEFT : gallery + specs + description ------------- */
        "<div>" +
          '<div class="gallery-main"><img id="mainImage" src="' + UI.esc(car.gallery[0]) + '" alt="' + UI.esc(car.name) + '"></div>' +
          '<div class="gallery-thumbs" id="thumbs"></div>' +

          '<div class="panel mt-3 reveal">' +
            '<h3 class="h-sm">Specification</h3>' +
            '<div class="spec-grid mt-3" id="specGrid"></div>' +
          "</div>" +

          '<div class="panel mt-3 reveal">' +
            '<h3 class="h-sm">About this car</h3>' +
            '<p class="mt-2" style="color:var(--ink-soft)">' + UI.esc(car.description) + "</p>" +
            '<hr class="divider">' +
            '<h3 class="h-sm">Included as standard</h3>' +
            '<ul class="feature-list mt-2" id="featureList"></ul>' +
          "</div>" +

          '<div class="panel mt-3 reveal">' +
            '<h3 class="h-sm">Good to know</h3>' +
            '<ul class="feature-list mt-2">' +
              item("Fuel policy: full-to-full (EVs leave at 80%+)") +
              item("Unlimited km on rentals of 3 days or more") +
              item("Free cancellation up to 24h before pick-up") +
              item("Driver must be 25+ with a full licence held 2 years") +
              item("Security deposit held, released within 5 days") +
              item("24/7 roadside assistance included") +
            "</ul>" +
          "</div>" +
        "</div>" +

        /* ---------------- RIGHT : booking panel ---------------------------- */
        '<div class="booking-panel">' +
          '<div class="panel" style="box-shadow:var(--shadow-md)">' +
            '<div class="flex-between">' +
              '<div class="price-hero"><b>' + UI.money(car.pricePerDay) + "</b><span>/ day</span></div>" +
              '<span class="badge badge--ok" id="availBadge">Available</span>' +
            "</div>" +
            '<div id="availMsg" class="mt-2"></div>' +

            '<div class="form-grid mt-3">' +
              '<div class="field span-2"><label class="label" for="bkLocation">Pick-up point</label>' +
                '<select class="select" id="bkLocation"></select></div>' +
              '<div class="field"><label class="label" for="bkPickup">Pick-up</label>' +
                '<input class="input" type="date" id="bkPickup"></div>' +
              '<div class="field"><label class="label" for="bkReturn">Return</label>' +
                '<input class="input" type="date" id="bkReturn"></div>' +
            "</div>" +
            '<div class="field-error" id="dateError" style="margin-top:8px"></div>' +

            '<div class="stack mt-3" style="gap:10px" id="extras"></div>' +

            '<div class="calc-rows" id="calcRows"></div>' +
            '<div class="calc-total"><span>Estimated total</span><b id="calcTotal">$0</b></div>' +
            '<p class="hint mt-1">Taxes included. Nothing is charged until you confirm on the next page.</p>' +

            '<button class="btn btn--lg btn--block mt-3" id="reserveBtn">Continue to booking</button>' +
            '<a class="btn btn--outline btn--block mt-2" href="browse.html">Keep browsing</a>' +
          "</div>" +

          '<div class="panel panel--dark mt-3" style="display:flex;gap:14px;align-items:flex-start">' +
            '<span style="color:var(--blue-300);margin-top:2px">' + UI.icon("shield", 20) + "</span>" +
            "<div><b style='color:#fff;font-size:.95rem'>Book with confidence</b>" +
            "<p style='color:#a9bbd8;font-size:.84rem;margin-top:5px'>Your reservation is held for 30 minutes while you finish the details, and you can cancel free up to 24 hours before pick-up.</p></div>" +
          "</div>" +
        "</div>" +
      "</div>";

    wire();
  }

  function item(text) {
    return '<li>' + UI.icon("check", 16) + "<span>" + UI.esc(text) + "</span></li>";
  }

  /* ------------------------------------------------------ gallery bits */
  function renderThumbs() {
    $("thumbs").innerHTML = car.gallery.map(function (src, i) {
      return '<button type="button" class="thumb' + (i === 0 ? " active" : "") + '" data-i="' + i + '" aria-label="View image ' + (i + 1) + '">' +
             '<img src="' + UI.esc(src) + '" alt="' + UI.esc(car.name) + ' view ' + (i + 1) + '" loading="lazy"></button>';
    }).join("");
    $("thumbs").addEventListener("click", function (e) {
      const b = e.target.closest(".thumb");
      if (!b) return;
      state.imgIndex = Number(b.dataset.i);
      $("mainImage").src = car.gallery[state.imgIndex];
      $("thumbs").querySelectorAll(".thumb").forEach((t, i) => t.classList.toggle("active", i === state.imgIndex));
    });
  }

  function renderSpecs() {
    const specs = [
      { i: "car", k: "Category", v: car.category },
      { i: "gear", k: "Gearbox", v: car.transmission },
      { i: "seat", k: "Seats", v: car.seats + " people" },
      { i: "fuel", k: "Fuel", v: car.fuel },
      { i: "bag", k: "Luggage", v: car.luggage + " bags" },
      { i: "door", k: "Doors", v: car.doors },
      { i: "gauge", k: "Model year", v: car.year },
      { i: "star", k: "Rating", v: car.rating.toFixed(1) + " / 5" }
    ];
    $("specGrid").innerHTML = specs.map(function (s) {
      return '<div class="spec-item"><div class="spec-ico">' + UI.icon(s.i, 20) + "</div>" +
             "<span>" + s.k + "</span><b>" + UI.esc(s.v) + "</b></div>";
    }).join("");
  }

  function renderFeatures() {
    $("featureList").innerHTML = car.features.map((f) => item(f)).join("");
  }

  /* ------------------------------------------------- booking panel bits */
  function renderExtras() {
    const rows = [
      { key: "insurance",   icon: "shield", t: "Full-cover protection", d: "Zero excess, tyre & glass included", p: UI.money(Store.PRICING.insurancePerDay) + "/day" },
      { key: "extraDriver", icon: "users",  t: "Additional driver",      d: "Share the wheel legally",             p: UI.money(Store.PRICING.extraDriverPerDay) + "/day" },
      { key: "delivery",    icon: "pin",    t: "Deliver the car to me",  d: "Within 25 km of the pick-up point",   p: UI.money(Store.PRICING.deliveryFee) + " once" }
    ];
    $("extras").innerHTML = rows.map(function (r) {
      return '<label class="switch-row' + (state[r.key] ? " is-on" : "") + '" data-key="' + r.key + '">' +
               '<input type="checkbox" ' + (state[r.key] ? "checked" : "") + '>' +
               '<span class="switch"></span>' +
               '<span class="switch-text" style="display:flex;gap:9px;align-items:center">' +
                 '<span style="color:var(--blue-600)">' + UI.icon(r.icon, 17) + "</span>" +
                 "<span><b>" + r.t + "</b><span>" + r.d + "</span></span></span>" +
               '<span class="switch-price">+' + r.p + "</span></label>";
    }).join("");

    $("extras").querySelectorAll(".switch-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        e.preventDefault();
        const key = row.dataset.key;
        state[key] = !state[key];
        row.classList.toggle("is-on", state[key]);
        row.querySelector("input").checked = state[key];
        renderCalc();
      });
    });
  }

  function renderCalc() {
    const days = Store.daysBetween(state.pickup, state.return);
    const q = Store.quote({
      pricePerDay: car.pricePerDay, days: days,
      insurance: state.insurance, extraDriver: state.extraDriver, delivery: state.delivery
    });

    let rows = '<div class="calc-row"><span>' + UI.money(car.pricePerDay) + " × " + days + " " + UI.plural(days, "day") + "</span><b>" + UI.money(q.subtotal) + "</b></div>";
    if (q.discount) rows += '<div class="calc-row discount"><span>' + UI.esc(q.discountLabel) + "</span><b>−" + UI.money(q.discount) + "</b></div>";
    if (q.insuranceCost) rows += '<div class="calc-row"><span>Full-cover protection</span><b>' + UI.money(q.insuranceCost) + "</b></div>";
    if (q.extraDriverCost) rows += '<div class="calc-row"><span>Additional driver</span><b>' + UI.money(q.extraDriverCost) + "</b></div>";
    if (q.deliveryCost) rows += '<div class="calc-row"><span>Delivery</span><b>' + UI.money(q.deliveryCost) + "</b></div>";
    rows += '<div class="calc-row"><span>VAT (8.5%)</span><b>' + UI.money(q.tax, true) + "</b></div>";
    if (days > 0) rows += '<div class="calc-row" style="padding-top:8px"><span class="hint">Effective per day</span><b>' + UI.money(q.effectivePerDay, true) + "</b></div>";

    $("calcRows").innerHTML = rows;
    $("calcTotal").textContent = UI.money(q.total);
    return q;
  }

  function renderAvailability() {
    const days = Store.daysBetween(state.pickup, state.return);
    const badge = $("availBadge"), msg = $("availMsg"), err = $("dateError"), btn = $("reserveBtn");
    let ok = true;
    let html = "";
    let errText = "";

    if (!state.pickup || !state.return) { ok = false; errText = "Choose both dates to see the price."; }
    else if (state.pickup < Store.todayISO()) { ok = false; errText = "Pick-up date cannot be in the past."; }
    else if (days < 1) { ok = false; errText = "Return date must be after the pick-up date."; }
    else if (days > Store.PRICING.maxDays) { ok = false; errText = "Maximum rental is " + Store.PRICING.maxDays + " days."; }
    else if (!Store.isCarAvailable(car.id, state.pickup, state.return)) {
      ok = false;
      const clash = Store.bookedRanges(car.id).filter((r) => state.pickup < r.to && state.return > r.from);
      html = '<div class="alert alert--warn">' + UI.icon("clock", 18) +
             "<span>Not free on those dates. Already booked: " +
             clash.map((c) => UI.date(c.from) + " → " + UI.date(c.to)).join(", ") + ". Try shifting your window.</span></div>";
    }

    if (ok) {
      badge.className = "badge badge--ok";
      badge.style.background = "";
      badge.style.color = "";
      badge.innerHTML = UI.icon("check", 12) + " Available · " + days + " " + UI.plural(days, "day");
      msg.innerHTML = "";
      err.style.display = "none";
      btn.disabled = false;
      btn.innerHTML = "Continue to booking " + UI.icon("arrowRight", 17);
    } else {
      badge.className = "badge";
      badge.style.background = "var(--danger-soft)";
      badge.style.color = "var(--danger)";
      badge.textContent = "Unavailable";
      msg.innerHTML = html;
      err.textContent = errText;
      err.style.display = errText ? "block" : "none";
      btn.disabled = true;
      btn.textContent = "Choose valid dates";
    }
    renderCalc();
    return ok;
  }

  /* ------------------------------------------------------------- wire */
  function wire() {
    const loc = $("bkLocation"), pick = $("bkPickup"), ret = $("bkReturn");

    loc.innerHTML = UI.LOCATIONS.map(function (l) {
      return "<option" + (l === state.location ? " selected" : "") + ">" + UI.esc(l) + "</option>";
    }).join("");
    pick.value = state.pickup;
    ret.value = state.return;
    pick.min = Store.todayISO();
    ret.min = Store.addDays(state.pickup, 1);

    loc.addEventListener("change", function () { state.location = loc.value; Store.setDraft({ location: loc.value, pickupDate: state.pickup, returnDate: state.return }); });

    pick.addEventListener("change", function () {
      state.pickup = pick.value;
      ret.min = Store.addDays(pick.value, 1);
      if (ret.value <= pick.value) { ret.value = Store.addDays(pick.value, 3); state.return = ret.value; }
      Store.setDraft({ location: state.location, pickupDate: state.pickup, returnDate: state.return });
      renderAvailability();
    });

    ret.addEventListener("change", function () {
      state.return = ret.value;
      Store.setDraft({ location: state.location, pickupDate: state.pickup, returnDate: state.return });
      renderAvailability();
    });

    $("reserveBtn").addEventListener("click", function () {
      if (!renderAvailability()) { UI.toast("Please fix the dates first.", "warn"); return; }
      Store.setDraft({ location: state.location, pickupDate: state.pickup, returnDate: state.return, insurance: state.insurance, extraDriver: state.extraDriver, delivery: state.delivery });
      const p = new URLSearchParams({
        id: car.id, pickup: state.pickup, return: state.return, location: state.location,
        insurance: state.insurance ? "1" : "0", extra: state.extraDriver ? "1" : "0", delivery: state.delivery ? "1" : "0"
      });
      window.location.href = "booking.html?" + p.toString();
    });

    renderAvailability();
  }

  /* --------------------------------------------------------- similar */
  function renderSimilar() {
    $("arr").innerHTML = UI.icon("arrowRight", 16);
    const pool = Store.getCars().filter((c) => c.id !== car.id);
    let list = pool.filter((c) => c.category === car.category);
    if (list.length < 3) list = list.concat(pool.filter((c) => c.brand === car.brand || Math.abs(c.pricePerDay - car.pricePerDay) < 90));
    list = list.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i).slice(0, 3);

    if (!list.length) { $("similarSection").classList.add("hidden"); return; }
    $("similarGrid").innerHTML = list.map((c) => UI.carCard(c, { compact: true })).join("");
    UI.reveal($("similarGrid"));
  }

  /* -------------------------------------------------------------- go */
  document.addEventListener("DOMContentLoaded", function () {
    if (!car) { notFound(); return; }
    $("detailRoot").innerHTML = UI.loading("Loading " + car.name + "…");
    setTimeout(function () {
      renderHead();
      renderBody();
      renderThumbs();
      renderSpecs();
      renderFeatures();
      renderExtras();
      renderSimilar();
      UI.reveal();
    }, 300);
  });
})();

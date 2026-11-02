/* ==========================================================================
   VELOCE — browse.js : search, filter and sort the car catalogue
   --------------------------------------------------------------------------
   One `state` object holds every filter. Every control updates the state and
   calls render(), which re-draws the grid. That is the whole page in a loop:
       control changes -> state changes -> render()
   ========================================================================== */
(function () {
  "use strict";

  const allCars = Store.getCars();
  const prices = allCars.map((c) => c.pricePerDay);
  // safe fallbacks in case an admin deletes every car
  const PRICE_MIN = prices.length ? Math.floor(Math.min.apply(null, prices) / 10) * 10 : 0;
  const PRICE_MAX = prices.length ? Math.ceil(Math.max.apply(null, prices) / 10) * 10 : 500;

  const state = {
    q: "",
    categories: new Set(),
    brands: new Set(),
    transmission: new Set(),
    seats: new Set(),
    fuel: new Set(),
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
    sort: "featured",
    pickup: UI.q("pickup") || (Store.getDraft() && Store.getDraft().pickupDate) || "",
    return: UI.q("return") || (Store.getDraft() && Store.getDraft().returnDate) || "",
    location: UI.q("location") || (Store.getDraft() && Store.getDraft().location) || ""
  };

  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------ 1. read URL */
  function readUrlFilters() {
    const q = UI.q("q");
    if (q) state.q = q;
    const cat = UI.q("category");
    if (cat) state.categories.add(cat);
    const brand = UI.q("brand");
    if (brand) state.brands.add(brand);
    const sort = UI.q("sort");
    if (sort) state.sort = sort;
    const max = UI.q("max");
    if (max) state.maxPrice = Math.min(PRICE_MAX, Number(max));
  }

  /* ------------------------------------------------- 2. build controls */
  function pillGroup(hostId, items, set, formatter) {
    const host = $(hostId);
    host.innerHTML = items.map(function (it) {
      const label = formatter ? formatter(it) : it.label;
      const active = set.has(it.value) ? " active" : "";
      return '<button type="button" class="pill' + active + '" data-value="' + UI.esc(it.value) + '">' + UI.esc(label) + "</button>";
    }).join("");
    host.addEventListener("click", function (e) {
      const btn = e.target.closest(".pill");
      if (!btn) return;
      const v = btn.dataset.value;
      if (set.has(v)) set.delete(v); else set.add(v);
      btn.classList.toggle("active");
      render();
    });
  }

  function buildControls() {
    $("filterIcon").innerHTML = UI.icon("filter", 17);
    $("searchIcon").innerHTML = UI.icon("search", 17);

    // categories with counts
    pillGroup("categoryPills", Store.getCategories().map(function (c) {
      return { value: c, label: c + " (" + allCars.filter((x) => x.category === c).length + ")" };
    }), state.categories);

    // transmission + seats + fuel
    pillGroup("transPills", [{ value: "Automatic", label: "Automatic" }, { value: "Manual", label: "Manual" }], state.transmission);
    const seatOptions = Array.from(new Set(allCars.map((c) => c.seats))).sort((a, b) => a - b);
    pillGroup("seatPills", seatOptions.map((s) => ({ value: String(s), label: s + "+" })), state.seats);
    const fuelOptions = Array.from(new Set(allCars.map((c) => c.fuel))).sort();
    pillGroup("fuelPills", fuelOptions.map((f) => ({ value: f, label: f })), state.fuel);

    // brands as checkboxes (multi-select)
    const brandHost = $("brandChecks");
    brandHost.innerHTML = Store.getBrands().map(function (b) {
      const count = allCars.filter((c) => c.brand === b).length;
      return '<label class="check"><input type="checkbox" value="' + UI.esc(b) + '"' + (state.brands.has(b) ? " checked" : "") + ">" +
             '<span class="box"></span><span>' + UI.esc(b) + '</span><span class="count">' + count + "</span></label>";
    }).join("");
    brandHost.addEventListener("change", function (e) {
      if (e.target.type !== "checkbox") return;
      if (e.target.checked) state.brands.add(e.target.value); else state.brands.delete(e.target.value);
      render();
    });

    // search (debounced so typing feels smooth)
    let t;
    $("searchInput").addEventListener("input", function (e) {
      clearTimeout(t);
      t = setTimeout(function () { state.q = e.target.value.trim(); render(); }, 220);
    });

    // price sliders
    const min = $("minPrice"), max = $("maxPrice");
    min.min = max.min = PRICE_MIN;
    min.max = max.max = PRICE_MAX;
    min.value = state.minPrice;
    max.value = state.maxPrice;
    function priceLabel() {
      $("priceLabel").textContent = UI.money(state.minPrice) + " – " + (state.maxPrice >= PRICE_MAX ? UI.money(PRICE_MAX) + "+" : UI.money(state.maxPrice));
    }
    priceLabel();
    min.addEventListener("input", function () {
      state.minPrice = Number(min.value);
      if (state.minPrice > state.maxPrice) { state.maxPrice = state.minPrice; max.value = state.maxPrice; }
      priceLabel(); render();
    });
    max.addEventListener("input", function () {
      state.maxPrice = Number(max.value);
      if (state.maxPrice < state.minPrice) { state.minPrice = state.maxPrice; min.value = state.minPrice; }
      priceLabel(); render();
    });

    // sort
    $("sortSelect").value = state.sort;
    $("sortSelect").addEventListener("change", function (e) { state.sort = e.target.value; render(); });

    // clear all
    $("clearAll").addEventListener("click", clearAll);
  }

  function clearAll() {
    state.q = ""; state.categories.clear(); state.brands.clear();
    state.transmission.clear(); state.seats.clear(); state.fuel.clear();
    state.minPrice = PRICE_MIN; state.maxPrice = PRICE_MAX; state.sort = "featured";
    $("searchInput").value = "";
    $("minPrice").value = PRICE_MIN; $("maxPrice").value = PRICE_MAX;
    $("sortSelect").value = "featured";
    $("priceLabel").textContent = UI.money(PRICE_MIN) + " – " + UI.money(PRICE_MAX) + "+";
    document.querySelectorAll("#categoryPills .pill, #transPills .pill, #seatPills .pill, #fuelPills .pill")
      .forEach((p) => p.classList.remove("active"));
    document.querySelectorAll("#brandChecks input").forEach((c) => (c.checked = false));
    render();
    UI.toast("Filters cleared.", "info");
  }

  /* --------------------------------------------------- 3. filter + sort */
  function applyFilters() {
    const needle = state.q.toLowerCase();
    let list = allCars.filter(function (c) {
      if (needle && !(c.name.toLowerCase().includes(needle) || c.brand.toLowerCase().includes(needle) || c.category.toLowerCase().includes(needle))) return false;
      if (state.categories.size && !state.categories.has(c.category)) return false;
      if (state.brands.size && !state.brands.has(c.brand)) return false;
      if (state.transmission.size && !state.transmission.has(c.transmission)) return false;
      if (state.fuel.size && !state.fuel.has(c.fuel)) return false;
      if (state.seats.size) {
        const wantMin = Math.min.apply(null, Array.from(state.seats).map(Number));
        if (c.seats < wantMin) return false;
      }
      if (c.pricePerDay < state.minPrice || c.pricePerDay > state.maxPrice) return false;
      return true;
    });

    const sorters = {
      "price-asc": (a, b) => a.pricePerDay - b.pricePerDay,
      "price-desc": (a, b) => b.pricePerDay - a.pricePerDay,
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name),
      featured: (a, b) => (b.featured - a.featured) || (b.rating - a.rating)
    };
    return list.sort(sorters[state.sort] || sorters.featured);
  }

  /* --------------------------------------------------------- 4. render */
  function render() {
    const grid = $("resultsGrid");
    const list = applyFilters();

    $("resultsCount").innerHTML = "<b>" + list.length + "</b> <span>" + UI.plural(list.length, "car") + " match your filters</span>";

    // removable tags for whatever is active
    const tags = [];
    if (state.q) tags.push({ k: "q", label: "“" + state.q + "”" });
    state.categories.forEach((v) => tags.push({ k: "categories", v: v, label: v }));
    state.brands.forEach((v) => tags.push({ k: "brands", v: v, label: v }));
    state.transmission.forEach((v) => tags.push({ k: "transmission", v: v, label: v }));
    state.fuel.forEach((v) => tags.push({ k: "fuel", v: v, label: v }));
    state.seats.forEach((v) => tags.push({ k: "seats", v: v, label: v + "+ seats" }));
    if (state.minPrice > PRICE_MIN || state.maxPrice < PRICE_MAX) {
      tags.push({ k: "price", label: UI.money(state.minPrice) + " – " + UI.money(state.maxPrice) });
    }
    $("activeFilters").innerHTML = tags.map(function (t, i) {
      return '<span class="filter-tag">' + UI.esc(t.label) + '<button type="button" data-i="' + i + '" aria-label="Remove filter">' + UI.icon("close", 13) + "</button></span>";
    }).join("");
    $("activeFilters").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        const t = tags[Number(b.dataset.i)];
        if (t.k === "q") { state.q = ""; $("searchInput").value = ""; }
        else if (t.k === "price") { state.minPrice = PRICE_MIN; state.maxPrice = PRICE_MAX; $("minPrice").value = PRICE_MIN; $("maxPrice").value = PRICE_MAX; }
        else { state[t.k].delete(t.v); document.querySelectorAll('[data-value="' + CSS.escape(t.v) + '"]').forEach((el) => { el.classList.remove("active"); if (el.type === "checkbox") el.checked = false; }); }
        render();
      });
    });

    if (!list.length) {
      grid.innerHTML = UI.emptyState({
        icon: "search",
        title: "No cars match those filters",
        text: "Try widening the price range or removing a brand — we have " + allCars.length + " cars in total.",
        actionLabel: "Clear all filters", actionHref: "#"
      });
      const btn = grid.querySelector(".btn");
      if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); clearAll(); });
      return;
    }

    grid.innerHTML = list.map((c) => UI.carCard(c)).join("");

    // keep the chosen dates on every car link so the detail page can prefill
    if (state.pickup && state.return) {
      const extra = "&pickup=" + state.pickup + "&return=" + state.return + "&location=" + encodeURIComponent(state.location);
      grid.querySelectorAll("a[href^='car.html']").forEach((a) => { a.href += extra; });
    }
    UI.reveal(grid);
    syncUrl();
  }

  /* --------------------------------------------------- 5. URL syncing */
  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.categories.size) p.set("category", Array.from(state.categories).join(","));
    if (state.brands.size) p.set("brand", Array.from(state.brands).join(","));
    if (state.sort !== "featured") p.set("sort", state.sort);
    if (state.maxPrice < PRICE_MAX) p.set("max", state.maxPrice);
    if (state.pickup) p.set("pickup", state.pickup);
    if (state.return) p.set("return", state.return);
    const qs = p.toString();
    history.replaceState(null, "", qs ? "browse.html?" + qs : "browse.html");
  }

  /* --------------------------------------- 6. rental dates banner */
  function renderBanner() {
    const host = $("rentalBanner");
    if (!state.pickup || !state.return) { host.innerHTML = ""; return; }
    const days = Store.daysBetween(state.pickup, state.return);
    if (days < 1) { host.innerHTML = ""; return; }

    host.innerHTML =
      '<div class="panel panel--dark" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:16px 20px;border-radius:16px">' +
        '<span style="color:var(--blue-300)">' + UI.icon("calendar", 20) + "</span>" +
        "<div><span class='tiny upper' style='color:#8ba0c2'>Your rental window</span>" +
        "<b style='color:#fff;font-family:var(--display);font-size:1.1rem;display:block'>" +
          UI.date(state.pickup) + " → " + UI.date(state.return) + " · " + days + " " + UI.plural(days, "day") + "</b></div>" +
        '<div style="margin-left:auto" class="flex">' +
          "<span class='chip' style='background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#c8d5ea'>" + UI.icon("pin", 14) + " " + UI.esc(state.location || "Any pick-up point") + "</span>" +
          '<button class="btn btn--ghost btn--sm" id="editDates">Edit dates</button>' +
        "</div></div>";

    $("editDates").addEventListener("click", editDatesModal);
  }

  function editDatesModal() {
    UI.modal({
      title: "Change your rental dates",
      subtitle: "Availability is checked the moment you continue to booking.",
      body:
        '<div class="form-grid">' +
          '<div class="field"><label class="label" for="mPick">Pick-up</label><input class="input" type="date" id="mPick" value="' + state.pickup + '"></div>' +
          '<div class="field"><label class="label" for="mRet">Return</label><input class="input" type="date" id="mRet" value="' + state.return + '"></div>' +
        "</div><div id='mErr' class='mt-2'></div>",
      footer: '<button class="btn btn--outline" data-x>Cancel</button><button class="btn" data-ok>Apply dates</button>',
      onMount: function (root, close) {
        const pick = root.querySelector("#mPick"), ret = root.querySelector("#mRet"), err = root.querySelector("#mErr");
        pick.min = Store.todayISO();
        root.querySelector("[data-x]").addEventListener("click", close);
        root.querySelector("[data-ok]").addEventListener("click", function () {
          const days = Store.daysBetween(pick.value, ret.value);
          if (!pick.value || !ret.value) { err.innerHTML = "<div class='alert alert--error'>Both dates are required.</div>"; return; }
          if (pick.value < Store.todayISO()) { err.innerHTML = "<div class='alert alert--error'>Pick-up cannot be in the past.</div>"; return; }
          if (days < 1) { err.innerHTML = "<div class='alert alert--error'>Return must be after pick-up.</div>"; return; }
          state.pickup = pick.value; state.return = ret.value;
          Store.setDraft({ location: state.location, pickupDate: pick.value, returnDate: ret.value });
          close(); renderBanner(); render();
          UI.toast("Dates updated: " + days + " " + UI.plural(days, "day") + ".", "success");
        });
      }
    });
  }

  /* ------------------------------------------------------------- boot */
  document.addEventListener("DOMContentLoaded", function () {
    readUrlFilters();
    $("resultsGrid").innerHTML = UI.skeletons(6); // loading state
    buildControls();
    renderBanner();
    $("searchInput").value = state.q;
    setTimeout(render, 380);
  });
})();

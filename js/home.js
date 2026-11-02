/* ==========================================================================
   VELOCE — home.js : logic for index.html only
   ========================================================================== */
(function () {
  "use strict";

  const cars = Store.getCars();

  /* ------------------------------------------------ 1. hero numbers */
  function paintHero() {
    if (!cars.length) {
      document.getElementById("heroFleet").textContent = "0";
      document.getElementById("heroRating").textContent = "—";
      document.getElementById("heroFrom").textContent = "—";
      document.getElementById("statCars").dataset.count = 0;
      return;
    }
    const cheapest = cars.slice().sort((a, b) => a.pricePerDay - b.pricePerDay)[0];
    const best = cars.slice().sort((a, b) => b.rating - a.rating)[0];
    const totalReviews = cars.reduce((s, c) => s + (c.reviews || 0), 0);
    const avgRating = (cars.reduce((s, c) => s + c.rating, 0) / cars.length).toFixed(1);

    document.getElementById("heroFleet").textContent = cars.length;
    document.getElementById("heroRating").textContent = avgRating + "★";
    document.getElementById("heroFrom").textContent = UI.money(cheapest.pricePerDay);
    document.getElementById("cheapLabel").textContent = cheapest.brand + " " + cheapest.name;
    document.getElementById("cheapPrice").innerHTML = UI.money(cheapest.pricePerDay) + '<small style="font-size:.7rem"> /day</small>';
    document.getElementById("topCarName").textContent = best.rating.toFixed(1) + " / 5";
    document.getElementById("topCarSub").textContent = UI.num(totalReviews) + " verified reviews";

    // animated stat counter for "cars available"
    const statCars = document.getElementById("statCars");
    statCars.dataset.count = cars.length;
  }

  /* ------------------------------------------------ 2. brand marquee */
  function paintMarquee() {
    const brands = Store.getBrands();
    const row = brands.map((b) => "<span>" + UI.esc(b) + "</span>").join("");
    document.getElementById("brandMarquee").innerHTML = row + row; // duplicated for a seamless loop
  }

  /* ------------------------------------------------ 3. quick booking */
  function initQuickBook() {
    const loc = document.getElementById("qbLocation");
    const pickup = document.getElementById("qbPickup");
    const ret = document.getElementById("qbReturn");
    const form = document.getElementById("quickBook");
    const today = Store.todayISO();

    loc.innerHTML = UI.LOCATIONS.map((l) => "<option>" + UI.esc(l) + "</option>").join("");

    // sensible defaults: tomorrow -> +4 days
    const draft = Store.getDraft();
    pickup.value = (draft && draft.pickupDate) || Store.addDays(today, 1);
    ret.value = (draft && draft.returnDate) || Store.addDays(today, 4);
    pickup.min = today;
    ret.min = Store.addDays(pickup.value, 1);
    if (draft && draft.location) loc.value = draft.location;

    pickup.addEventListener("change", function () {
      ret.min = Store.addDays(pickup.value, 1);
      if (ret.value && ret.value <= pickup.value) ret.value = Store.addDays(pickup.value, 3);
      Store.setDraft({ location: loc.value, pickupDate: pickup.value, returnDate: ret.value });
    });
    ret.addEventListener("change", function () {
      Store.setDraft({ location: loc.value, pickupDate: pickup.value, returnDate: ret.value });
    });
    loc.addEventListener("change", function () {
      Store.setDraft({ location: loc.value, pickupDate: pickup.value, returnDate: ret.value });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!pickup.value || !ret.value) { UI.toast("Please choose both dates.", "warn"); return; }
      if (pickup.value < today) { UI.toast("Pick-up date cannot be in the past.", "error"); return; }
      const days = Store.daysBetween(pickup.value, ret.value);
      if (days < 1) { UI.toast("Return must be at least one day after pick-up.", "error"); return; }
      if (days > Store.PRICING.maxDays) { UI.toast("Maximum rental length is " + Store.PRICING.maxDays + " days.", "error"); return; }

      Store.setDraft({ location: loc.value, pickupDate: pickup.value, returnDate: ret.value });
      UI.toast("Searching " + cars.length + " cars for " + days + " " + UI.plural(days, "day") + "…", "success");
      const params = new URLSearchParams({ pickup: pickup.value, return: ret.value, location: loc.value });
      setTimeout(() => { window.location.href = "browse.html?" + params.toString(); }, 450);
    });

    document.getElementById("qbArrow").innerHTML = UI.icon("arrowRight", 17);
  }

  /* ------------------------------------------------ 4. featured grid */
  function paintFeatured() {
    const grid = document.getElementById("featuredGrid");
    grid.innerHTML = UI.loading("Loading featured cars…");
    // small delay so the loading state is visible (feels like a real fetch)
    setTimeout(function () {
      const list = cars.filter((c) => c.featured).slice(0, 6);
      grid.innerHTML = list.length
        ? list.map((c) => UI.carCard(c)).join("")
        : UI.emptyState({ icon: "car", title: "Nothing featured yet", text: "Check the full fleet instead." });
      UI.reveal(grid);
    }, 350);
  }

  /* ------------------------------------------------ 5. category bento */
  const CATEGORY_META = {
    Sports:    { copy: "Weekend-shaped, loud, unforgettable", size: "tile-wide" },
    Luxury:    { copy: "Arrivals, weddings, big meetings",     size: "" },
    Electric:  { copy: "Silent, instant, cheap to fuel",       size: "tile-tall" },
    SUV:       { copy: "Kids, kit and gravel roads",           size: "" },
    Sedan:     { copy: "The sensible long-distance choice",    size: "" },
    Compact:   { copy: "City parking, airport runs",           size: "" },
    Classic:   { copy: "Heritage collection, by appointment",  size: "" }
  };

  function paintCategories() {
    const cats = Store.getCategories();
    const html = cats.map(function (cat) {
      const list = cars.filter((c) => c.category === cat);
      const meta = CATEGORY_META[cat] || { copy: "Browse this category", size: "" };
      const cover = list[0].image;
      const from = Math.min.apply(null, list.map((c) => c.pricePerDay));
      return '<a class="bento-tile ' + meta.size + ' reveal" href="browse.html?category=' + encodeURIComponent(cat) + '">' +
               '<img src="' + UI.esc(cover) + '" alt="' + UI.esc(cat) + ' cars" loading="lazy">' +
               '<span class="tile-arrow">' + UI.icon("arrowRight", 16) + "</span>" +
               "<div><span class='badge badge--blue' style='margin-bottom:10px'>" + list.length + " " + UI.plural(list.length, "car") + " · from " + UI.money(from) + "</span>" +
               "<h3>" + UI.esc(cat) + "</h3><p>" + meta.copy + "</p></div>" +
             "</a>";
    }).join("");
    document.getElementById("bentoGrid").innerHTML = html;
    UI.reveal();
  }

  /* ------------------------------------------------ 6. popular rail */
  function paintPopular() {
    const rail = document.getElementById("popularRail");
    const list = cars.filter((c) => c.popular);
    rail.innerHTML = list.map((c) => UI.carCard(c)).join("");
    UI.reveal(rail);

    const step = () => Math.min(380, rail.clientWidth * 0.8);
    document.getElementById("railPrev").innerHTML = UI.icon("arrowLeft", 17);
    document.getElementById("railNext").innerHTML = UI.icon("arrowRight", 17);
    document.getElementById("railPrev").addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    document.getElementById("railNext").addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
  }

  /* ------------------------------------------------ 7. how it works */
  const STEPS = [
    { t: "Pick your dates", d: "Choose a pick-up point and the days you need. The price updates as you type." },
    { t: "Choose the car", d: "Filter by category, brand, seats or budget. Every listing shows the real total." },
    { t: "Confirm in seconds", d: "Add insurance or delivery if you want them. Get a booking reference instantly." },
    { t: "Collect the keys", d: "Show your reference at the desk or have the car delivered to your door." }
  ];

  function paintSteps() {
    document.getElementById("stepsLine").innerHTML = STEPS.map(function (s, i) {
      return '<div class="step-item reveal reveal-d' + (i + 1) + '">' +
               '<div class="step-num">0' + (i + 1) + "</div>" +
               "<h3>" + s.t + "</h3><p>" + s.d + "</p></div>";
    }).join("");
    UI.reveal();
  }

  /* ------------------------------------------------ 8. testimonials */
  const QUOTES = [
    { q: "Booked a Defender on a Thursday for a Friday morning. Delivered to the trailhead with a full tank and a roof box already fitted.", n: "Marta Kowalski", r: "Rented Defender 110 · 4 days" },
    { q: "The quote on the website was the number on the invoice. That never happens with rentals.", n: "Daniel Osei", r: "Rented Model S Plaid · 9 days" },
    { q: "We took the Miura for our wedding. It arrived on a covered trailer and the handover felt like a museum opening.", n: "Priya & Tom Raman", r: "Rented Miura S · 1 day" },
    { q: "Cancelling two days early cost me nothing and took one click in My Bookings. I will not book anywhere else.", n: "Elena Fischer", r: "Rented GV70 Sport · 6 days" }
  ];

  const PERKS = [
    { i: "wallet",  t: "The price you see", d: "Taxes, discounts and options are calculated before you confirm — never after." },
    { i: "shield",  t: "Full cover available", d: "Flat daily protection with zero excess, added with one switch." },
    { i: "clock",   t: "Free 24h cancellation", d: "Plans change. Cancel from your account up to a day before pick-up." },
    { i: "bolt",    t: "EV-ready pick-up",     d: "Every electric car leaves with at least an 80% charge." }
  ];

  function paintTestimonials() {
    const box = document.getElementById("quoteBox");
    box.innerHTML = QUOTES.map(function (t, i) {
      return '<figure class="quote-card' + (i === 0 ? " active" : "") + '" data-i="' + i + '">' +
               '<div class="stars" style="font-size:1rem;margin-bottom:16px">★★★★★</div>' +
               "<blockquote>“" + t.q + "”</blockquote>" +
               '<figcaption class="quote-person"><span class="avatar">' + UI.initials(t.n) + "</span>" +
               "<span><b>" + UI.esc(t.n) + "</b><span>" + UI.esc(t.r) + "</span></span></figcaption></figure>";
    }).join("");

    const dots = document.getElementById("quoteDots");
    dots.innerHTML = QUOTES.map((_, i) => '<button type="button" data-i="' + i + '" aria-label="Review ' + (i + 1) + '"' + (i === 0 ? ' class="active"' : "") + "></button>").join("");

    let current = 0;
    let timer = setInterval(next, 6500);

    function show(i) {
      current = (i + QUOTES.length) % QUOTES.length;
      box.querySelectorAll(".quote-card").forEach((c) => c.classList.toggle("active", Number(c.dataset.i) === current));
      dots.querySelectorAll("button").forEach((b, bi) => b.classList.toggle("active", bi === current));
    }
    function next() { show(current + 1); }

    dots.addEventListener("click", function (e) {
      const b = e.target.closest("button");
      if (!b) return;
      clearInterval(timer);
      show(Number(b.dataset.i));
      timer = setInterval(next, 6500);
    });

    document.getElementById("perkList").innerHTML = PERKS.map(function (p, i) {
      return '<div class="panel panel--dark reveal reveal-d' + (i + 1) + '" style="display:flex;gap:16px;align-items:flex-start;padding:20px">' +
               '<span style="width:38px;height:38px;border-radius:11px;background:rgba(47,128,255,.18);color:var(--blue-300);display:grid;place-items:center;flex-shrink:0">' + UI.icon(p.i, 19) + "</span>" +
               "<div><h4 class='h-sm' style='font-size:1.02rem'>" + p.t + "</h4>" +
               "<p style='color:#a9bbd8;font-size:.88rem;margin-top:5px'>" + p.d + "</p></div></div>";
    }).join("");
    UI.reveal();
  }

  /* ------------------------------------------------ run everything */
  document.addEventListener("DOMContentLoaded", function () {
    paintHero();
    paintMarquee();
    initQuickBook();
    paintFeatured();
    paintCategories();
    paintPopular();
    paintSteps();
    paintTestimonials();
    document.getElementById("arr1").innerHTML = UI.icon("arrowRight", 16);
    document.getElementById("arr2").innerHTML = UI.icon("arrowRight", 16);

    // count-up animation when the stats strip scrolls into view
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.querySelectorAll("[data-count]").forEach(UI.countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    io.observe(document.querySelector(".stats-strip"));
  });
})();

/* ==========================================================================
   VELOCE — admin.js : dashboard, car management, booking management
   --------------------------------------------------------------------------
   Only the seeded admin account (admin@veloce.com / admin123) can open it.
   Every change is written through Store.* so the customer pages see it too.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const STATUSES = ["pending", "confirmed", "active", "completed", "cancelled"];
  const STATUS_COLORS = { pending: "#ffbc3d", confirmed: "#2f80ff", active: "#16a06a", completed: "#94a6c4", cancelled: "#d93a4e" };
  const NAV = [
    { k: "overview",  label: "Overview",  icon: "chart" },
    { k: "cars",      label: "Cars",      icon: "car" },
    { k: "bookings",  label: "Bookings",  icon: "calendar" },
    { k: "customers", label: "Customers", icon: "users" },
    { k: "settings",  label: "Data",      icon: "key" }
  ];
  let panel = "overview";
  let carQuery = "";
  let bookingQuery = "";
  let bookingStatus = "all";

  /* ---------------------------------------------------------- guard */
  function locked() {
    $("guardRoot").innerHTML =
      '<div class="locked">' +
        '<div class="lock-ico">' + UI.icon("key", 32) + "</div>" +
        "<h2 class='h-md'>Admin access only</h2>" +
        "<p class='muted mt-2'>This dashboard is restricted. Sign in with the demo administrator account to manage cars and bookings.</p>" +
        '<div class="demo-creds mt-3" style="text-align:left">' +
          "<b class='upper tiny'>Demo administrator</b>" +
          "<span class='mono'>admin@veloce.com · admin123</span>" +
        "</div>" +
        '<div class="flex mt-3" style="justify-content:center">' +
          '<a class="btn" href="auth.html?next=admin.html">Sign in as admin</a>' +
          '<a class="btn btn--outline" href="index.html">Back to site</a>' +
        "</div>" +
      "</div>";
  }

  /* ------------------------------------------------------- navigation */
  function renderNav() {
    const s = Store.stats();
    const counts = { cars: s.totalCars, bookings: s.totalBookings, customers: s.customers };
    $("adminNav").innerHTML = NAV.map(function (n) {
      const c = counts[n.k];
      return '<button type="button" class="' + (panel === n.k ? "active" : "") + '" data-panel="' + n.k + '">' +
             UI.icon(n.icon, 17) + " " + n.label + (c !== undefined ? '<span class="nav-count">' + c + "</span>" : "") + "</button>";
    }).join("");
    $("adminNav").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { setPanel(b.dataset.panel); });
    });
  }

  function setPanel(k) {
    panel = k;
    renderNav();
    document.querySelectorAll(".admin-tabs-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === k));
    if (k === "overview") renderOverview();
    if (k === "cars") renderCars();
    if (k === "bookings") renderBookings();
    if (k === "customers") renderCustomers();
    if (k === "settings") renderSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* -------------------------------------------------------- OVERVIEW */
  function renderOverview() {
    const s = Store.stats();
    const kpis = [
      { i: "car", label: "Cars in fleet", value: UI.num(s.totalCars), trend: "+" + s.totalCars + " live", up: true },
      { i: "calendar", label: "Total bookings", value: UI.num(s.totalBookings), trend: s.upcoming + " upcoming", up: true },
      { i: "wallet", label: "Revenue booked", value: UI.money(s.revenue), trend: UI.money(s.avgTicket) + " avg", up: true },
      { i: "bolt", label: "On the road now", value: UI.num(s.activeNow), trend: s.statusCounts.cancelled + " cancelled", up: false }
    ];
    $("kpiGrid").innerHTML = kpis.map(function (k, i) {
      return '<div class="kpi reveal reveal-d' + (i + 1) + '">' +
        '<span class="kpi-trend ' + (k.up ? "trend-up" : "trend-down") + '">' + UI.esc(k.trend) + "</span>" +
        '<div class="kpi-ico">' + UI.icon(k.i, 20) + "</div>" +
        "<b>" + UI.esc(k.value) + "</b><span>" + UI.esc(k.label) + "</span></div>";
    }).join("");
    UI.reveal($("kpiGrid"));

    // --- revenue bars
    const max = Math.max.apply(null, s.months.map((m) => m.total).concat([1]));
    $("barChart").innerHTML = s.months.map(function (m) {
      return '<div class="bar-col"><div class="bar" data-value="' + UI.money(m.total) + '" style="height:0%"></div><span>' + m.label + "</span></div>";
    }).join("");
    // animate after paint
    requestAnimationFrame(function () {
      $("barChart").querySelectorAll(".bar").forEach(function (bar, i) {
        bar.style.height = Math.max(3, (s.months[i].total / max) * 100) + "%";
      });
    });
    $("revTotal").textContent = UI.money(s.revenue) + " total";

    // --- status donut
    const total = s.totalBookings || 1;
    let acc = 0;
    const segs = STATUSES.map(function (st) {
      const n = s.statusCounts[st] || 0;
      if (!n) return "";
      const from = (acc / total) * 360;
      acc += n;
      const to = (acc / total) * 360;
      return STATUS_COLORS[st] + " " + from.toFixed(2) + "deg " + to.toFixed(2) + "deg";
    }).filter(Boolean);
    $("donut").style.background = "conic-gradient(" + (segs.join(",") || "var(--paper-2) 0 100%") + ")";
    $("donutTotal").textContent = s.totalBookings;
    $("donutLegend").innerHTML = STATUSES.map(function (st) {
      return "<li><i style='background:" + STATUS_COLORS[st] + "'></i>" + st[0].toUpperCase() + st.slice(1) + "<b>" + (s.statusCounts[st] || 0) + "</b></li>";
    }).join("");

    // --- recent bookings
    const recent = Store.getBookings().slice(0, 6);
    $("recentTable").innerHTML = recent.length
      ? "<thead><tr><th>Ref</th><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead><tbody>" +
        recent.map(function (b) {
          return "<tr><td class='mono'>" + UI.esc(b.id) + "</td><td>" + UI.esc(b.userName) + "</td>" +
            "<td>" + UI.esc(b.carName) + "</td>" +
            "<td class='mono small'>" + UI.dateShort(b.pickupDate) + " → " + UI.dateShort(b.returnDate) + "</td>" +
            "<td><b>" + UI.money(b.total) + "</b></td><td>" + UI.statusPill(b.status) + "</td></tr>";
        }).join("") + "</tbody>"
      : "<tbody><tr><td style='padding:34px;text-align:center;color:var(--muted)'>No bookings yet.</td></tr></tbody>";

    // --- most rented
    $("topCars").innerHTML = s.topCars.length
      ? s.topCars.map(function (c, i) {
          const pct = Math.round((c.count / s.topCars[0].count) * 100);
          return "<div><div class='flex-between' style='margin-bottom:6px'><b style='font-size:.9rem'>" + (i + 1) + ". " + UI.esc(c.name) + "</b>" +
            "<span class='mono small muted'>" + c.count + "×</span></div>" +
            "<div style='height:7px;border-radius:6px;background:var(--paper-2);overflow:hidden'>" +
            "<div style='height:100%;width:" + pct + "%;background:linear-gradient(90deg,var(--blue-400),var(--blue-600));border-radius:6px'></div></div></div>";
        }).join("")
      : "<p class='hint'>No completed rentals yet.</p>";

    document.querySelectorAll(".ico-arr").forEach((e) => (e.innerHTML = UI.icon("arrowRight", 15)));
  }

  /* ------------------------------------------------------------ CARS */
  function renderCars() {
    const cars = Store.getCars();
    const q = carQuery.toLowerCase();
    const list = cars.filter((c) => !q || (c.name + " " + c.brand + " " + c.category).toLowerCase().includes(q));

    const rates = cars.map((c) => c.pricePerDay);
    $("carCount").textContent = cars.length
      ? list.length + " of " + cars.length + " cars · daily rate range " +
        UI.money(Math.min.apply(null, rates)) + " – " + UI.money(Math.max.apply(null, rates))
      : "The fleet is empty — add your first car.";
    $("carSearch").value = carQuery;

    if (!list.length) {
      $("carsTable").innerHTML = "<tbody><tr><td style='padding:44px;text-align:center;color:var(--muted)'>No car matches “" + UI.esc(carQuery) + "”.</td></tr></tbody>";
      return;
    }

    $("carsTable").innerHTML =
      "<thead><tr><th>Car</th><th>Category</th><th>Spec</th><th>Price / day</th><th>Rating</th><th>Flags</th><th style='text-align:right'>Actions</th></tr></thead><tbody>" +
      list.map(function (c) {
        return "<tr>" +
          "<td><div class='table-car'><img src='" + UI.esc(c.image) + "' alt=''><div><b>" + UI.esc(c.name) + "</b><span>" + UI.esc(c.brand) + " · " + c.year + "</span></div></div></td>" +
          "<td><span class='badge badge--blue'>" + UI.esc(c.category) + "</span></td>" +
          "<td class='small muted'>" + c.seats + " seats · " + UI.esc(c.transmission) + "<br>" + UI.esc(c.fuel) + " · " + c.luggage + " bags</td>" +
          "<td><b class='mono'>" + UI.money(c.pricePerDay) + "</b></td>" +
          "<td class='mono'>" + Number(c.rating).toFixed(1) + " <span class='muted'>(" + c.reviews + ")</span></td>" +
          "<td>" + (c.featured ? "<span class='badge badge--gold'>Featured</span> " : "") + (c.popular ? "<span class='badge'>Popular</span>" : "") + "</td>" +
          "<td><div class='table-actions'>" +
            "<button class='btn btn--outline btn--sm' data-edit='" + c.id + "'>" + UI.icon("edit", 15) + "</button>" +
            "<button class='btn btn--danger btn--sm' data-del='" + c.id + "'>" + UI.icon("trash", 15) + "</button>" +
          "</div></td></tr>";
      }).join("") + "</tbody>";

    $("carsTable").querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openCarForm(b.dataset.edit)));
    $("carsTable").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteCar(b.dataset.del)));
  }

  function carFormHtml(c) {
    const v = (x) => UI.esc(x === undefined || x === null ? "" : x);
    return '<div class="form-grid">' +
      '<div class="field"><label class="label">Car name *</label><input class="input" name="name" value="' + v(c.name) + '" placeholder="BMW M4 Competition"><span class="field-error">Required</span></div>' +
      '<div class="field"><label class="label">Brand *</label><input class="input" name="brand" value="' + v(c.brand) + '" list="brandList" placeholder="BMW"><span class="field-error">Required</span></div>' +
      '<datalist id="brandList">' + Store.getBrands().map((b) => '<option value="' + v(b) + '"></option>').join("") + "</datalist>" +
      '<div class="field"><label class="label">Category *</label><input class="input" name="category" value="' + v(c.category) + '" list="catList" placeholder="Sports"><span class="field-error">Required</span></div>' +
      '<datalist id="catList">' + Store.getCategories().map((b) => '<option value="' + v(b) + '"></option>').join("") + "</datalist>" +
      '<div class="field"><label class="label">Price per day (USD) *</label><input class="input" name="pricePerDay" type="number" min="1" step="1" value="' + v(c.pricePerDay) + '"><span class="field-error">Enter a positive number</span></div>' +
      '<div class="field"><label class="label">Seats</label><input class="input" name="seats" type="number" min="1" value="' + v(c.seats || 5) + '"></div>' +
      '<div class="field"><label class="label">Transmission</label><select class="select" name="transmission"><option' + (c.transmission === "Automatic" ? " selected" : "") + ">Automatic</option><option" + (c.transmission === "Manual" ? " selected" : "") + ">Manual</option></select></div>" +
      '<div class="field"><label class="label">Fuel</label><select class="select" name="fuel">' + ["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => "<option" + (c.fuel === f ? " selected" : "") + ">" + f + "</option>").join("") + "</select></div>" +
      '<div class="field"><label class="label">Model year</label><input class="input" name="year" type="number" min="1950" max="2035" value="' + v(c.year || new Date().getFullYear()) + '"></div>' +
      '<div class="field"><label class="label">Luggage (bags)</label><input class="input" name="luggage" type="number" min="0" value="' + v(c.luggage || 3) + '"></div>' +
      '<div class="field"><label class="label">Doors</label><input class="input" name="doors" type="number" min="2" value="' + v(c.doors || 4) + '"></div>' +
      '<div class="field"><label class="label">Rating (0–5)</label><input class="input" name="rating" type="number" min="0" max="5" step="0.1" value="' + v(c.rating || 4.5) + '"></div>' +
      '<div class="field"><label class="label">Number of reviews</label><input class="input" name="reviews" type="number" min="0" value="' + v(c.reviews || 0) + '"></div>' +
      '<div class="field span-2"><label class="label">Main image URL *</label><input class="input" name="image" value="' + v(c.image) + '" placeholder="https://…"><span class="field-error">An image URL is required</span><span class="hint">Paste any public .jpg/.png link — the preview updates as you type.</span></div>' +
      '<div class="field span-2"><img id="imgPreview" src="' + v(c.image || Store.PHOTOS.cityStreet) + '" alt="Preview" style="height:150px;width:100%;object-fit:cover;border-radius:12px;border:1px solid var(--line)"></div>' +
      '<div class="field span-2"><label class="label">Gallery URLs (comma separated)</label><input class="input" name="gallery" value="' + v((c.gallery || []).join(", ")) + '"></div>' +
      '<div class="field"><label class="label">Pick-up point</label><select class="select" name="pickup">' + UI.LOCATIONS.map((l) => "<option" + (c.pickup === l ? " selected" : "") + ">" + UI.esc(l) + "</option>").join("") + "</select></div>" +
      '<div class="field"><label class="label">Flags</label><div class="flex" style="gap:16px;padding-top:8px">' +
        '<label class="check"><input type="checkbox" name="featured"' + (c.featured ? " checked" : "") + '><span class="box"></span>Featured</label>' +
        '<label class="check"><input type="checkbox" name="popular"' + (c.popular ? " checked" : "") + '><span class="box"></span>Popular</label>' +
      "</div></div>" +
      '<div class="field span-2"><label class="label">Tagline</label><input class="input" name="tagline" value="' + v(c.tagline) + '" placeholder="One line that sells the car"></div>' +
      '<div class="field span-2"><label class="label">Description</label><textarea class="textarea" name="description" placeholder="A few sentences about the car">' + v(c.description) + "</textarea></div>" +
      '<div class="field span-2"><label class="label">Features (comma separated)</label><input class="input" name="features" value="' + v((c.features || []).join(", ")) + '"></div>' +
    "</div>";
  }

  function openCarForm(id) {
    const existing = id ? Store.getCar(id) : null;
    const blank = { transmission: "Automatic", fuel: "Petrol", seats: 5, luggage: 3, doors: 4, year: new Date().getFullYear(), rating: 4.6, reviews: 0, category: "Sedan", pickup: UI.LOCATIONS[0], features: [], gallery: [] };
    const c = existing || blank;

    UI.modal({
      wide: true,
      title: existing ? "Edit " + existing.name : "Add a new car",
      subtitle: existing ? "Changes appear instantly on the public pages." : "It will show up in the catalogue as soon as you save.",
      body: carFormHtml(c),
      footer: '<button class="btn btn--outline" data-x>Cancel</button><button class="btn" data-save>' + UI.icon("check", 16) + " Save car</button>",
      onMount: function (root, close) {
        const preview = root.querySelector("#imgPreview");
        root.querySelector('[name="image"]').addEventListener("input", function (e) {
          preview.src = e.target.value || Store.PHOTOS.cityStreet;
          preview.onerror = function () { preview.src = Store.PHOTOS.cityStreet; };
        });
        root.querySelector("[data-x]").addEventListener("click", close);
        root.querySelector("[data-save]").addEventListener("click", function () {
          const data = {};
          root.querySelectorAll("input, select, textarea").forEach(function (el) {
            if (!el.name) return;
            data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
          });

          // validation
          let ok = true;
          root.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
          function need(name, test) {
            if (test) return;
            const el = root.querySelector('[name="' + name + '"]');
            el.closest(".field").classList.add("has-error");
            ok = false;
          }
          need("name", data.name.length > 1);
          need("brand", data.brand.length > 0);
          need("category", data.category.length > 0);
          need("pricePerDay", Number(data.pricePerDay) > 0);
          need("image", data.image.length > 3);
          if (!ok) { UI.toast("Please fix the highlighted fields.", "error"); return; }

          const car = {
            id: existing ? existing.id : null,
            name: data.name, brand: data.brand, category: data.category,
            transmission: data.transmission, seats: Number(data.seats) || 5,
            fuel: data.fuel, year: Number(data.year) || new Date().getFullYear(),
            luggage: Number(data.luggage) || 0, doors: Number(data.doors) || 4,
            pricePerDay: Number(data.pricePerDay), rating: Number(data.rating) || 4.5,
            reviews: Number(data.reviews) || 0, featured: !!data.featured, popular: !!data.popular,
            image: data.image,
            gallery: data.gallery ? data.gallery.split(",").map((s) => s.trim()).filter(Boolean) : [data.image],
            tagline: data.tagline || "", description: data.description || "",
            features: data.features ? data.features.split(",").map((s) => s.trim()).filter(Boolean) : [],
            pickup: data.pickup, status: "available", createdAt: existing ? existing.createdAt : new Date().toISOString()
          };
          if (!car.gallery.length) car.gallery = [car.image];

          Store.saveCar(car);
          close();
          UI.toast(existing ? car.name + " updated." : car.name + " added to the fleet.", "success");
          refreshAll();
          setPanel("cars");
        });
      }
    });
  }

  async function deleteCar(id) {
    const car = Store.getCar(id);
    const linked = Store.getBookings().filter((b) => b.carId === id).length;
    const ok = await UI.confirm({
      title: "Delete " + car.name + "?",
      message: linked
        ? "This car is linked to " + linked + " existing " + UI.plural(linked, "booking") + ". Those bookings keep their saved details, but the car disappears from the catalogue."
        : "It will be removed from the catalogue immediately.",
      confirmText: "Delete car"
    });
    if (!ok) return;
    Store.deleteCar(id);
    UI.toast(car.name + " deleted.", "warn");
    refreshAll();
    setPanel("cars");
  }

  /* -------------------------------------------------------- BOOKINGS */
  function renderBookings() {
    const all = Store.getBookings();
    const q = bookingQuery.toLowerCase();
    const list = all.filter(function (b) {
      const matchQ = !q || (b.id + " " + b.userName + " " + b.userEmail + " " + b.carName).toLowerCase().includes(q);
      const matchS = bookingStatus === "all" || b.status === bookingStatus;
      return matchQ && matchS;
    });

    const revenue = all.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);
    $("bookingCount").textContent = list.length + " of " + all.length + " bookings · " + UI.money(revenue) + " booked revenue";
    $("bookingSearch").value = bookingQuery;
    $("bookingStatusFilter").value = bookingStatus;

    if (!list.length) {
      $("bookingsTable").innerHTML = "<tbody><tr><td style='padding:44px;text-align:center;color:var(--muted)'>No bookings match those filters.</td></tr></tbody>";
      return;
    }

    $("bookingsTable").innerHTML =
      "<thead><tr><th>Reference</th><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th><th style='text-align:right'>Actions</th></tr></thead><tbody>" +
      list.map(function (b) {
        return "<tr>" +
          "<td><b class='mono'>" + UI.esc(b.id) + "</b><br><span class='tiny muted'>phase: " + Store.bookingPhase(b) + "</span></td>" +
          "<td>" + UI.esc(b.userName) + "<br><span class='tiny muted'>" + UI.esc(b.userEmail) + "</span></td>" +
          "<td><div class='table-car'><img src='" + UI.esc(b.carImage) + "' alt=''><div><b>" + UI.esc(b.carName) + "</b><span>" + b.days + " " + UI.plural(b.days, "day") + " · " + UI.money(b.pricePerDay) + "/day</span></div></div></td>" +
          "<td class='small mono'>" + UI.dateShort(b.pickupDate) + " " + b.pickupTime + "<br>" + UI.dateShort(b.returnDate) + " " + b.returnTime + "</td>" +
          "<td><b class='mono'>" + UI.money(b.total) + "</b></td>" +
          "<td><select class='select' data-status='" + b.id + "' style='padding:8px 34px 8px 11px;font-size:.82rem;min-width:132px'>" +
            STATUSES.map((s) => "<option value='" + s + "'" + (b.status === s ? " selected" : "") + ">" + s[0].toUpperCase() + s.slice(1) + "</option>").join("") +
          "</select></td>" +
          "<td><div class='table-actions'>" +
            "<button class='btn btn--outline btn--sm' data-view='" + b.id + "'>" + UI.icon("info", 15) + "</button>" +
            "<button class='btn btn--danger btn--sm' data-del='" + b.id + "'>" + UI.icon("trash", 15) + "</button>" +
          "</div></td></tr>";
      }).join("") + "</tbody>";

    $("bookingsTable").querySelectorAll("[data-status]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        Store.updateBookingStatus(sel.dataset.status, sel.value);
        UI.toast(sel.dataset.status + " → " + sel.value, "success");
        refreshAll();
      });
    });
    $("bookingsTable").querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => viewBooking(b.dataset.view)));
    $("bookingsTable").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteBooking(b.dataset.del)));
  }

  function viewBooking(id) {
    const b = Store.getBooking(id);
    if (!b) return;
    const rows = [
      ["Reference", b.id], ["Status", b.status], ["Phase", Store.bookingPhase(b)],
      ["Car", b.carBrand + " " + b.carName], ["Category", b.carCategory || "—"],
      ["Pick-up", UI.dateLong(b.pickupDate) + " at " + b.pickupTime],
      ["Return", UI.dateLong(b.returnDate) + " at " + b.returnTime],
      ["Duration", b.days + " days"], ["Location", b.location],
      ["Customer", b.userName], ["Email", b.userEmail], ["Phone", b.userPhone || "—"], ["Licence", b.userLicense || "—"],
      ["Daily rate", UI.money(b.pricePerDay)], ["Subtotal", UI.money(b.subtotal)],
      ["Discount", b.discount ? "−" + UI.money(b.discount) + " (" + b.discountLabel + ")" : "None"],
      ["Insurance", b.insurance ? UI.money(b.insuranceCost) : "No"],
      ["Extra driver", b.extraDriver ? UI.money(b.extraDriverCost) : "No"],
      ["Delivery", b.delivery ? UI.money(b.deliveryCost) + (b.deliveryAddress ? " to " + b.deliveryAddress : "") : "No"],
      ["VAT", UI.money(b.tax, true)], ["Total", UI.money(b.total)],
      ["Created", UI.dateTime(b.createdAt)], ["Note", b.note || "—"]
    ];
    UI.modal({
      wide: true, title: "Booking " + b.id, subtitle: b.userName + " · " + b.carName,
      body: '<div class="table-wrap" style="border-radius:14px"><table class="data-table" style="min-width:0"><tbody>' +
        rows.map((r) => "<tr><td style='color:var(--muted);width:34%'>" + UI.esc(r[0]) + "</td><td><b>" + UI.esc(r[1]) + "</b></td></tr>").join("") +
        "</tbody></table></div>",
      footer: '<button class="btn btn--outline" data-x>Close</button>',
      onMount: function (root, close) { root.querySelector("[data-x]").addEventListener("click", close); }
    });
  }

  async function deleteBooking(id) {
    const ok = await UI.confirm({
      title: "Delete booking " + id + "?",
      message: "This permanently removes the record from localStorage. Prefer setting the status to <b>cancelled</b> if you want to keep the history.",
      confirmText: "Delete forever"
    });
    if (!ok) return;
    Store.deleteBooking(id);
    UI.toast("Booking deleted.", "warn");
    refreshAll();
    renderBookings();
  }

  /* ------------------------------------------------------- CUSTOMERS */
  function renderCustomers() {
    const users = Store.getUsers();
    const bookings = Store.getBookings();
    $("customersTable").innerHTML =
      "<thead><tr><th>Customer</th><th>Contact</th><th>Licence</th><th>Member since</th><th>Bookings</th><th>Spent</th><th>Role</th></tr></thead><tbody>" +
      users.map(function (u) {
        const mine = bookings.filter((b) => b.userId === u.id);
        const spent = mine.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);
        return "<tr>" +
          "<td><div class='flex' style='gap:11px'><span class='avatar'>" + UI.esc(UI.initials(u.name)) + "</span><div><b>" + UI.esc(u.name) + "</b><br><span class='tiny muted'>" + UI.esc(u.email) + "</span></div></div></td>" +
          "<td class='small'>" + UI.esc(u.phone || "—") + "</td>" +
          "<td class='mono small'>" + UI.esc(u.license || "—") + "</td>" +
          "<td class='small'>" + UI.date(u.joined) + "</td>" +
          "<td><b class='mono'>" + mine.length + "</b></td>" +
          "<td><b class='mono'>" + UI.money(spent) + "</b></td>" +
          "<td>" + (u.role === "admin" ? "<span class='badge badge--dark'>Admin</span>" : "<span class='badge badge--blue'>Customer</span>") + "</td></tr>";
      }).join("") + "</tbody>";
  }

  /* -------------------------------------------------------- SETTINGS */
  function renderSettings() {
    const size = (k) => {
      const raw = localStorage.getItem(k) || "";
      return (raw.length / 1024).toFixed(1) + " KB";
    };
    const rows = [
      ["veloce_cars_v1", Store.getCars().length + " cars", size("veloce_cars_v1")],
      ["veloce_users_v1", Store.getUsers().length + " accounts", size("veloce_users_v1")],
      ["veloce_bookings_v1", Store.getBookings().length + " bookings", size("veloce_bookings_v1")]
    ];
    $("storageInfo").innerHTML = rows.map(function (r) {
      return '<div class="flex-between" style="padding:13px 16px;border:1px solid var(--line);border-radius:12px;background:var(--paper)">' +
        "<span class='mono small'>" + r[0] + "</span><span class='small muted'>" + r[1] + "</span><b class='mono small'>" + r[2] + "</b></div>";
    }).join("");

    const p = Store.PRICING;
    $("pricingTable").innerHTML =
      "<thead><tr><th>Rule</th><th>Value</th><th>Where it is used</th></tr></thead><tbody>" +
      "<tr><td>VAT rate</td><td class='mono'>" + (p.taxRate * 100).toFixed(1) + "%</td><td class='small muted'>Added to every quote</td></tr>" +
      "<tr><td>Full-cover insurance</td><td class='mono'>" + UI.money(p.insurancePerDay) + "/day</td><td class='small muted'>Optional extra</td></tr>" +
      "<tr><td>Additional driver</td><td class='mono'>" + UI.money(p.extraDriverPerDay) + "/day</td><td class='small muted'>Optional extra</td></tr>" +
      "<tr><td>Delivery</td><td class='mono'>" + UI.money(p.deliveryFee) + "</td><td class='small muted'>One-off fee</td></tr>" +
      "<tr><td>Maximum rental</td><td class='mono'>" + p.maxDays + " days</td><td class='small muted'>Date validation</td></tr>" +
      Store.DISCOUNTS.map((d) => "<tr><td>" + d.label + "</td><td class='mono'>" + d.minDays + "+ days</td><td class='small muted'>Automatic</td></tr>").join("") +
      "</tbody>";

    document.querySelectorAll(".ico-reset").forEach((e) => (e.innerHTML = UI.icon("refresh", 16)));
  }

  /* ----------------------------------------------------- global bits */
  function refreshAll() { renderNav(); renderHeadActions(); }

  function renderHeadActions() {
    $("headActions").innerHTML =
      '<a class="btn btn--ghost btn--sm" href="index.html">' + UI.icon("arrowLeft", 15) + " View site</a>" +
      '<button class="btn btn--sm" id="headAddCar">' + UI.icon("plus", 15) + " Add car</button>";
    $("headAddCar").addEventListener("click", () => { setPanel("cars"); openCarForm(null); });
  }

  /* -------------------------------------------------------------- go */
  document.addEventListener("DOMContentLoaded", function () {
    if (!UI.requireAdmin()) { locked(); return; }

    const admin = Store.currentUser();
    $("adminRoot").classList.remove("hidden");
    $("adminAvatar").textContent = UI.initials(admin.name);
    $("adminName").textContent = admin.name;
    $("adminRole").textContent = "Administrator";

    document.querySelectorAll(".ico-search, .ico-search2").forEach((e) => (e.innerHTML = UI.icon("search", 16)));
    document.querySelectorAll(".ico-plus").forEach((e) => (e.innerHTML = UI.icon("plus", 16)));
    // quick link on the overview panel ("View all" -> bookings tab)
    document.querySelectorAll("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => setPanel(b.dataset.goto))
    );

    $("addCarBtn").addEventListener("click", () => openCarForm(null));
    $("carSearch").addEventListener("input", function (e) { carQuery = e.target.value.trim(); renderCars(); });
    $("bookingSearch").addEventListener("input", function (e) { bookingQuery = e.target.value.trim(); renderBookings(); });
    $("bookingStatusFilter").addEventListener("change", function (e) { bookingStatus = e.target.value; renderBookings(); });

    $("resetBtn").addEventListener("click", async function () {
      const ok = await UI.confirm({
        title: "Reset all demo data?",
        subtitle: "Cars, users, bookings and sessions",
        message: "Everything returns to the original sample data and you will be signed out.",
        confirmText: "Reset everything"
      });
      if (!ok) return;
      Store.resetDemoData();
      UI.toast("Demo data restored.", "success");
      setTimeout(() => (window.location.href = "index.html"), 800);
    });

    $("clearBookingsBtn").addEventListener("click", async function () {
      const ok = await UI.confirm({
        title: "Delete every booking?",
        message: "Cars and accounts stay, but all reservations are removed.",
        confirmText: "Delete bookings"
      });
      if (!ok) return;
      Store.getBookings().forEach((b) => Store.deleteBooking(b.id));
      UI.toast("All bookings deleted.", "warn");
      refreshAll(); setPanel("overview");
    });

    refreshAll();
    renderOverview();
  });
})();

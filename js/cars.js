// Car cards, home page extras, fleet filters and car detail page
const card = (c) => `<article class="card car">
  <img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.src=FALLBACK">
  <div class="b"><div class="t"><div><h3>${c.name}</h3><span class="tag">${c.cat}</span></div>
  <div class="price">${fmt(c.price)}<small>per day</small></div></div>
  <div class="tags"><span class="tag">${c.seats} seats</span><span class="tag">${c.trans}</span><span class="tag">${c.fuel}</span></div>
  <div class="act"><a class="btn line" href="car-details.html?id=${c.id}">Details</a><a class="btn primary" href="rent.html?car=${c.id}">Rent</a></div></div></article>`;

if ($("featured"))
  $("featured").innerHTML = CARS.slice(0, 3).map(card).join("");

if ($("qCar")) {
  $("qCar").innerHTML = CARS.map(
    (c) => `<option value="${c.id}">${c.name} — ${fmt(c.price)}/day</option>`,
  ).join("");
  $("qP").min = $("qR").min = today;
}

if ($("grid")) {
  const ids = ["q", "cat", "trans", "budget", "sort"];
  if (P.get("cat")) $("cat").value = P.get("cat");
  const run = () => {
    const q = $("q").value.toLowerCase().trim(),
      b = $("budget").value,
      s = $("sort").value;
    const list = CARS.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        ($("cat").value === "all" || c.cat === $("cat").value) &&
        ($("trans").value === "all" || c.trans === $("trans").value) &&
        (b === "all" || c.price <= +b),
    );
    if (s === "low") list.sort((a, b) => a.price - b.price);
    if (s === "high") list.sort((a, b) => b.price - a.price);
    $("grid").innerHTML = list.map(card).join("");
    $("count").textContent = list.length
      ? `Showing ${list.length} of ${CARS.length} vehicles`
      : "";
    $("empty").classList.toggle("hidden", list.length > 0);
  };
  ids.forEach((i) => {
    $(i).addEventListener("input", run);
    $(i).addEventListener("change", run);
  });
  $("reset").onclick = () => {
    ids.forEach(
      (i) => ($(i).value = i === "q" ? "" : i === "sort" ? "default" : "all"),
    );
    run();
  };
  run();
}

if ($("detail")) {
  const c = CARS.find((x) => x.id == P.get("id"));
  if (!c) {
    $("detail").innerHTML =
      `<div class="card"><h2>Car not found</h2><p>Pick a vehicle from the <a class="more" href="cars.html">full fleet</a>.</p></div>`;
  } else {
    document.title = `${c.name} | DriveEase`;
    $("crumbName").textContent = c.name;
    $("detail").innerHTML =
      `<img src="${c.img}" alt="${c.name}" onerror="this.src=FALLBACK">
    <div><span class="tag">${c.cat}</span><h2 style="margin:8px 0">${c.name}</h2><p class="lead">${c.desc}</p>
    <div class="specs"><div><small>Seats</small>${c.seats}</div><div><small>Transmission</small>${c.trans}</div>
    <div><small>Fuel</small>${c.fuel}</div><div><small>Luggage</small>${LUGGAGE[c.cat]}</div></div>
    <div class="card"><div class="price" style="font-size:1.6rem">${fmt(c.price)} <small style="display:inline">per day</small></div>
    <p style="margin:6px 0 16px">5% off for 3+ days, 10% off for 7+ days. Extras are added in the rental calculator.</p>
    <a class="btn primary" style="width:100%" href="rent.html?car=${c.id}">Request this car</a></div></div>`;
    $("feat").innerHTML = FEATURES[c.cat].map((f) => `<li>${f}</li>`).join("");
    $("related").innerHTML = CARS.filter(
      (x) => x.cat === c.cat && x.id !== c.id,
    )
      .slice(0, 3)
      .map(card)
      .join("");
  }
}

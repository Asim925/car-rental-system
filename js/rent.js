const EXTRAS = { driver: 1500, seat: 300, gps: 400, ins: 800 };
const opts = CARS.map(
  (c) => `<option value="${c.id}">${c.name} — ${fmt(c.price)}/day</option>`,
).join("");
["calcCar", "rentCar"].forEach((i) => {
  $(i).innerHTML = opts;
  if (P.get("car")) $(i).value = P.get("car");
});
[
  ["calcP", "rentP", "pickup"],
  ["calcR", "rentR", "return"],
].forEach((ids) =>
  ids.slice(0, 2).forEach((i) => {
    $(i).min = today;
    if (P.get(ids[2])) $(i).value = P.get(ids[2]);
  }),
);

function quote(carId, p, r) {
  if (!p || !r) return "Choose both a pickup and a return date.";
  const d = Math.round((new Date(r) - new Date(p)) / 864e5);
  if (d <= 0) return "The return date must be after the pickup date.";
  const c = CARS.find((x) => x.id == carId),
    base = c.price * d;
  const pct = d >= 7 ? 10 : d >= 3 ? 5 : 0,
    off = Math.round((base * pct) / 100);
  const ext =
    [...document.querySelectorAll(".ex:checked")].reduce(
      (s, e) => s + EXTRAS[e.value],
      0,
    ) * d;
  return { c, d, base, off, pct, ext, total: base - off + ext };
}

$("calc").onclick = () => {
  const q = quote($("calcCar").value, $("calcP").value, $("calcR").value);
  if (typeof q === "string") return toast(q);
  $("rows").innerHTML =
    `<div><span>${fmt(q.c.price)} × ${q.d} ${q.d > 1 ? "days" : "day"}</span><span>${fmt(q.base)}</span></div>` +
    (q.off
      ? `<div><span>Long-rental discount (${q.pct}%)</span><span>−${fmt(q.off)}</span></div>`
      : "") +
    (q.ext ? `<div><span>Extras</span><span>${fmt(q.ext)}</span></div>` : "") +
    `<div class="tot"><span>Estimated total</span><span>${fmt(q.total)}</span></div>`;
  $("res").classList.remove("hidden");
};

$("rentalForm").onsubmit = (e) => {
  e.preventDefault();
  const q = quote($("rentCar").value, $("rentP").value, $("rentR").value);
  if (typeof q === "string") return toast(q);
  toast(
    `Request sent for ${q.c.name}: ${q.d} days, about ${fmt(q.total)}. We'll call ${$("rentName").value} to confirm.`,
  );
  e.target.reset();
  $("res").classList.add("hidden");
};

function setCarPreview(selectId, imgId, nameId, priceId) {
  const selected = CARS.find((c) => String(c.id) === String($(selectId).value));
  const imgEl = $(imgId);
  const nameEl = $(nameId);
  const priceEl = $(priceId);

  if (!selected || !imgEl || !nameEl || !priceEl) return;

  imgEl.onerror = () => {
    imgEl.src = FALLBACK;
    imgEl.onerror = null;
  };
  imgEl.src = selected.img;
  imgEl.alt = `${selected.name} preview`;
  nameEl.textContent = selected.name;
  priceEl.textContent = `${fmt(selected.price)}/day`;
}

["calcCar", "rentCar"].forEach((id) => {
  $(id).addEventListener("change", () => {
    const previewMap = {
      calcCar: ["calcPreviewImg", "calcPreviewName", "calcPreviewPrice"],
      rentCar: ["rentPreviewImg", "rentPreviewName", "rentPreviewPrice"],
    };
    const [imgId, nameId, priceId] = previewMap[id];
    setCarPreview(id, imgId, nameId, priceId);
  });
});

["calcCar", "rentCar"].forEach((i) => {
  $(i).innerHTML = opts;
  if (P.get("car")) $(i).value = P.get("car");
  const previewMap = {
    calcCar: ["calcPreviewImg", "calcPreviewName", "calcPreviewPrice"],
    rentCar: ["rentPreviewImg", "rentPreviewName", "rentPreviewPrice"],
  };
  const [imgId, nameId, priceId] = previewMap[i];
  setCarPreview(i, imgId, nameId, priceId);
});

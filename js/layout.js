// Shared header, footer, toast and helpers
const $ = id => document.getElementById(id);
const fmt = n => "₨" + n.toLocaleString("en-US");
const P = new URLSearchParams(location.search);
const today = new Date().toISOString().split("T")[0];
const PAGES = [["index", "Home"], ["cars", "Cars"], ["rent", "Rent"], ["about", "About"], ["contact", "Contact"]];
const cur = document.body.dataset.page;

$("header").className = "top";
$("header").innerHTML = `<div class="wrap nav">
  <a class="logo" href="index.html"><i>D</i>DriveEase</a>
  <button class="burger" id="burger" aria-label="Toggle menu" aria-expanded="false">☰</button>
  <nav class="links" id="links">${PAGES.map(([p, l]) => `<a href="${p}.html"${p === cur ? ' class="on" aria-current="page"' : ""}>${l}</a>`).join("")}<a class="btn primary" href="rent.html">Book now</a></nav></div>`;
$("burger").onclick = () => {
  const open = $("links").classList.toggle("open");
  $("burger").setAttribute("aria-expanded", open);
};

$("footer").className = "ft";
$("footer").innerHTML = `<div class="wrap"><div class="grid">
  <div><h3>DriveEase</h3><p>Car rental made simple: compare vehicles, check the full price, and send one request.</p></div>
  <div><h3>Pages</h3>${PAGES.map(([p, l]) => `<a href="${p}.html">${l}</a>`).join("")}</div>
  <div><h3>Contact</h3><a href="mailto:support@driveease.pk">support@driveease.pk</a><a href="tel:+923001234567">+92 300 1234567</a><p>Karachi, Pakistan<br>Mon–Sun, 9 AM – 9 PM</p></div></div>
  <div class="copy">© 2026 DriveEase · Team: Waleed, Abdullah, Hammad, Asim · ICT academic project</div></div>`;

const toastEl = document.createElement("div");
toastEl.className = "toast";
toastEl.setAttribute("role", "status");
document.body.appendChild(toastEl);
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove("show"), 4000);
}

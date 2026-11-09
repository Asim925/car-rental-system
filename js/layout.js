var pageName = document.body.getAttribute("data-page");
var P = new URLSearchParams(window.location.search);
var today = new Date().toISOString().split("T")[0];
var navItems = [
  { file: "index.html", label: "Home" },
  { file: "cars.html", label: "Cars" },
  { file: "rent.html", label: "Rent" },
  { file: "about.html", label: "About" },
  { file: "contact.html", label: "Contact" },
];

function formatMoney(amount) {
  return "₨" + amount.toLocaleString("en-US");
}

function makeNavLink(item) {
  var isCurrent = item.file === pageName + ".html";
  var className = isCurrent ? ' class="on" aria-current="page"' : "";
  return '<a href="' + item.file + '"' + className + ">" + item.label + "</a>";
}

var headerWrap = document.getElementById("header");
headerWrap.className = "top";
headerWrap.innerHTML =
  '<div class="wrap nav">' +
  '<a class="logo" href="index.html"><i><img src="https://static.vecteezy.com/system/resources/previews/050/884/105/non_2x/rent-car-logo-flat-design-template-free-vector.jpg" /></i>DriveEase</a>' +
  '<button class="burger" id="burger" aria-label="Toggle menu" aria-expanded="false">☰</button>' +
  '<nav class="links" id="links">' +
  navItems.map(makeNavLink).join("") +
  '<a class="btn primary" href="rent.html">Book now</a>' +
  "</nav>" +
  "</div>";

var burgerButton = document.getElementById("burger");
var menu = document.getElementById("links");

burgerButton.onclick = function () {
  var isOpen = menu.classList.toggle("open");
  burgerButton.setAttribute("aria-expanded", isOpen);
};

var footerBox = document.getElementById("footer");
footerBox.className = "ft";
footerBox.innerHTML =
  '<div class="wrap">' +
  '<div class="grid">' +
  "<div><h3>DriveEase</h3><p>Car rental made simple: compare vehicles, check the full price, and send one request.</p></div>" +
  "<div><h3>Pages</h3>" +
  navItems
    .map(function (item) {
      return '<a href="' + item.file + '">' + item.label + "</a>";
    })
    .join("") +
  "</div>" +
  '<div><h3>Contact</h3><a href="mailto:support@driveease.pk">support@driveease.pk</a><a href="tel:+923001234567">+92 300 1234567</a><p>Karachi, Pakistan Mon–Sun, 9am to 9pm</p></div>' +
  "</div>" +
  '<div class="copy">© 2026 DriveEase · Team: Waleed, Abdullah, Hammad, Asim · ICT academic project</div>' +
  "</div>";

var toastWrap = document.createElement("div");
toastWrap.className = "toast";
toastWrap.setAttribute("role", "status");
document.body.appendChild(toastWrap);

function showToast(message) {
  toastWrap.textContent = message;
  toastWrap.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toastWrap.classList.remove("show");
  }, 4000);
}

window.formatMoney = formatMoney;
window.showToast = showToast;

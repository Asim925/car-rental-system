var EXTRAS = { driver: 1500, seat: 300, gps: 400, ins: 800 };

function getCarOptions() {
  return CARS.map(function (car) {
    return (
      '<option value="' +
      car.id +
      '">' +
      car.name +
      " — " +
      formatMoney(car.price) +
      "/day</option>"
    );
  }).join("");
}

var optionsHtml = getCarOptions();

["calcCar", "rentCar"].forEach(function (id) {
  document.getElementById(id).innerHTML = optionsHtml;

  if (P.get("car")) {
    document.getElementById(id).value = P.get("car");
  }
});

[
  ["calcP", "rentP", "pickup"],
  ["calcR", "rentR", "return"],
].forEach(function (pair) {
  var firstId = pair[0];
  var secondId = pair[1];
  var queryName = pair[2];

  document.getElementById(firstId).min = today;
  document.getElementById(secondId).min = today;

  if (P.get(queryName)) {
    document.getElementById(firstId).value = P.get(queryName);
    document.getElementById(secondId).value = P.get(queryName);
  }
});

function calculateQuote(carId, pickupDate, returnDate) {
  if (!pickupDate || !returnDate) {
    return "Choose both a pickup and a return date.";
  }

  var dayCount = Math.round(
    (new Date(returnDate) - new Date(pickupDate)) / 86400000,
  );

  if (dayCount <= 0) {
    return "The return date must be after the pickup date.";
  }

  var selectedCar = CARS.find(function (car) {
    return String(car.id) === String(carId);
  });

  var basePrice = selectedCar.price * dayCount;
  var discountPercent = dayCount >= 7 ? 10 : dayCount >= 3 ? 5 : 0;
  var discountAmount = Math.round((basePrice * discountPercent) / 100);

  var checkedExtras = document.querySelectorAll(".ex:checked");
  var extraCost = 0;

  checkedExtras.forEach(function (item) {
    extraCost += EXTRAS[item.value] * dayCount;
  });

  var totalPrice = basePrice - discountAmount + extraCost;

  return {
    car: selectedCar,
    days: dayCount,
    basePrice: basePrice,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    extraCost: extraCost,
    totalPrice: totalPrice,
  };
}

document.getElementById("calc").onclick = function () {
  var carId = document.getElementById("calcCar").value;
  var pickupDate = document.getElementById("calcP").value;
  var returnDate = document.getElementById("calcR").value;

  var result = calculateQuote(carId, pickupDate, returnDate);

  if (typeof result === "string") {
    return showToast(result);
  }

  var resultRows =
    "<div><span>" +
    formatMoney(result.car.price) +
    " × " +
    result.days +
    " " +
    (result.days > 1 ? "days" : "day") +
    "</span><span>" +
    formatMoney(result.basePrice) +
    "</span></div>";

  if (result.discountAmount) {
    resultRows +=
      "<div><span>Long-rental discount (" +
      result.discountPercent +
      "%)</span><span>−" +
      formatMoney(result.discountAmount) +
      "</span></div>";
  }

  if (result.extraCost) {
    resultRows +=
      "<div><span>Extras</span><span>" +
      formatMoney(result.extraCost) +
      "</span></div>";
  }

  resultRows +=
    '<div class="tot"><span>Estimated total</span><span>' +
    formatMoney(result.totalPrice) +
    "</span></div>";

  document.getElementById("rows").innerHTML = resultRows;
  document.getElementById("res").classList.remove("hidden");
};

document.getElementById("rentalForm").onsubmit = function (event) {
  event.preventDefault();

  var carId = document.getElementById("rentCar").value;
  var pickupDate = document.getElementById("rentP").value;
  var returnDate = document.getElementById("rentR").value;

  var result = calculateQuote(carId, pickupDate, returnDate);

  if (typeof result === "string") {
    return showToast(result);
  }

  var message =
    "Request sent for " +
    result.car.name +
    ": " +
    result.days +
    " days, about " +
    formatMoney(result.totalPrice) +
    ". We'll call " +
    document.getElementById("rentName").value +
    " to confirm.";
  showToast(message);

  event.target.reset();
  document.getElementById("res").classList.add("hidden");
};

function updatePreview(selectId, imageId, nameId, priceId) {
  var selectedCar = CARS.find(function (car) {
    return String(car.id) === String(document.getElementById(selectId).value);
  });

  if (!selectedCar) {
    return;
  }

  var imageElement = document.getElementById(imageId);
  var nameElement = document.getElementById(nameId);
  var priceElement = document.getElementById(priceId);

  imageElement.onerror = function () {
    imageElement.src = FALLBACK;
    imageElement.onerror = null;
  };

  imageElement.src = selectedCar.img;
  imageElement.alt = selectedCar.name + " preview";
  nameElement.textContent = selectedCar.name;
  priceElement.textContent = formatMoney(selectedCar.price) + "/day";
}

["calcCar", "rentCar"].forEach(function (id) {
  document.getElementById(id).addEventListener("change", function () {
    var previewMap = {
      calcCar: ["calcPreviewImg", "calcPreviewName", "calcPreviewPrice"],
      rentCar: ["rentPreviewImg", "rentPreviewName", "rentPreviewPrice"],
    };

    var imageId = previewMap[id][0];
    var nameId = previewMap[id][1];
    var priceId = previewMap[id][2];

    updatePreview(id, imageId, nameId, priceId);
  });
});

["calcCar", "rentCar"].forEach(function (id) {
  var previewMap = {
    calcCar: ["calcPreviewImg", "calcPreviewName", "calcPreviewPrice"],
    rentCar: ["rentPreviewImg", "rentPreviewName", "rentPreviewPrice"],
  };

  var imageId = previewMap[id][0];
  var nameId = previewMap[id][1];
  var priceId = previewMap[id][2];

  updatePreview(id, imageId, nameId, priceId);
});

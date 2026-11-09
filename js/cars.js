function buildCarCard(car) {
  return (
    '<article class="card car">' +
    '<img src="' +
    car.img +
    '" alt="' +
    car.name +
    '" loading="lazy" onerror="this.src=FALLBACK">' +
    '<div class="b">' +
    '<div class="t">' +
    "<div><h3>" +
    car.name +
    '</h3><span class="tag">' +
    car.cat +
    "</span></div>" +
    '<div class="price">' +
    formatMoney(car.price) +
    "<small>per day</small></div>" +
    "</div>" +
    '<div class="tags">' +
    '<span class="tag">' +
    car.seats +
    " seats</span>" +
    '<span class="tag">' +
    car.trans +
    "</span>" +
    '<span class="tag">' +
    car.fuel +
    "</span>" +
    "</div>" +
    '<div class="act">' +
    '<a class="btn line" href="car-details.html?id=' +
    car.id +
    '">Details</a>' +
    '<a class="btn primary" href="rent.html?car=' +
    car.id +
    '">Rent</a>' +
    "</div>" +
    "</div>" +
    "</article>"
  );
}

if (document.getElementById("featured")) {
  var featuredArea = document.getElementById("featured");
  var firstThreeCars = CARS.slice(0, 3);
  featuredArea.innerHTML = firstThreeCars.map(buildCarCard).join("");
}

if (document.getElementById("qCar")) {
  var quoteCar = document.getElementById("qCar");
  quoteCar.innerHTML = CARS.map(function (car) {
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

  document.getElementById("qP").min = today;
  document.getElementById("qR").min = today;
}

if (document.getElementById("grid")) {
  var ids = ["q", "cat", "trans", "budget", "sort"];

  if (P.get("cat")) {
    document.getElementById("cat").value = P.get("cat");
  }

  function runFilters() {
    var searchText = document.getElementById("q").value.toLowerCase().trim();
    var selectedBudget = document.getElementById("budget").value;
    var selectedSort = document.getElementById("sort").value;

    var filteredCars = CARS.filter(function (car) {
      var matchesSearch =
        !searchText || car.name.toLowerCase().includes(searchText);
      var matchesCategory =
        document.getElementById("cat").value === "all" ||
        car.cat === document.getElementById("cat").value;
      var matchesTrans =
        document.getElementById("trans").value === "all" ||
        car.trans === document.getElementById("trans").value;
      var matchesBudget =
        selectedBudget === "all" || car.price <= Number(selectedBudget);

      return matchesSearch && matchesCategory && matchesTrans && matchesBudget;
    });

    if (selectedSort === "low") {
      filteredCars.sort(function (a, b) {
        return a.price - b.price;
      });
    }

    if (selectedSort === "high") {
      filteredCars.sort(function (a, b) {
        return b.price - a.price;
      });
    }

    document.getElementById("grid").innerHTML = filteredCars
      .map(buildCarCard)
      .join("");

    if (filteredCars.length > 0) {
      document.getElementById("count").textContent =
        "Showing " + filteredCars.length + " of " + CARS.length + " vehicles";
      document.getElementById("empty").classList.add("hidden");
    } else {
      document.getElementById("count").textContent = "";
      document.getElementById("empty").classList.remove("hidden");
    }
  }

  ids.forEach(function (id) {
    document.getElementById(id).addEventListener("input", runFilters);
    document.getElementById(id).addEventListener("change", runFilters);
  });

  document.getElementById("reset").onclick = function () {
    ids.forEach(function (id) {
      if (id === "q") {
        document.getElementById(id).value = "";
      } else if (id === "sort") {
        document.getElementById(id).value = "default";
      } else {
        document.getElementById(id).value = "all";
      }
    });
    runFilters();
  };

  runFilters();
}

if (document.getElementById("detail")) {
  var carId = P.get("id");
  var selectedCar = CARS.find(function (car) {
    return String(car.id) === String(carId);
  });

  if (!selectedCar) {
    document.getElementById("detail").innerHTML =
      '<div class="card"><h2>Car not found</h2><p>Pick a vehicle from the <a class="more" href="cars.html">full fleet</a>.</p></div>';
  } else {
    document.title = selectedCar.name + " | DriveEase";
    document.getElementById("crumbName").textContent = selectedCar.name;

    document.getElementById("detail").innerHTML =
      '<img src="' +
      selectedCar.img +
      '" alt="' +
      selectedCar.name +
      '" onerror="this.src=FALLBACK">' +
      "<div>" +
      '<span class="tag">' +
      selectedCar.cat +
      "</span>" +
      '<h2 style="margin:8px 0">' +
      selectedCar.name +
      "</h2>" +
      '<p class="lead">' +
      selectedCar.desc +
      "</p>" +
      '<div class="specs">' +
      "<div><small>Seats</small>" +
      selectedCar.seats +
      "</div>" +
      "<div><small>Transmission</small>" +
      selectedCar.trans +
      "</div>" +
      "<div><small>Fuel</small>" +
      selectedCar.fuel +
      "</div>" +
      "<div><small>Luggage</small>" +
      LUGGAGE[selectedCar.cat] +
      "</div>" +
      "</div>" +
      '<div class="card">' +
      '<div class="price" style="font-size:1.6rem">' +
      formatMoney(selectedCar.price) +
      ' <small style="display:inline">per day</small></div>' +
      '<p style="margin:6px 0 16px">5% off for 3+ days, 10% off for 7+ days. Extras are added in the rental calculator.</p>' +
      '<a class="btn primary" style="width:100%" href="rent.html?car=' +
      selectedCar.id +
      '">Request this car</a>' +
      "</div>" +
      "</div>";

    var featureList = FEATURES[selectedCar.cat];
    document.getElementById("feat").innerHTML = featureList
      .map(function (item) {
        return "<li>" + item + "</li>";
      })
      .join("");

    var relatedCars = CARS.filter(function (car) {
      return car.cat === selectedCar.cat && car.id !== selectedCar.id;
    }).slice(0, 3);

    document.getElementById("related").innerHTML = relatedCars
      .map(buildCarCard)
      .join("");
  }
}

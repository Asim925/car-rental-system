/* ==========================================================================
   VELOCE — store.js
   --------------------------------------------------------------------------
   THE DATA LAYER. Every page talks to this file and nothing else when it
   needs to read or write data. All data lives in the browser's localStorage,
   so the website works with no backend and no database.

   Public API (used by the page scripts):
     Store.init()                 -> seeds sample data the first time
     Store.getCars() / getCar(id)
     Store.saveCar(car) / deleteCar(id)
     Store.getBrands() / getCategories()
     Store.login() / signup() / logout() / currentUser() / updateUser()
     Store.getBookings() / createBooking() / updateBookingStatus() / cancelBooking()
     Store.quote()                -> the rental price calculator (shared!)
     Store.isCarAvailable()       -> prevents double booking
     Store.stats()                -> numbers for the admin dashboard
     Store.resetDemoData()
   ========================================================================== */

const Store = (function () {
  "use strict";

  /* ---------- localStorage keys (one place = easy to change) ------------ */
  const KEYS = {
    cars: "veloce_cars_v1",
    users: "veloce_users_v1",
    bookings: "veloce_bookings_v1",
    session: "veloce_session_v1",
    draft: "veloce_rental_draft_v1",
    seeded: "veloce_seeded_v1"
  };

  /* ---------- Rental rules used by the price calculator ----------------- */
  const PRICING = {
    taxRate: 0.085,          // 8.5% VAT
    insurancePerDay: 19,     // optional full-cover protection
    extraDriverPerDay: 9,    // optional second driver
    deliveryFee: 29,         // optional "bring the car to me"
    maxDays: 60
  };

  /* Long-rental discounts: the more days, the cheaper each day. */
  const DISCOUNTS = [
    { minDays: 30, rate: 0.18, label: "Monthly discount (18%)" },
    { minDays: 14, rate: 0.12, label: "Two-week discount (12%)" },
    { minDays: 7,  rate: 0.08, label: "Weekly discount (8%)" }
  ];

  /* ---------------------------------------------------------------- helpers */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn("Store: could not read " + key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("Store: could not write " + key, err);
      return false;
    }
  }

  /* Date helpers — everything is stored as "YYYY-MM-DD" so that plain
     string comparison (< and >) works correctly for date ranges. */
  function toISO(date) {
    const d = date instanceof Date ? date : new Date(date);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  function todayISO() { return toISO(new Date()); }
  function addDays(iso, days) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return toISO(d);
  }
  function daysBetween(fromISO, toISO) {
    if (!fromISO || !toISO) return 0;
    const ms = new Date(toISO + "T00:00:00") - new Date(fromISO + "T00:00:00");
    return Math.round(ms / 86400000);
  }
  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function bookingId() {
    const a = Date.now().toString(36).slice(-4).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "VL-" + a + "-" + b;
  }

  /* ------------------------------------------------------- image shortcuts */
  const P = "https://images.pexels.com/photos/";
  const Q = "?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
  const img = (file) => P + file + Q;

  const PHOTOS = {
    porsche:   img("261985/pexels-photo-261985.jpeg"),
    bmwM4:     img("27968215/pexels-photo-27968215.jpeg"),
    amg:       img("11822720/pexels-photo-11822720.jpeg"),
    aston:     img("94272/sports-car-pkw-auto-vehicle-94272.jpeg"),
    lambo:     img("9545545/pexels-photo-9545545.jpeg"),
    genesis:   img("27766958/pexels-photo-27766958.jpeg"),
    kiaEv:     img("11808155/pexels-photo-11808155.jpeg"),
    rover:     img("37048035/pexels-photo-37048035.jpeg"),
    jeep:      img("15659880/pexels-photo-15659880.jpeg"),
    defender:  img("35353704/pexels-photo-35353704.jpeg"),
    evGarage:  img("28851165/pexels-photo-28851165.jpeg"),
    evCharge:  img("9800006/pexels-photo-9800006.jpeg"),
    evWhite:   img("3846205/pexels-photo-3846205.jpeg"),
    camry:     img("5735089/pexels-photo-5735089.jpeg"),
    bmwCity:   img("17601809/pexels-photo-17601809.jpeg"),
    elantra:   img("12206292/pexels-photo-12206292.jpeg"),
    suvMotion: img("108152/pexels-photo-108152.jpeg"),
    suvPark:   img("18231626/pexels-photo-18231626.jpeg"),
    suvSnow:   img("13464743/pexels-photo-13464743.jpeg"),
    cityStreet:img("35038748/pexels-photo-35038748.jpeg"),
    whiteLux:  img("34562593/pexels-photo-34562593.jpeg"),
    charger:   img("4678065/pexels-photo-4678065.jpeg"),
    highway:   img("15063041/pexels-photo-15063041.jpeg"),
    dirtRoad:  img("13543209/pexels-photo-13543209.jpeg")
  };

  /* ============================================================ SAMPLE DATA */
  /* 16 cars so the catalogue looks alive on the very first visit. */
  function sampleCars() {
    return [
      {
        id: "car_porsche911", name: "Porsche 911 Carrera S", brand: "Porsche", category: "Sports",
        transmission: "Automatic", seats: 4, fuel: "Petrol", year: 2024, luggage: 2, doors: 2,
        pricePerDay: 389, rating: 4.9, reviews: 214, featured: true, popular: true, status: "available",
        image: PHOTOS.porsche,
        gallery: [PHOTOS.porsche, PHOTOS.bmwM4, PHOTOS.amg],
        tagline: "The benchmark sports car — flat-six thunder, everyday usable.",
        description: "The 992-generation Carrera S is the answer when a weekend has to feel like an occasion. 443 hp from a twin-turbo flat-six, rear-wheel drive and the best steering feel in the business. Delivered detailed, with a full tank and a helmet net if you ask.",
        features: ["Sport Chrono package", "Adaptive sport seats", "Bose surround sound", "Launch control", "Carbon ceramic brakes", "Reverse camera"],
        pickup: "Downtown Hub · Terminal 1"
      },
      {
        id: "car_bmw_m4", name: "BMW M4 Competition", brand: "BMW", category: "Sports",
        transmission: "Automatic", seats: 4, fuel: "Petrol", year: 2024, luggage: 2, doors: 2,
        pricePerDay: 259, rating: 4.8, reviews: 168, featured: true, popular: true, status: "available",
        image: PHOTOS.bmwM4,
        gallery: [PHOTOS.bmwM4, PHOTOS.porsche, PHOTOS.bmwCity],
        tagline: "510 hp of straight-six, with the boot space for a weekend away.",
        description: "The M4 Competition takes the fight to the track and still behaves on the motorway. xDrive optional, M drive professional standard, and a sound you will keep looking for excuses to hear.",
        features: ["M Sport seats", "Head-up display", "Harman Kardon audio", "Adaptive M suspension", "Apple CarPlay", "Parking assistant"],
        pickup: "Downtown Hub · Terminal 1"
      },
      {
        id: "car_amg_gt", name: "Mercedes-AMG GT 63", brand: "Mercedes-Benz", category: "Luxury",
        transmission: "Automatic", seats: 4, fuel: "Petrol", year: 2024, luggage: 3, doors: 4,
        pricePerDay: 329, rating: 4.9, reviews: 96, featured: true, popular: false, status: "available",
        image: PHOTOS.amg,
        gallery: [PHOTOS.amg, PHOTOS.aston, PHOTOS.whiteLux],
        tagline: "Four-door grand touring, hand-built AMG V8, no compromises.",
        description: "A hand-assembled 4.0-litre V8 biturbo wrapped in a cabin that smells like a very expensive hotel. Perfect for arrivals where being seen matters as much as arriving.",
        features: ["AMG performance exhaust", "Burmester 3D sound", "Massage seats", "Air suspension", "Night package", "360° camera"],
        pickup: "Airport VIP Desk"
      },
      {
        id: "car_aston_vantage", name: "Aston Martin Vantage", brand: "Aston Martin", category: "Luxury",
        transmission: "Automatic", seats: 2, fuel: "Petrol", year: 2023, luggage: 2, doors: 2,
        pricePerDay: 355, rating: 4.8, reviews: 71, featured: false, popular: true, status: "available",
        image: PHOTOS.aston,
        gallery: [PHOTOS.aston, PHOTOS.porsche, PHOTOS.amg],
        tagline: "British GT, brutally handsome, endlessly quick.",
        description: "The Vantage is the smallest thing Aston makes and the most fun. 503 hp, a properly mechanical feel and one of the great exhaust notes. Book it for a coast road and you will not regret it.",
        features: ["Sport plus mode", "Premium leather", "Blind spot monitoring", "Keyless entry", "Sports exhaust", "Satellite navigation"],
        pickup: "Downtown Hub · Terminal 2"
      },
      {
        id: "car_miura", name: "Lamborghini Miura S", brand: "Lamborghini", category: "Classic",
        transmission: "Manual", seats: 2, fuel: "Petrol", year: 1971, luggage: 1, doors: 2,
        pricePerDay: 499, rating: 5.0, reviews: 34, featured: true, popular: false, status: "available",
        image: PHOTOS.lambo,
        gallery: [PHOTOS.lambo, PHOTOS.aston, PHOTOS.porsche],
        tagline: "The car that invented the supercar. Collector-grade, chauffeur optional.",
        description: "A fully restored Miura S from our heritage collection. Available for weddings, films and once-in-a-lifetime Sundays. Delivered on a covered trailer with a specialist briefing.",
        features: ["Concours restoration", "Original V12", "Heritage certificate", "Covered delivery", "Specialist handover", "Photo-ready detailing"],
        pickup: "Private delivery"
      },
      {
        id: "car_gv70", name: "Genesis GV70 Sport", brand: "Genesis", category: "SUV",
        transmission: "Automatic", seats: 5, fuel: "Petrol", year: 2024, luggage: 4, doors: 5,
        pricePerDay: 179, rating: 4.7, reviews: 122, featured: false, popular: true, status: "available",
        image: PHOTOS.genesis,
        gallery: [PHOTOS.genesis, PHOTOS.suvPark, PHOTOS.rover],
        tagline: "Luxury SUV manners at a price that makes sense.",
        description: "Quiet, beautifully built and packed with technology, the GV70 Sport is the smart choice for families who still want a car that looks like it costs twice as much.",
        features: ["Lexicon audio", "Heated & ventilated seats", "Highway driving assist", "Panoramic roof", "Wireless charging", "Powered tailgate"],
        pickup: "Downtown Hub · Terminal 1"
      },
      {
        id: "car_kia_ev9", name: "Kia EV9 GT-Line", brand: "Kia", category: "Electric",
        transmission: "Automatic", seats: 7, fuel: "Electric", year: 2024, luggage: 5, doors: 5,
        pricePerDay: 165, rating: 4.6, reviews: 88, featured: true, popular: false, status: "available",
        image: PHOTOS.kiaEv,
        gallery: [PHOTOS.kiaEv, PHOTOS.evGarage, PHOTOS.evCharge],
        tagline: "Seven full-size seats, 800-volt charging, zero emissions.",
        description: "The EV9 is the electric family hauler that finally works: three proper rows, 505 km of range and a 10–80% charge in around 24 minutes on a fast charger.",
        features: ["800V ultra-fast charging", "Three-row seating", "Vehicle-to-load power", "Meridian sound", "Highway driving pilot", "Heat pump"],
        pickup: "Airport Green Bay"
      },
      {
        id: "car_rr_sport", name: "Range Rover Sport", brand: "Land Rover", category: "SUV",
        transmission: "Automatic", seats: 5, fuel: "Diesel", year: 2024, luggage: 4, doors: 5,
        pricePerDay: 245, rating: 4.8, reviews: 143, featured: true, popular: true, status: "available",
        image: PHOTOS.rover,
        gallery: [PHOTOS.rover, PHOTOS.defender, PHOTOS.suvPark],
        tagline: "Commanding presence, air suspension, genuinely capable off-road.",
        description: "The Range Rover Sport does the school run, the ski run and the black-tie run equally well. Air suspension, a cabin wrapped in leather and a boot that swallows everything.",
        features: ["Electronic air suspension", "Meridian signature sound", "Terrain response 2", "Heads-up display", "Cabin air purification", "Tow bar"],
        pickup: "Airport VIP Desk"
      },
      {
        id: "car_wrangler", name: "Jeep Wrangler Rubicon", brand: "Jeep", category: "SUV",
        transmission: "Automatic", seats: 5, fuel: "Petrol", year: 2023, luggage: 3, doors: 4,
        pricePerDay: 139, rating: 4.7, reviews: 205, featured: false, popular: true, status: "available",
        image: PHOTOS.jeep,
        gallery: [PHOTOS.jeep, PHOTOS.dirtRoad, PHOTOS.defender],
        tagline: "Roof off, locks on. The only rental that wants to get dirty.",
        description: "A Rubicon with front and rear lockers, a removable roof and all-terrain tyres already fitted. Take it to the mountains, the beach or the desert — it comes back washed, no judgement.",
        features: ["Removable roof panels", "Front & rear lockers", "All-terrain tyres", "Rock rails", "Off-road cameras", "Roof box available"],
        pickup: "North Yard · Off-road desk"
      },
      {
        id: "car_defender", name: "Land Rover Defender 110", brand: "Land Rover", category: "SUV",
        transmission: "Automatic", seats: 5, fuel: "Diesel", year: 2024, luggage: 5, doors: 5,
        pricePerDay: 215, rating: 4.8, reviews: 118, featured: false, popular: false, status: "available",
        image: PHOTOS.defender,
        gallery: [PHOTOS.defender, PHOTOS.suvSnow, PHOTOS.dirtRoad],
        tagline: "Indestructible, comfortable, and utterly unbothered by weather.",
        description: "The modern Defender is the expedition vehicle of choice. 900 mm wading depth, a washout interior and enough space for four people plus a week of kit.",
        features: ["Wade sensing", "Configurable terrain response", "Washout rubber floor", "Roof rack ready", "Air suspension", "Meridian sound"],
        pickup: "North Yard · Off-road desk"
      },
      {
        id: "car_model_s", name: "Tesla Model S Plaid", brand: "Tesla", category: "Electric",
        transmission: "Automatic", seats: 5, fuel: "Electric", year: 2024, luggage: 4, doors: 4,
        pricePerDay: 199, rating: 4.9, reviews: 251, featured: true, popular: true, status: "available",
        image: PHOTOS.evGarage,
        gallery: [PHOTOS.evGarage, PHOTOS.evCharge, PHOTOS.kiaEv],
        tagline: "1,020 hp. 0–100 in 2.1 s. A screen the size of a laptop.",
        description: "Plaid is the fastest production saloon ever made and, quietly, one of the most comfortable ways to cover long distances. Supercharging included on all rentals of three days or more.",
        features: ["Autopilot included", "Supercharging credit", "Glass roof", "22-speaker audio", "Heated everything", "Yoke or round wheel"],
        pickup: "Airport Green Bay"
      },
      {
        id: "car_etron_gt", name: "Audi e-tron GT quattro", brand: "Audi", category: "Electric",
        transmission: "Automatic", seats: 4, fuel: "Electric", year: 2023, luggage: 2, doors: 4,
        pricePerDay: 209, rating: 4.7, reviews: 94, featured: false, popular: false, status: "available",
        image: PHOTOS.evCharge,
        gallery: [PHOTOS.evCharge, PHOTOS.evWhite, PHOTOS.kiaEv],
        tagline: "The best-looking electric GT on the road right now.",
        description: "Built on the same platform as the Taycan but far easier on the eye. 476 hp, 800-volt architecture and a cabin that Audi fans will feel at home in immediately.",
        features: ["Matrix LED headlights", "Bang & Olufsen 3D", "Air suspension", "800V fast charging", "Virtual cockpit plus", "Massage front seats"],
        pickup: "Downtown Hub · Terminal 2"
      },
      {
        id: "car_id4", name: "Volkswagen ID.4 Pro", brand: "Volkswagen", category: "Electric",
        transmission: "Automatic", seats: 5, fuel: "Electric", year: 2023, luggage: 4, doors: 5,
        pricePerDay: 109, rating: 4.5, reviews: 176, featured: false, popular: false, status: "available",
        image: PHOTOS.highway,
        gallery: [PHOTOS.highway, PHOTOS.evWhite, PHOTOS.charger],
        tagline: "Easy, quiet, cheap to run — the sensible electric crossover.",
        description: "The ID.4 is the car we recommend for a first electric rental. Big boot, high seating position, 520 km of real range and charging that is genuinely simple.",
        features: ["520 km range", "Heat pump", "Travel assist", "Heated steering wheel", "Fast charge 135 kW", "Isofix x3"],
        pickup: "Airport Green Bay"
      },
      {
        id: "car_camry", name: "Toyota Camry Hybrid", brand: "Toyota", category: "Sedan",
        transmission: "Automatic", seats: 5, fuel: "Hybrid", year: 2024, luggage: 4, doors: 4,
        pricePerDay: 79, rating: 4.6, reviews: 312, featured: false, popular: true, status: "available",
        image: PHOTOS.camry,
        gallery: [PHOTOS.camry, PHOTOS.bmwCity, PHOTOS.elantra],
        tagline: "The 4.5 l/100km business trip. Boring in the best way.",
        description: "Unbeatable on fuel, huge on comfort and impossible to break. The default choice for long motorway weeks, airport transfers and anyone who just wants the trip to be easy.",
        features: ["Hybrid — 4.5 l/100km", "Toyota Safety Sense", "Wireless CarPlay", "Dual-zone climate", "Rear sunshade", "Cruise control"],
        pickup: "Downtown Hub · Terminal 1"
      },
      {
        id: "car_bmw530", name: "BMW 530i M Sport", brand: "BMW", category: "Sedan",
        transmission: "Automatic", seats: 5, fuel: "Petrol", year: 2024, luggage: 4, doors: 4,
        pricePerDay: 145, rating: 4.8, reviews: 159, featured: false, popular: false, status: "available",
        image: PHOTOS.bmwCity,
        gallery: [PHOTOS.bmwCity, PHOTOS.whiteLux, PHOTOS.camry],
        tagline: "The executive default, and still the one to beat.",
        description: "The G60 5 Series is quieter, larger and far more digital than before. M Sport looks, superb seats and a plug-in-friendly drivetrain make it the best all-round business rental we have.",
        features: ["Curved display", "Driving assistant pro", "Comfort access", "Harman Kardon", "Adaptive LED", "Lumbar support"],
        pickup: "Airport VIP Desk"
      },
      {
        id: "car_elantra", name: "Hyundai Elantra N-Line", brand: "Hyundai", category: "Compact",
        transmission: "Automatic", seats: 5, fuel: "Petrol", year: 2023, luggage: 3, doors: 4,
        pricePerDay: 59, rating: 4.4, reviews: 268, featured: false, popular: false, status: "available",
        image: PHOTOS.elantra,
        gallery: [PHOTOS.elantra, PHOTOS.camry, PHOTOS.cityStreet],
        tagline: "Cheap, sharp-looking and genuinely fun around town.",
        description: "Our best-value car. N-Line styling, a punchy turbo engine and every safety feature you would expect from something twice the price. Ideal for city weeks and first rentals.",
        features: ["Turbocharged engine", "SmartSense safety", "Wireless CarPlay", "Sport seats", "Alloy wheels", "Rear camera"],
        pickup: "Downtown Hub · Terminal 2"
      }
    ];
  }

  /* Sample users. NOTE: passwords are stored in plain text because this is a
     front-end-only demonstration — a real app must hash them on a server. */
  function sampleUsers() {
    return [
      { id: "usr_admin", name: "Nadia Rahmani", email: "admin@veloce.com", password: "admin123",
        phone: "+1 555 0100", license: "ADM-99213", role: "admin", joined: addDays(todayISO(), -420) },
      { id: "usr_demo", name: "Sara Malik", email: "demo@veloce.com", password: "demo123",
        phone: "+1 555 0142", license: "D-4471902", role: "customer", joined: addDays(todayISO(), -160) },
      { id: "usr_omar", name: "Omar Haddad", email: "omar@mail.com", password: "omar123",
        phone: "+1 555 0177", license: "D-8830145", role: "customer", joined: addDays(todayISO(), -90) },
      { id: "usr_lina", name: "Lina Carter", email: "lina@mail.com", password: "lina123",
        phone: "+1 555 0198", license: "D-2219087", role: "customer", joined: addDays(todayISO(), -45) }
    ];
  }

  /* Sample bookings — dates are relative to today so the statuses always
     make sense whenever the demo is seeded. */
  function sampleBookings(cars, users) {
    const byId = (id) => cars.find((c) => c.id === id);
    const find = (email) => users.find((u) => u.email === email);
    const t = todayISO();

    const rows = [
      { car: "car_porsche911",  user: "demo@veloce.com", from: -26, to: -22, status: "completed", insurance: true,  delivery: false },
      { car: "car_rr_sport",    user: "demo@veloce.com", from: 3,   to: 8,   status: "confirmed", insurance: true,  delivery: true },
      { car: "car_model_s",     user: "omar@mail.com",   from: -2,  to: 4,   status: "active",    insurance: false, delivery: false },
      { car: "car_wrangler",    user: "lina@mail.com",   from: 9,   to: 14,  status: "pending",   insurance: true,  delivery: false },
      { car: "car_bmw_m4",      user: "omar@mail.com",   from: -48, to: -44, status: "completed", insurance: false, delivery: false },
      { car: "car_camry",       user: "lina@mail.com",   from: -12, to: -9,  status: "cancelled", insurance: false, delivery: true }
    ];

    return rows.map(function (r, i) {
      const car = byId(r.car);
      const user = find(r.user);
      const pickup = addDays(t, r.from);
      const ret = addDays(t, r.to);
      const days = daysBetween(pickup, ret);
      const q = quote({ pricePerDay: car.pricePerDay, days: days, insurance: r.insurance, extraDriver: false, delivery: r.delivery });
      return {
        id: "VL-DEMO" + (1001 + i),
        carId: car.id, carName: car.name, carBrand: car.brand, carImage: car.image, carCategory: car.category,
        userId: user.id, userName: user.name, userEmail: user.email, userPhone: user.phone, userLicense: user.license,
        pickupDate: pickup, returnDate: ret, pickupTime: "10:00", returnTime: "10:00",
        location: car.pickup, days: days, pricePerDay: car.pricePerDay,
        insurance: r.insurance, extraDriver: r.extraDriver, delivery: r.delivery,
        subtotal: q.subtotal, discount: q.discount, discountLabel: q.discountLabel,
        insuranceCost: q.insuranceCost, extraDriverCost: q.extraDriverCost,
        deliveryCost: q.deliveryCost, tax: q.tax, total: q.total,
        status: r.status, createdAt: new Date(addDays(t, r.from - 4) + "T09:24:00").toISOString(),
        note: ""
      };
    });
  }

  /* ===================================================== PRICE CALCULATOR */
  /* One single function used by the car page AND the booking page so the
     numbers can never disagree. Returns every line item it calculated. */
  function quote(opts) {
    const days = Math.max(0, Number(opts.days) || 0);
    const pricePerDay = Number(opts.pricePerDay) || 0;
    const subtotal = days * pricePerDay;

    let discountRate = 0;
    let discountLabel = "";
    for (const d of DISCOUNTS) {
      if (days >= d.minDays) { discountRate = d.rate; discountLabel = d.label; break; }
    }
    const discount = Math.round(subtotal * discountRate * 100) / 100;
    const insuranceCost = opts.insurance ? days * PRICING.insurancePerDay : 0;
    const extraDriverCost = opts.extraDriver ? days * PRICING.extraDriverPerDay : 0;
    const deliveryCost = opts.delivery ? PRICING.deliveryFee : 0;
    const net = subtotal - discount + insuranceCost + extraDriverCost + deliveryCost;
    const tax = Math.round(net * PRICING.taxRate * 100) / 100;
    const total = Math.round((net + tax) * 100) / 100;

    return {
      days, pricePerDay, subtotal: round2(subtotal), discount: round2(discount), discountLabel,
      discountRate, insuranceCost: round2(insuranceCost), extraDriverCost: round2(extraDriverCost),
      deliveryCost: round2(deliveryCost), tax, total, effectivePerDay: days ? round2(total / days) : 0
    };
  }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  /* ================================================================ CARS */
  function getCars() { return read(KEYS.cars, []); }

  function getCar(id) { return getCars().find((c) => c.id === id) || null; }

  function saveCar(car) {
    const cars = getCars();
    if (car.id && cars.some((c) => c.id === car.id)) {
      const i = cars.findIndex((c) => c.id === car.id);
      cars[i] = Object.assign({}, cars[i], car);
    } else {
      if (!car.id) car.id = uid("car");
      car.createdAt = new Date().toISOString();
      cars.unshift(car);
    }
    write(KEYS.cars, cars);
    return car;
  }

  function deleteCar(id) {
    write(KEYS.cars, getCars().filter((c) => c.id !== id));
  }

  function getBrands() {
    return Array.from(new Set(getCars().map((c) => c.brand))).sort();
  }
  function getCategories() {
    return Array.from(new Set(getCars().map((c) => c.category))).sort();
  }

  /* ============================================================== USERS */
  function getUsers() { return read(KEYS.users, []); }

  function findUserByEmail(email) {
    const e = String(email || "").trim().toLowerCase();
    return getUsers().find((u) => u.email.toLowerCase() === e) || null;
  }

  function signup(data) {
    if (findUserByEmail(data.email)) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const user = {
      id: uid("usr"),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phone: (data.phone || "").trim(),
      license: (data.license || "").trim(),
      role: "customer",
      joined: todayISO()
    };
    const users = getUsers();
    users.push(user);
    write(KEYS.users, users);
    setSession(user.id);
    return { ok: true, user: user };
  }

  function login(email, password) {
    const user = findUserByEmail(email);
    if (!user) return { ok: false, error: "No account found with that email address." };
    if (user.password !== password) return { ok: false, error: "Incorrect password. Please try again." };
    setSession(user.id);
    return { ok: true, user: user };
  }

  function setSession(userId) { write(KEYS.session, { userId: userId, at: new Date().toISOString() }); }

  function currentUser() {
    const s = read(KEYS.session, null);
    if (!s || !s.userId) return null;
    return getUsers().find((u) => u.id === s.userId) || null;
  }

  function isAdmin() {
    const u = currentUser();
    return !!(u && u.role === "admin");
  }

  function updateUser(id, patch) {
    const users = getUsers();
    const i = users.findIndex((u) => u.id === id);
    if (i === -1) return null;
    users[i] = Object.assign({}, users[i], patch);
    write(KEYS.users, users);
    return users[i];
  }

  function logout() { localStorage.removeItem(KEYS.session); }

  /* ============================================================ BOOKINGS */
  function getBookings() {
    return read(KEYS.bookings, []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function getBooking(id) { return getBookings().find((b) => b.id === id) || null; }

  function getUserBookings(userId) { return getBookings().filter((b) => b.userId === userId); }

  /* Two bookings clash when the ranges overlap. Cancelled / completed ones
     no longer hold the car. */
  function isCarAvailable(carId, pickupDate, returnDate, ignoreBookingId) {
    const blocking = ["confirmed", "pending", "active"];
    return !getBookings().some(function (b) {
      if (b.carId !== carId) return false;
      if (ignoreBookingId && b.id === ignoreBookingId) return false;
      if (blocking.indexOf(b.status) === -1) return false;
      return pickupDate < b.returnDate && returnDate > b.pickupDate;
    });
  }

  /* Returns a list of dates that are already taken for one car (calendar hint). */
  function bookedRanges(carId) {
    return getBookings()
      .filter((b) => b.carId === carId && ["confirmed", "pending", "active"].indexOf(b.status) > -1)
      .map((b) => ({ from: b.pickupDate, to: b.returnDate }));
  }

  function createBooking(data) {
    const booking = Object.assign({}, data, {
      id: bookingId(),
      status: data.status || "confirmed",
      createdAt: new Date().toISOString()
    });
    const all = read(KEYS.bookings, []);
    all.push(booking);
    write(KEYS.bookings, all);
    return booking;
  }

  function updateBooking(id, patch) {
    const all = read(KEYS.bookings, []);
    const i = all.findIndex((b) => b.id === id);
    if (i === -1) return null;
    all[i] = Object.assign({}, all[i], patch);
    write(KEYS.bookings, all);
    return all[i];
  }

  function updateBookingStatus(id, status) { return updateBooking(id, { status: status }); }

  function cancelBooking(id) { return updateBooking(id, { status: "cancelled", cancelledAt: new Date().toISOString() }); }

  function deleteBooking(id) {
    write(KEYS.bookings, read(KEYS.bookings, []).filter((b) => b.id !== id));
  }

  /* Classify a booking as upcoming / active / past for the customer view. */
  function bookingPhase(b) {
    if (b.status === "cancelled") return "cancelled";
    if (b.status === "completed") return "completed";
    const t = todayISO();
    if (b.returnDate < t) return "completed";
    if (b.pickupDate <= t && b.returnDate >= t) return "active";
    return "upcoming";
  }

  /* =============================================================== STATS */
  function stats() {
    const cars = getCars();
    const bookings = getBookings();
    const users = getUsers().filter((u) => u.role !== "admin");
    const money = bookings.filter((b) => b.status !== "cancelled");
    const revenue = money.reduce((sum, b) => sum + (b.total || 0), 0);

    const statusCounts = { confirmed: 0, pending: 0, active: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => { if (statusCounts[b.status] !== undefined) statusCounts[b.status]++; });

    // revenue for the last 6 months (based on the pickup month)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // build the "YYYY-MM" key from LOCAL parts so it always matches booking.pickupDate
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      months.push({ key: key, label: d.toLocaleString("en", { month: "short" }), total: 0, count: 0 });
    }
    money.forEach(function (b) {
      const key = (b.pickupDate || "").slice(0, 7);
      const m = months.find((x) => x.key === key);
      if (m) { m.total += b.total || 0; m.count++; }
    });

    // most rented cars
    const counts = {};
    money.forEach((b) => { counts[b.carName] = (counts[b.carName] || 0) + 1; });
    const topCars = Object.keys(counts).map((k) => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      totalCars: cars.length,
      totalBookings: bookings.length,
      customers: users.length,
      revenue: revenue,
      avgTicket: money.length ? revenue / money.length : 0,
      activeNow: bookings.filter((b) => bookingPhase(b) === "active").length,
      upcoming: bookings.filter((b) => bookingPhase(b) === "upcoming").length,
      statusCounts: statusCounts,
      months: months,
      topCars: topCars,
      fleetValue: cars.reduce((s, c) => s + (c.pricePerDay || 0), 0)
    };
  }

  /* ======================================================== RENTAL DRAFT */
  /* Remembers the dates chosen on the home / browse pages so the booking
     form can be pre-filled. */
  function getDraft() { return read(KEYS.draft, null); }
  function setDraft(draft) { write(KEYS.draft, draft); }
  function clearDraft() { localStorage.removeItem(KEYS.draft); }

  /* ============================================================ SEEDING */
  function seed(force) {
    if (!force && read(KEYS.seeded, false)) return;
    const cars = sampleCars();
    const users = sampleUsers();
    write(KEYS.cars, cars);
    write(KEYS.users, users);
    write(KEYS.bookings, sampleBookings(cars, users));
    write(KEYS.seeded, true);
  }

  function init() { seed(false); }

  function resetDemoData() {
    [KEYS.cars, KEYS.users, KEYS.bookings, KEYS.session, KEYS.draft, KEYS.seeded]
      .forEach((k) => localStorage.removeItem(k));
    seed(true);
  }

  /* ------------------------------------------------------- public object */
  return {
    PRICING: PRICING, DISCOUNTS: DISCOUNTS, PHOTOS: PHOTOS,
    init: init, seed: seed, resetDemoData: resetDemoData,
    toISO: toISO, todayISO: todayISO, addDays: addDays, daysBetween: daysBetween,
    uid: uid, bookingId: bookingId, quote: quote, round2: round2,
    getCars: getCars, getCar: getCar, saveCar: saveCar, deleteCar: deleteCar,
    getBrands: getBrands, getCategories: getCategories,
    getUsers: getUsers, signup: signup, login: login, logout: logout,
    currentUser: currentUser, isAdmin: isAdmin, updateUser: updateUser, findUserByEmail: findUserByEmail,
    getBookings: getBookings, getBooking: getBooking, getUserBookings: getUserBookings,
    createBooking: createBooking, updateBooking: updateBooking,
    updateBookingStatus: updateBookingStatus, cancelBooking: cancelBooking, deleteBooking: deleteBooking,
    isCarAvailable: isCarAvailable, bookedRanges: bookedRanges, bookingPhase: bookingPhase,
    stats: stats, getDraft: getDraft, setDraft: setDraft, clearDraft: clearDraft
  };
})();

/* Seed the sample data as soon as this file loads, before any page script runs. */
Store.init();

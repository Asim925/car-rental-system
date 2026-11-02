# VELOCE — Premium Car Rental (HTML · CSS · JavaScript only)

A complete, working **front-end** car rental website. No React, no Bootstrap, no Tailwind,
no backend, no database — just HTML5, CSS3 and vanilla JavaScript, with **localStorage**
used as the "database" so everything survives a page reload.

---

## 1. Running the website locally

**Option A — open the file (fastest)**
Double-click `index.html`. The site works straight from the file system.

**Option B — local server (recommended, behaves like production)**

```bash
# if you have Python installed
python -m http.server 8000
# then open http://localhost:8000

# or with Node
npx serve .
```

> Car photos are loaded from Pexels, so you need an internet connection for the images.
> Everything else (data, accounts, bookings) is stored locally in your browser.

**Reset the demo at any time:** footer → *Reset demo data*, or Admin → *Data* tab.

---

## 2. Folder structure

```
veloce-car-rental/
├── index.html          1. Home              (hero, quick booking, featured, categories, reviews)
├── browse.html         2. Browse cars       (search + filters + sorting)
├── car.html            3. Car details       (?id=car_porsche911)
├── booking.html        4. Booking           (?id=…&pickup=…&return=…)
├── auth.html           5. Login / Signup
├── bookings.html       6. My bookings       (profile + cancel + receipts)
├── admin.html          7. Admin dashboard   (fleet, bookings, customers, data)
│
├── css/
│   └── style.css       one stylesheet: tokens, layout, components, pages, responsive
│
├── js/
│   ├── store.js        DATA LAYER  – cars, users, bookings, session, price calculator
│   ├── ui.js           SHARED UI   – header, footer, icons, toasts, modals, car card
│   ├── home.js         logic for index.html
│   ├── browse.js       logic for browse.html
│   ├── car.js          logic for car.html
│   ├── booking.js      logic for booking.html
│   ├── auth.js         logic for auth.html
│   ├── bookings.js     logic for bookings.html
│   └── admin.js        logic for admin.html
│
└── README.md
```

Every page loads the scripts in the same order: `store.js` → `ui.js` → *page script*.
`ui.js` reads `<body data-page="…">` and builds the navigation bar and footer automatically,
so the shell is never duplicated between pages.

---

## 3. Demo accounts

| Role     | Email              | Password   | What you can do                              |
|----------|--------------------|------------|----------------------------------------------|
| Customer | `demo@veloce.com`  | `demo123`  | 2 sample bookings already in *My bookings*   |
| Customer | `omar@mail.com`    | `omar123`  | extra sample customer (visible to admin)     |
| **Admin**| `admin@veloce.com` | `admin123` | full dashboard: add/edit/delete cars & bookings |

The login page has **click-to-fill** buttons for both demo accounts.
You can also create a brand-new account with the sign-up form.

> Passwords are stored in plain text in localStorage because this is a front-end-only
> simulation. A real product must hash passwords on a server.

---

## 4. The four modules and how they connect

```
        ┌──────────────────────────────────────────────────────────┐
        │                    js/store.js  (localStorage)            │
        │  veloce_cars_v1 · veloce_users_v1 · veloce_bookings_v1    │
        │  veloce_session_v1 · veloce_rental_draft_v1               │
        └──────────────────────────────────────────────────────────┘
             ▲                 ▲                  ▲              ▲
             │                 │                  │              │
   1. CATALOGUE        2. BOOKING         3. ACCOUNT       4. ADMIN
   browse.html         booking.html       bookings.html    admin.html
   car.html            (Store.quote)      auth.html        (Store.stats)
```

**Full workflow you can demonstrate live**

1. **Browse** — `browse.html`: search "BMW", tick *Electric*, drag the price slider, sort by price.
2. **Select** — click any card → `car.html?id=…`: gallery, specification, features.
3. **Dates** — the sticky panel calculates duration and total instantly and **blocks dates the
   car is already booked for** (try 3 → 8 days from today on the Range Rover, booked by the demo user).
4. **Price** — `Store.quote()` is the *single* calculator used by the car page, the booking page
   and the seeded sample bookings, so the numbers can never disagree.
   `subtotal − long-rental discount + insurance + extra driver + delivery + 8.5% VAT = total`
5. **Confirm** — `booking.html`: 3 steps (trip → driver → extras & review), each validated.
   A unique reference such as `VL-M3K9-Q7X2` is generated and the booking is written to localStorage.
6. **My bookings** — the reservation appears with its status; you can open the receipt, print it,
   or cancel it (free up to 24 h before pick-up).
7. **Admin** — sign in as admin and the same booking is in the table: change its status with the
   dropdown, open the full record, or delete it. Cars added/edited in the admin form appear
   immediately on the public pages.

---

## 5. Data structures

**Car**
```js
{ id, name, brand, category, transmission, seats, fuel, year, luggage, doors,
  pricePerDay, rating, reviews, featured, popular, status,
  image, gallery[], tagline, description, features[], pickup }
```

**User**
```js
{ id, name, email, password, phone, license, role: "customer" | "admin", joined }
```

**Booking**
```js
{ id: "VL-XXXX-XXXX",
  carId, carName, carBrand, carImage, carCategory,          // snapshot of the car
  userId, userName, userEmail, userPhone, userLicense,      // snapshot of the driver
  pickupDate, pickupTime, returnDate, returnTime, location,
  days, pricePerDay, insurance, extraDriver, delivery, youngDriver,
  subtotal, discount, discountLabel, insuranceCost, extraDriverCost,
  deliveryCost, tax, total,
  status: "pending"|"confirmed"|"active"|"completed"|"cancelled",
  createdAt, note }
```

Bookings keep a **snapshot** of the car and driver, so deleting a car in the admin never
breaks a customer's history.

Dates are stored as `"YYYY-MM-DD"` strings, which means plain `<` / `>` comparisons work
for the overlap check in `Store.isCarAvailable()`.

---

## 6. Feature checklist

**Catalogue & search** — 16 seeded cars with real photography · search by name/brand/category ·
filters for category, brand, price range, transmission, seats, fuel · sorting (price ↑/↓, rating,
name, featured) · detail page with gallery, spec table, features and similar cars ·
featured grid + "popular right now" rail on the home page · loading skeletons, empty and error states.

**Booking & calculator** — date pickers with min/max limits · automatic duration ·
automatic long-rental discounts (7/14/30 days) · optional insurance, extra driver and delivery ·
VAT · double-booking prevention · review table before confirming · unique booking ID ·
confirmation screen with printable receipt.

**Accounts** — sign-up with password strength meter and full validation · simulated login/session ·
profile view & edit (including password change) · bookings grouped by All / Upcoming / On trip /
Completed / Cancelled · cancellation with confirmation dialog · status shown everywhere.

**Admin** — KPI tiles (fleet size, bookings, revenue, cars on the road) · 6-month revenue bar
chart · status donut · most-rented ranking · car CRUD with live image preview · booking table with
inline status updates, detail view and delete · customer directory · storage inspector,
pricing-rule reference and one-click demo reset.

**Design** — dark navy / white / subtle-blue palette · Archivo (display) + Manrope (body) +
JetBrains Mono (numbers) · scroll-reveal animations, hover micro-interactions, animated counters,
marquee, toast notifications, modals · fully responsive at desktop, tablet and mobile breakpoints
(1080 / 900 / 640 px) with a hamburger drawer.

---

## 7. Ideas for a presentation

* Open the site, filter to **Electric**, sort **price low → high**, pick the Kia EV9.
* Book it for next week, add insurance and delivery, confirm → show the reference.
* Go to **My bookings**, open the receipt, then cancel a different upcoming booking.
* Sign out, sign in as **admin@veloce.com**, show the new booking in the table, flip its status,
  add a new car with any image URL and watch it appear on the home page.

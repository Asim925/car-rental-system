// Shared vehicle data used by every page
const U = id => `https://images.unsplash.com/${id}?w=800&h=520&fit=crop`;
const FALLBACK = U("photo-1494976388531-d1058494cdd8");
const FEATURES = {
  Economy: ["Air conditioning", "Great fuel economy", "Easy city parking", "Bluetooth / USB audio"],
  Sedan: ["Air conditioning", "Spacious rear seats", "Large boot", "Bluetooth / USB audio", "Rear parking sensors"],
  SUV: ["Dual-zone climate control", "High ground clearance", "Extra luggage space", "Rear camera", "Suited to long highway trips"],
  Luxury: ["Leather interior", "Premium sound system", "Cruise control", "Rear camera and sensors", "Optional chauffeur"]
};
const LUGGAGE = { Economy: "1-2 bags", Sedan: "3 bags", SUV: "4+ bags", Luxury: "3 bags" };
const CARS = [
  { id: 1, name: "Suzuki Alto", cat: "Economy", price: 2500, seats: 4, trans: "Manual", fuel: "Petrol", img: U("photo-1549317661-bd32c8ce0db2"), desc: "Compact and fuel-efficient — ideal for city driving and daily commutes." },
  { id: 2, name: "Toyota Corolla", cat: "Sedan", price: 4500, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1623869675781-80aa31012a5a"), desc: "Reliable sedan with comfort and space for family trips and business travel." },
  { id: 3, name: "Honda Civic", cat: "Sedan", price: 5500, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1606611013016-969c19ba27bb"), desc: "Stylish and smooth ride with modern features for a premium experience." },
  { id: 4, name: "Toyota Fortuner", cat: "SUV", price: 9000, seats: 7, trans: "Automatic", fuel: "Diesel", img: U("photo-1519641471654-76ce0107ad1b"), desc: "Powerful SUV built for highways, long trips, and rough terrain." },
  { id: 5, name: "Honda BR-V", cat: "SUV", price: 6500, seats: 7, trans: "Automatic", fuel: "Petrol", img: U("photo-1533473359331-0135ef1b58bf"), desc: "Spacious 7-seater SUV perfect for family outings and group travel." },
  { id: 6, name: "Mercedes C-Class", cat: "Luxury", price: 15000, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1618843479313-40f8afb4b4d8"), desc: "Luxury sedan with elegant design, comfort, and advanced features." },
  { id: 7, name: "Suzuki Cultus", cat: "Economy", price: 3000, seats: 5, trans: "Manual", fuel: "Petrol", img: U("photo-1494976388531-d1058494cdd8"), desc: "Affordable hatchback with good mileage for everyday use." },
  { id: 8, name: "Kia Sportage", cat: "SUV", price: 8000, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1606664515524-ed2f786a0bd6"), desc: "Modern crossover SUV with style, safety, and comfort." },
  { id: 9, name: "BMW 3 Series", cat: "Luxury", price: 18000, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1555215695-3004980ad094"), desc: "Performance luxury sedan for those who want the best driving experience." },
  { id: 10, name: "Toyota Yaris", cat: "Economy", price: 3500, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1617531653332-bd46c24f2068"), desc: "Efficient automatic sedan suited for city and short highway trips." },
  { id: 11, name: "Honda City", cat: "Sedan", price: 4000, seats: 5, trans: "Manual", fuel: "Petrol", img: U("photo-1583121274602-3e282f7ba1b5"), desc: "Practical sedan with solid build quality and comfortable interiors." },
  { id: 12, name: "Audi A4", cat: "Luxury", price: 16000, seats: 5, trans: "Automatic", fuel: "Petrol", img: U("photo-1606664515524-ed2f786a0bd6"), desc: "Premium German engineering with refined interiors and smooth handling." }
];

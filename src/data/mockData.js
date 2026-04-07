// ─────────────────────────────────────────────────────────────────────────────
// mockData.js  –  Simulates data from the Oracle relational schema:
//   USERS, DRIVERS, CABS, CAB_MAINTENANCE, BOOKINGS,
//   RIDE_TRACKING, RATINGS_REVIEWS, PAYMENT, EARNINGS
// ─────────────────────────────────────────────────────────────────────────────

export const USERS = [
  { user_id: 1, name: "Arjun Mehta", email: "arjun@example.com", phone: "+91-98001-11234", joined: "2023-01-15", total_rides: 42 },
  { user_id: 2, name: "Priya Sharma", email: "priya@example.com", phone: "+91-98001-22345", joined: "2023-03-08", total_rides: 18 },
  { user_id: 3, name: "Ravi Kumar", email: "ravi@example.com", phone: "+91-98001-33456", joined: "2022-11-20", total_rides: 87 },
  { user_id: 4, name: "Neha Patel", email: "neha@example.com", phone: "+91-98001-44567", joined: "2024-02-01", total_rides: 5 },
  { user_id: 5, name: "Suresh Iyer", email: "suresh@example.com", phone: "+91-98001-55678", joined: "2023-07-14", total_rides: 31 },
];

export const DRIVERS = [
  { driver_id: 101, name: "Mohammed Faiz", license_no: "TN09-20210012", phone: "+91-97001-10001", status: "Available", rating: 4.8, total_trips: 312, cab_id: 201, joined: "2021-06-10" },
  { driver_id: 102, name: "Selvam Rajan", license_no: "TN09-20190045", phone: "+91-97001-20002", status: "On Trip", rating: 4.6, total_trips: 489, cab_id: 202, joined: "2019-03-22" },
  { driver_id: 103, name: "Karthik Nair", license_no: "TN09-20220078", phone: "+91-97001-30003", status: "Available", rating: 4.9, total_trips: 201, cab_id: 203, joined: "2022-08-05" },
  { driver_id: 104, name: "Deepa Varma", license_no: "TN09-20200056", phone: "+91-97001-40004", status: "Off Duty", rating: 4.7, total_trips: 378, cab_id: 204, joined: "2020-01-18" },
  { driver_id: 105, name: "Rajesh Pillai", license_no: "TN09-20180023", phone: "+91-97001-50005", status: "Available", rating: 4.5, total_trips: 654, cab_id: 205, joined: "2018-09-30" },
  { driver_id: 106, name: "Anitha Suresh", license_no: "TN09-20230067", phone: "+91-97001-60006", status: "On Trip", rating: 4.8, total_trips: 143, cab_id: 206, joined: "2023-02-14" },
];

export const CABS = [
  { cab_id: 201, model: "Toyota Innova Crysta", license_plate: "TN09 AB 1234", type: "SUV", year: 2022, color: "Pearl White", status: "Active" },
  { cab_id: 202, model: "Maruti Swift Dzire", license_plate: "TN09 CD 5678", type: "Sedan", year: 2021, color: "Silver", status: "Active" },
  { cab_id: 203, model: "Honda City", license_plate: "TN09 EF 9012", type: "Sedan", year: 2023, color: "Lunar Silver", status: "Active" },
  { cab_id: 204, model: "Hyundai Creta", license_plate: "TN09 GH 3456", type: "SUV", year: 2022, color: "Deep Forest", status: "In Service" },
  { cab_id: 205, model: "Tata Nexon", license_plate: "TN09 IJ 7890", type: "Compact SUV", year: 2020, color: "Flame Red", status: "Active" },
  { cab_id: 206, model: "Mahindra XUV300", license_plate: "TN09 KL 2345", type: "Compact SUV", year: 2023, color: "Midnight Black", status: "Active" },
];

export const CAB_MAINTENANCE = [
  { maint_id: 1, cab_id: 201, service_date: "2024-12-10", service_type: "Oil Change", cost: 2500, technician: "Ram Auto Works", notes: "Next due at 85,000 km", status: "Completed" },
  { maint_id: 2, cab_id: 202, service_date: "2025-01-05", service_type: "Tyre Replacement", cost: 14000, technician: "MRF Tyres, Tambaram", notes: "All 4 tyres replaced", status: "Completed" },
  { maint_id: 3, cab_id: 203, service_date: "2025-02-20", service_type: "Brake Inspection", cost: 3200, technician: "Honda Service Center", notes: "Brake pads worn 40%", status: "Completed" },
  { maint_id: 4, cab_id: 204, service_date: "2025-03-01", service_type: "Engine Overhaul", cost: 38000, technician: "Hyundai STAR Works", notes: "Major overhaul – cab offline", status: "In Progress" },
  { maint_id: 5, cab_id: 205, service_date: "2025-03-15", service_type: "AC Service", cost: 5500, technician: "Cool Breeze Auto", notes: "Refrigerant refilled", status: "Completed" },
  { maint_id: 6, cab_id: 206, service_date: "2025-04-01", service_type: "Full Service", cost: 8500, technician: "Mahindra Authorised", notes: "Routine 20k km service", status: "Scheduled" },
  { maint_id: 7, cab_id: 201, service_date: "2025-04-05", service_type: "Windshield Repair", cost: 6000, technician: "AutoGlass Pro", notes: "Crack repaired", status: "Scheduled" },
];

export const BOOKINGS = [
  { booking_id: "BK-001", user_id: 1, driver_id: 101, cab_id: 201, pickup: "Chennai Central Railway Station", dropoff: "Chennai Airport (MAA)", pickup_time: "2025-04-01 08:00", fare: 850, status: "Completed", distance_km: 22 },
  { booking_id: "BK-002", user_id: 2, driver_id: 102, cab_id: 202, pickup: "Tambaram Bus Stand", dropoff: "T. Nagar, Chennai", pickup_time: "2025-04-02 14:30", fare: 420, status: "Completed", distance_km: 18 },
  { booking_id: "BK-003", user_id: 3, driver_id: 103, cab_id: 203, pickup: "Anna Salai, Chennai", dropoff: "OMR IT Corridor", pickup_time: "2025-04-03 09:15", fare: 680, status: "In Progress", distance_km: 28 },
  { booking_id: "BK-004", user_id: 4, driver_id: 105, cab_id: 205, pickup: "Velachery Metro Station", dropoff: "Perungudi, Chennai", pickup_time: "2025-04-04 11:00", fare: 310, status: "Completed", distance_km: 12 },
  { booking_id: "BK-005", user_id: 5, driver_id: 106, cab_id: 206, pickup: "Guindy Industrial Estate", dropoff: "Porur, Chennai", pickup_time: "2025-04-05 17:45", fare: 550, status: "Cancelled", distance_km: 19 },
  { booking_id: "BK-006", user_id: 1, driver_id: 101, cab_id: 201, pickup: "Koyambedu Bus Terminus", dropoff: "Sholinganallur, Chennai", pickup_time: "2025-04-06 07:30", fare: 720, status: "Scheduled", distance_km: 25 },
  { booking_id: "BK-007", user_id: 2, driver_id: 103, cab_id: 203, pickup: "Adyar, Chennai", dropoff: "Mount Road", pickup_time: "2025-04-06 19:00", fare: 390, status: "Scheduled", distance_km: 14 },
];

export const RIDE_TRACKING = [
  { track_id: 1, booking_id: "BK-001", driver_location: "GST Road near Saidapet", timestamp: "2025-04-01 08:05", speed_kmh: 42, status: "En Route" },
  { track_id: 2, booking_id: "BK-002", driver_location: "Tambaram Flyover", timestamp: "2025-04-02 14:35", speed_kmh: 38, status: "En Route" },
  { track_id: 3, booking_id: "BK-003", driver_location: "Anna Salai Signal", timestamp: "2025-04-03 09:20", speed_kmh: 55, status: "En Route" },
];

export const RATINGS_REVIEWS = [
  { review_id: 1, booking_id: "BK-001", user_id: 1, driver_id: 101, rating: 5, review: "Excellent ride, very punctual!", date: "2025-04-01" },
  { review_id: 2, booking_id: "BK-002", user_id: 2, driver_id: 102, rating: 4, review: "Good service, comfortable car.", date: "2025-04-02" },
  { review_id: 3, booking_id: "BK-004", user_id: 4, driver_id: 105, rating: 5, review: "Wonderful experience!", date: "2025-04-04" },
];

export const PAYMENTS = [
  { payment_id: "PAY-001", booking_id: "BK-001", amount: 850, method: "UPI", status: "Success", timestamp: "2025-04-01 08:52" },
  { payment_id: "PAY-002", booking_id: "BK-002", amount: 420, method: "Card", status: "Success", timestamp: "2025-04-02 15:18" },
  { payment_id: "PAY-003", booking_id: "BK-003", amount: 680, method: "Cash", status: "Pending", timestamp: "2025-04-03 10:00" },
  { payment_id: "PAY-004", booking_id: "BK-004", amount: 310, method: "UPI", status: "Success", timestamp: "2025-04-04 11:45" },
  { payment_id: "PAY-005", booking_id: "BK-005", amount: 0,   method: "Card", status: "Refunded", timestamp: "2025-04-05 18:00" },
];

export const EARNINGS = [
  { earnings_id: 1, booking_id: "BK-001", driver_id: 101, earning_date: "2025-04-01", period: "April 2025", gross: 12400, platform_fee: 1240, net: 11160, trips: 18 },
  { earnings_id: 2, booking_id: "BK-002", driver_id: 102, earning_date: "2025-04-02", period: "April 2025", gross: 9800, platform_fee: 980, net: 8820, trips: 14 },
  { earnings_id: 3, booking_id: "BK-003", driver_id: 103, earning_date: "2025-04-03", period: "April 2025", gross: 15200, platform_fee: 1520, net: 13680, trips: 22 },
  { earnings_id: 4, booking_id: "BK-004", driver_id: 104, earning_date: "2025-04-04", period: "April 2025", gross: 7600, platform_fee: 760, net: 6840, trips: 11 },
  { earnings_id: 5, booking_id: "BK-005", driver_id: 105, earning_date: "2025-04-05", period: "April 2025", gross: 18900, platform_fee: 1890, net: 17010, trips: 28 },
  { earnings_id: 6, booking_id: "BK-006", driver_id: 106, earning_date: "2025-04-06", period: "April 2025", gross: 11300, platform_fee: 1130, net: 10170, trips: 16 },
];

INSERT INTO users (user_id, name, email, password, phone_number, user_type, joined_date, total_rides) VALUES (1, 'Arjun Mehta', 'arjun@example.com', '123456', '+91-98001-11234', 'Passenger', TO_DATE('2023-01-15', 'YYYY-MM-DD'), 42);
INSERT INTO users (user_id, name, email, password, phone_number, user_type, joined_date, total_rides) VALUES (2, 'Priya Sharma', 'priya@example.com', '123456', '+91-98001-22345', 'Passenger', TO_DATE('2023-03-08', 'YYYY-MM-DD'), 18);
INSERT INTO users (user_id, name, email, password, phone_number, user_type, joined_date, total_rides) VALUES (3, 'Ravi Kumar', 'ravi@example.com', '123456', '+91-98001-33456', 'Passenger', TO_DATE('2022-11-20', 'YYYY-MM-DD'), 87);
INSERT INTO users (user_id, name, email, password, phone_number, user_type, joined_date, total_rides) VALUES (4, 'Neha Patel', 'neha@example.com', '123456', '+91-98001-44567', 'Passenger', TO_DATE('2024-02-01', 'YYYY-MM-DD'), 5);
INSERT INTO users (user_id, name, email, password, phone_number, user_type, joined_date, total_rides) VALUES (5, 'Suresh Iyer', 'suresh@example.com', '123456', '+91-98001-55678', 'Passenger', TO_DATE('2023-07-14', 'YYYY-MM-DD'), 31);

INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (201, 'SUV', 'Toyota Innova Crysta', 'TN09 AB 1234', 'Active', 2022, 'Pearl White');
INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (202, 'Sedan', 'Maruti Swift Dzire', 'TN09 CD 5678', 'Active', 2021, 'Silver');
INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (203, 'Sedan', 'Honda City', 'TN09 EF 9012', 'Active', 2023, 'Lunar Silver');
INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (204, 'SUV', 'Hyundai Creta', 'TN09 GH 3456', 'In Service', 2022, 'Deep Forest');
INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (205, 'Compact SUV', 'Tata Nexon', 'TN09 IJ 7890', 'Active', 2020, 'Flame Red');
INSERT INTO cabs (cab_id, type, model, license_plate, cab_status, manufacture_year, color) VALUES (206, 'Compact SUV', 'Mahindra XUV300', 'TN09 KL 2345', 'Active', 2023, 'Midnight Black');

INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (101, 'Mohammed Faiz', 'Available', 4.8, NULL, 201, 'TN09-20210012', '+91-97001-10001', 312, TO_DATE('2021-06-10', 'YYYY-MM-DD'));
INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (102, 'Selvam Rajan', 'On Trip', 4.6, NULL, 202, 'TN09-20190045', '+91-97001-20002', 489, TO_DATE('2019-03-22', 'YYYY-MM-DD'));
INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (103, 'Karthik Nair', 'Available', 4.9, NULL, 203, 'TN09-20220078', '+91-97001-30003', 201, TO_DATE('2022-08-05', 'YYYY-MM-DD'));
INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (104, 'Deepa Varma', 'Off Duty', 4.7, NULL, 204, 'TN09-20200056', '+91-97001-40004', 378, TO_DATE('2020-01-18', 'YYYY-MM-DD'));
INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (105, 'Rajesh Pillai', 'Available', 4.5, NULL, 205, 'TN09-20180023', '+91-97001-50005', 654, TO_DATE('2018-09-30', 'YYYY-MM-DD'));
INSERT INTO drivers (driver_id, driver_name, availability, ratings, user_id, cab_id, license_no, phone_number, total_trips, joined_date)
VALUES (106, 'Anitha Suresh', 'On Trip', 4.8, NULL, 206, 'TN09-20230067', '+91-97001-60006', 143, TO_DATE('2023-02-14', 'YYYY-MM-DD'));

INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-001', 'Chennai Central Railway Station', 'Chennai Airport (MAA)', TO_DATE('2025-04-01 08:00', 'YYYY-MM-DD HH24:MI'), 'Completed', 850, 1, 101, 201, 22);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-002', 'Tambaram Bus Stand', 'T. Nagar, Chennai', TO_DATE('2025-04-02 14:30', 'YYYY-MM-DD HH24:MI'), 'Completed', 420, 2, 102, 202, 18);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-003', 'Anna Salai, Chennai', 'OMR IT Corridor', TO_DATE('2025-04-03 09:15', 'YYYY-MM-DD HH24:MI'), 'In Progress', 680, 3, 103, 203, 28);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-004', 'Velachery Metro Station', 'Perungudi, Chennai', TO_DATE('2025-04-04 11:00', 'YYYY-MM-DD HH24:MI'), 'Completed', 310, 4, 105, 205, 12);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-005', 'Guindy Industrial Estate', 'Porur, Chennai', TO_DATE('2025-04-05 17:45', 'YYYY-MM-DD HH24:MI'), 'Cancelled', 550, 5, 106, 206, 19);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-006', 'Koyambedu Bus Terminus', 'Sholinganallur, Chennai', TO_DATE('2025-04-06 07:30', 'YYYY-MM-DD HH24:MI'), 'Scheduled', 720, 1, 101, 201, 25);
INSERT INTO bookings (booking_id, pickup_loc, dropoff_loc, pickup_time, status, fare, user_id, driver_id, cab_id, distance_km)
VALUES ('BK-007', 'Adyar, Chennai', 'Mount Road', TO_DATE('2025-04-06 19:00', 'YYYY-MM-DD HH24:MI'), 'Scheduled', 390, 2, 103, 203, 14);

INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (1, TO_DATE('2024-12-10', 'YYYY-MM-DD'), 'Oil Change', 2500, 201, 'Ram Auto Works', 'Next due at 85,000 km', 'Completed');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (2, TO_DATE('2025-01-05', 'YYYY-MM-DD'), 'Tyre Replacement', 14000, 202, 'MRF Tyres, Tambaram', 'All 4 tyres replaced', 'Completed');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (3, TO_DATE('2025-02-20', 'YYYY-MM-DD'), 'Brake Inspection', 3200, 203, 'Honda Service Center', 'Brake pads worn 40%', 'Completed');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (4, TO_DATE('2025-03-01', 'YYYY-MM-DD'), 'Engine Overhaul', 38000, 204, 'Hyundai STAR Works', 'Major overhaul - cab offline', 'In Progress');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (5, TO_DATE('2025-03-15', 'YYYY-MM-DD'), 'AC Service', 5500, 205, 'Cool Breeze Auto', 'Refrigerant refilled', 'Completed');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (6, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 'Full Service', 8500, 206, 'Mahindra Authorised', 'Routine 20k km service', 'Scheduled');
INSERT INTO cab_maintenance (maintenance_id, service_date, service_type, cost, cab_id, technician, notes, status)
VALUES (7, TO_DATE('2025-04-05', 'YYYY-MM-DD'), 'Windshield Repair', 6000, 201, 'AutoGlass Pro', 'Crack repaired', 'Scheduled');

INSERT INTO ride_tracking (tracking_id, driver_location, time_stamp, booking_id, speed_kmh, track_status)
VALUES (1, '13.0827,80.2707', TO_DATE('2025-04-01 08:05', 'YYYY-MM-DD HH24:MI'), 'BK-001', 42, 'En Route');
INSERT INTO ride_tracking (tracking_id, driver_location, time_stamp, booking_id, speed_kmh, track_status)
VALUES (2, '12.9249,80.1000', TO_DATE('2025-04-02 14:35', 'YYYY-MM-DD HH24:MI'), 'BK-002', 38, 'En Route');
INSERT INTO ride_tracking (tracking_id, driver_location, time_stamp, booking_id, speed_kmh, track_status)
VALUES (3, '13.0604,80.2496', TO_DATE('2025-04-03 09:20', 'YYYY-MM-DD HH24:MI'), 'BK-003', 55, 'En Route');

INSERT INTO ratings_reviews (review_id, rating, review, user_id, driver_id, booking_id, review_date)
VALUES (1, 5, 'Excellent ride, very punctual!', 1, 101, 'BK-001', TO_DATE('2025-04-01', 'YYYY-MM-DD'));
INSERT INTO ratings_reviews (review_id, rating, review, user_id, driver_id, booking_id, review_date)
VALUES (2, 4, 'Good service, comfortable car.', 2, 102, 'BK-002', TO_DATE('2025-04-02', 'YYYY-MM-DD'));
INSERT INTO ratings_reviews (review_id, rating, review, user_id, driver_id, booking_id, review_date)
VALUES (3, 5, 'Wonderful experience!', 4, 105, 'BK-004', TO_DATE('2025-04-04', 'YYYY-MM-DD'));

INSERT INTO feedback (feedback_id, message, user_id)
VALUES (1, 'App is smooth and booking flow is clear.', 1);
INSERT INTO feedback (feedback_id, message, user_id)
VALUES (2, 'Please add more pickup suggestions in Chennai.', 2);

INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (1, 'Chennai Central', 'Chennai Central Railway Station, Park Town', 1);
INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (2, 'Chennai Airport', 'Chennai International Airport (MAA), Meenambakkam', 2);
INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (3, 'T Nagar', 'Pondy Bazaar, T. Nagar, Chennai', 3);
INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (4, 'OMR IT Corridor', 'Old Mahabalipuram Road, Chennai', 4);
INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (5, 'Velachery', 'Velachery MRTS Station, Chennai', 5);
INSERT INTO saved_location (location_id, location_name, address, user_id)
VALUES (6, 'Koyambedu', 'CMBT Bus Terminus, Koyambedu, Chennai', 1);

INSERT INTO payment (payment_id, amount, payment_method, payment_status, booking_id, created_at)
VALUES ('PAY-001', 850, 'UPI', 'Success', 'BK-001', TO_DATE('2025-04-01 08:52', 'YYYY-MM-DD HH24:MI'));
INSERT INTO payment (payment_id, amount, payment_method, payment_status, booking_id, created_at)
VALUES ('PAY-002', 420, 'Card', 'Success', 'BK-002', TO_DATE('2025-04-02 15:18', 'YYYY-MM-DD HH24:MI'));
INSERT INTO payment (payment_id, amount, payment_method, payment_status, booking_id, created_at)
VALUES ('PAY-003', 680, 'Cash', 'Pending', 'BK-003', TO_DATE('2025-04-03 10:00', 'YYYY-MM-DD HH24:MI'));
INSERT INTO payment (payment_id, amount, payment_method, payment_status, booking_id, created_at)
VALUES ('PAY-004', 310, 'UPI', 'Success', 'BK-004', TO_DATE('2025-04-04 11:45', 'YYYY-MM-DD HH24:MI'));
INSERT INTO payment (payment_id, amount, payment_method, payment_status, booking_id, created_at)
VALUES ('PAY-005', 0, 'Card', 'Refunded', 'BK-005', TO_DATE('2025-04-05 18:00', 'YYYY-MM-DD HH24:MI'));

INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (1, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 12400, 'BK-001', 101, 1240, 18);
INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (2, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 9800, 'BK-002', 102, 980, 14);
INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (3, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 15200, 'BK-003', 103, 1520, 22);
INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (4, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 7600, 'BK-004', 104, 760, 11);
INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (5, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 18900, 'BK-005', 105, 1890, 28);
INSERT INTO earnings (earning_id, earning_date, driver_amount, booking_id, driver_id, platform_fee, trips)
VALUES (6, TO_DATE('2025-04-01', 'YYYY-MM-DD'), 11300, 'BK-006', 106, 1130, 16);

COMMIT;

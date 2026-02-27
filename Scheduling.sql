CREATE TABLE `bookings` (
  `booking_id` varchar(32) NOT NULL,
  `requested_by` varchar(60) NOT NULL,
  `event_name` varchar(100) NOT NULL,
  `venue` varchar(150) NOT NULL,
  `primary_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_hours` decimal(5,2) NOT NULL DEFAULT 1.00,
  `total_amount` int(11) NOT NULL,
  `resources` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`resources`)),
  `archived` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`booking_id`),
  KEY `idx_venue` (`venue`),
  KEY `idx_primary_date` (`primary_date`),
  KEY `idx_archived` (`archived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

CREATE TABLE `booking_dates` (
  `booking_id` varchar(32) NOT NULL,
  `booking_date` date NOT NULL,
  PRIMARY KEY (`booking_id`,`booking_date`),
  KEY `idx_booking_date` (`booking_date`),
  KEY `idx_date_booking` (`booking_date`,`booking_id`),
  CONSTRAINT `fk_booking_dates` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
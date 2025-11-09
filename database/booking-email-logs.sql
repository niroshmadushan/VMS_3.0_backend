-- =====================================================
-- BOOKING EMAIL LOGS SYSTEM
-- =====================================================

-- =====================================================
-- BOOKING EMAIL LOGS TABLE
-- =====================================================
-- This table stores logs of all booking-related emails sent to participants
-- =====================================================

-- Create booking_email_logs table
CREATE TABLE IF NOT EXISTS booking_email_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    booking_id CHAR(36) NOT NULL,
    sent_by INT NOT NULL,
    email_type ENUM(
        'booking_details', 
        'booking_confirmation', 
        'reminder_24h', 
        'reminder_1h', 
        'reminder_24_hours',
        'reminder_1_hour',
        'custom'
    ) NOT NULL,
    participants_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_sent_by (sent_by),
    INDEX idx_sent_at (sent_at),
    INDEX idx_email_type (email_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE STRUCTURE EXPLANATION
-- =====================================================
-- id: Unique identifier for each email log entry (UUID)
-- booking_id: Reference to the booking this email is related to
-- sent_by: User ID of the person who sent the email
-- email_type: Type of email sent (booking_details, confirmation, reminder, etc.)
-- participants_count: Number of participants the email was sent to
-- sent_at: Timestamp when the email was sent
-- results: JSON array containing detailed results for each participant email
-- created_at: Timestamp when the log entry was created
-- =====================================================

-- Create external_participants table (if not exists)
CREATE TABLE IF NOT EXISTS external_participants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    booking_id CHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    member_type ENUM('visitor', 'contractor', 'vendor', 'guest', 'employee') DEFAULT 'visitor',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_email (email),
    INDEX idx_full_name (full_name)
) ENGINE=InnoDB;

-- Create bookings table (if not exists)
CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    place_id CHAR(36),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'confirmed', 'upcoming', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_place_id (place_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Create places table (if not exists)
CREATE TABLE IF NOT EXISTS places (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB;


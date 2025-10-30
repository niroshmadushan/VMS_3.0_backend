-- =====================================================
-- PLACE MANAGEMENT SYSTEM - MYSQL VERSION
-- =====================================================

-- 1. PLACES TABLE
CREATE TABLE IF NOT EXISTS places (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Details
    place_type ENUM('office','warehouse','factory','retail','hospital','school','government','other') NOT NULL DEFAULT 'office',
    capacity INT CHECK (capacity > 0),
    area_sqft DECIMAL(10,2) CHECK (area_sqft > 0),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deactivation_reason TEXT,
    deactivated_at TIMESTAMP NULL,
    deactivated_by CHAR(36),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36) NULL
) ENGINE=InnoDB;

-- 2. PLACE DEACTIVATION REASONS
CREATE TABLE IF NOT EXISTS place_deactivation_reasons (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    place_id CHAR(36) NOT NULL,
    reason_type ENUM('maintenance','renovation','safety_concern','legal_issue',
                     'financial','operational','emergency','scheduled_closure',
                     'equipment_failure','staff_shortage','other') NOT NULL,
    reason_description TEXT NOT NULL,
    deactivated_by CHAR(36) NOT NULL,
    deactivated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_reactivation_date DATE,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by CHAR(36),
    resolution_notes TEXT,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. PLACE CONFIGURATION
CREATE TABLE IF NOT EXISTS place_configuration (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    place_id CHAR(36) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36),
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE KEY unique_place_config (place_id, config_key)
) ENGINE=InnoDB;

-- 4. VISITORS
CREATE TABLE IF NOT EXISTS visitors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    designation VARCHAR(255),
    id_type ENUM('passport','driver_license','national_id','company_id','other'),
    id_number VARCHAR(100),
    id_issuing_authority VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMP NULL,
    blacklisted_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. VISITS
CREATE TABLE IF NOT EXISTS visits (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    visitor_id CHAR(36) NOT NULL,
    place_id CHAR(36) NOT NULL,
    visit_purpose VARCHAR(255) NOT NULL,
    host_employee_id CHAR(36),
    host_name VARCHAR(255),
    host_department VARCHAR(100),
    host_phone VARCHAR(20),
    host_email VARCHAR(255),
    scheduled_start_time TIMESTAMP NULL,
    scheduled_end_time TIMESTAMP NULL,
    actual_start_time TIMESTAMP NULL,
    actual_end_time TIMESTAMP NULL,
    visit_status ENUM('scheduled','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    badge_number VARCHAR(50),
    access_level ENUM('standard','restricted','vip','contractor','emergency') DEFAULT 'standard',
    security_clearance_level VARCHAR(50),
    notes TEXT,
    special_requirements TEXT,
    vehicle_plate VARCHAR(20),
    vehicle_model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. VISIT CANCELLATIONS
CREATE TABLE IF NOT EXISTS visit_cancellations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    visit_id CHAR(36) NOT NULL,
    cancellation_reason ENUM('visitor_cancelled','host_cancelled','place_unavailable',
                             'security_concern','emergency','weather','transportation',
                             'health_issue','other') NOT NULL,
    cancellation_description TEXT,
    cancelled_by CHAR(36) NOT NULL,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visitor_notified BOOLEAN DEFAULT FALSE,
    host_notified BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP NULL,
    can_be_rescheduled BOOLEAN DEFAULT TRUE,
    rescheduled_to TIMESTAMP NULL,
    rescheduled_by CHAR(36),
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. PLACE ACCESS LOGS
CREATE TABLE IF NOT EXISTS place_access_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    visit_id CHAR(36) NOT NULL,
    place_id CHAR(36) NOT NULL,
    visitor_id CHAR(36) NOT NULL,
    access_type ENUM('entry','exit','restricted_area','emergency_exit','maintenance') NOT NULL,
    access_point VARCHAR(100),
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    badge_scanned BOOLEAN DEFAULT FALSE,
    security_verified BOOLEAN DEFAULT FALSE,
    security_officer_id CHAR(36),
    notes TEXT,
    temperature_check DECIMAL(4,1),
    health_screening_passed BOOLEAN,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. PLACE NOTIFICATIONS
CREATE TABLE IF NOT EXISTS place_notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    place_id CHAR(36) NOT NULL,
    notification_type ENUM('place_closure','maintenance','security_alert','emergency',
                           'scheduled_event','policy_update','system_maintenance','other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    target_audience ENUM('all','employees','visitors','security','management') NOT NULL,
    recipient_emails JSON,
    is_sent BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    read_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. PLACE STATISTICS
CREATE TABLE IF NOT EXISTS place_statistics (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    place_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    total_visitors INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    completed_visits INT DEFAULT 0,
    cancelled_visits INT DEFAULT 0,
    no_show_visits INT DEFAULT 0,
    avg_visit_duration_minutes INT DEFAULT 0,
    peak_hour INT,
    max_capacity_used INT DEFAULT 0,
    avg_capacity_used INT DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- VIEWS (simplified for MySQL)
-- =====================================================
CREATE OR REPLACE VIEW active_places AS
SELECT id, name, description, address, city, state, country, place_type, capacity, area_sqft, phone, email, created_at
FROM places WHERE is_active = TRUE;

CREATE OR REPLACE VIEW todays_visits AS
SELECT v.id, v.visitor_id, vis.first_name, vis.last_name, vis.company,
       v.place_id, p.name AS place_name, v.visit_purpose, v.host_name,
       v.scheduled_start_time, v.scheduled_end_time, v.actual_start_time, v.actual_end_time,
       v.visit_status, v.check_in_time, v.check_out_time
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN places p ON v.place_id = p.id
WHERE DATE(v.scheduled_start_time) = CURDATE()
ORDER BY v.scheduled_start_time;

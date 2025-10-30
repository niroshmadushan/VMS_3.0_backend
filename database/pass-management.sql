-- =====================================================
-- PASS MANAGEMENT SYSTEM - MYSQL VERSION
-- =====================================================

-- 1. PASS TYPES TABLE
CREATE TABLE IF NOT EXISTS pass_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INT DEFAULT 24,
    max_uses INT DEFAULT 1,
    access_level ENUM('standard','restricted','vip','contractor','emergency') DEFAULT 'standard',
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    auto_expire BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36),
    UNIQUE KEY unique_pass_type_name (name)
) ENGINE=InnoDB;

-- 2. PASSES TABLE
CREATE TABLE IF NOT EXISTS passes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pass_type_id CHAR(36) NOT NULL,
    pass_number VARCHAR(100) UNIQUE NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    holder_email VARCHAR(255),
    holder_phone VARCHAR(20),
    holder_company VARCHAR(255),
    holder_id_type ENUM('passport','driver_license','national_id','company_id','other'),
    holder_id_number VARCHAR(100),
    purpose TEXT,
    access_areas JSON,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    max_uses INT DEFAULT 1,
    used_count INT DEFAULT 0,
    status ENUM('active','expired','suspended','cancelled','used_up') DEFAULT 'active',
    issued_by CHAR(36) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    suspended_by CHAR(36),
    suspended_at TIMESTAMP NULL,
    suspension_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36),
    FOREIGN KEY (pass_type_id) REFERENCES pass_types(id) ON DELETE CASCADE,
    INDEX idx_pass_number (pass_number),
    INDEX idx_holder_email (holder_email),
    INDEX idx_status (status),
    INDEX idx_valid_until (valid_until)
) ENGINE=InnoDB;

-- 3. PASS ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS pass_assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pass_id CHAR(36) NOT NULL,
    place_id CHAR(36) NOT NULL,
    assigned_by CHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    access_level ENUM('standard','restricted','vip','contractor','emergency') DEFAULT 'standard',
    access_points JSON,
    restrictions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_by CHAR(36),
    deactivated_at TIMESTAMP NULL,
    deactivation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36),
    FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    INDEX idx_pass_id (pass_id),
    INDEX idx_place_id (place_id),
    INDEX idx_is_active (is_active),
    INDEX idx_valid_until (valid_until)
) ENGINE=InnoDB;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for better query performance
CREATE INDEX idx_pass_types_active ON pass_types(is_active);
CREATE INDEX idx_passes_holder_name ON passes(holder_name);
CREATE INDEX idx_passes_valid_from ON passes(valid_from);
CREATE INDEX idx_passes_issued_at ON passes(issued_at);
CREATE INDEX idx_pass_assignments_valid_from ON pass_assignments(valid_from);

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample pass types
INSERT IGNORE INTO pass_types (id, name, description, duration_hours, max_uses, access_level, requires_approval, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Visitor Pass', 'Standard visitor pass for day visits', 8, 1, 'standard', FALSE, '11'),
('550e8400-e29b-41d4-a716-446655440002', 'Contractor Pass', 'Extended access pass for contractors', 168, 10, 'contractor', TRUE, '11'),
('550e8400-e29b-41d4-a716-446655440003', 'VIP Pass', 'Premium access pass for VIP visitors', 24, 3, 'vip', TRUE, '11'),
('550e8400-e29b-41d4-a716-446655440004', 'Emergency Pass', 'Emergency access pass for urgent situations', 2, 1, 'emergency', FALSE, '11');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active passes view
CREATE OR REPLACE VIEW active_passes AS
SELECT p.id, p.pass_number, p.holder_name, p.holder_email, p.holder_company,
       pt.name as pass_type_name, pt.duration_hours, pt.max_uses,
       p.valid_from, p.valid_until, p.status, p.used_count,
       p.issued_at, p.issued_by
FROM passes p
JOIN pass_types pt ON p.pass_type_id = pt.id
WHERE p.status = 'active' 
AND p.valid_until > NOW()
AND p.used_count < p.max_uses;

-- Pass assignments with place details
CREATE OR REPLACE VIEW pass_assignments_with_details AS
SELECT pa.id, pa.pass_id, pa.place_id, pa.access_level, pa.valid_from, pa.valid_until,
       p.pass_number, p.holder_name, p.holder_email, p.holder_company,
       pt.name as pass_type_name,
       pl.name as place_name, pl.address, pl.city,
       pa.assigned_at, pa.assigned_by, pa.is_active
FROM pass_assignments pa
JOIN passes p ON pa.pass_id = p.id
JOIN pass_types pt ON p.pass_type_id = pt.id
JOIN places pl ON pa.place_id = pl.id
WHERE pa.is_active = TRUE;




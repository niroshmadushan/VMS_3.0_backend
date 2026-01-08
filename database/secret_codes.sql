-- =====================================================
-- SECRET CODES TABLE FOR SECURE SIGNUP
-- =====================================================

CREATE TABLE IF NOT EXISTS `secret_tbl` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `secret_code` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Secret code for signup validation',
  `code_name` VARCHAR(255) NULL COMMENT 'Name/description of the code',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether this code is active',
  `max_uses` INT DEFAULT NULL COMMENT 'Maximum number of times this code can be used (NULL = unlimited)',
  `used_count` INT DEFAULT 0 COMMENT 'Number of times this code has been used',
  `expires_at` DATETIME NULL COMMENT 'Expiration date for this code (NULL = never expires)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT NULL COMMENT 'User who created this code',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT NULL COMMENT 'User who last updated this code',
  
  INDEX `idx_secret_code` (`secret_code`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default secret codes (you should change these in production)
INSERT INTO `secret_tbl` (`secret_code`, `code_name`, `is_active`, `max_uses`, `expires_at`) VALUES
('CONNEX2024', 'Default Connex Signup Code', TRUE, NULL, NULL),
('CONNEXIT2024', 'ConnexIT Signup Code', TRUE, NULL, NULL),
('CONNEX3602024', 'Connex360 Signup Code', TRUE, NULL, NULL),
('CONNEXVECTRA2024', 'ConnexVectra Signup Code', TRUE, NULL, NULL)
ON DUPLICATE KEY UPDATE `code_name` = VALUES(`code_name`);


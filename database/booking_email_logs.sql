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
--           Format: [{"participantId": "...", "participantName": "...", "participantEmail": "...", "success": true/false, "message": "..."}]
-- created_at: Timestamp when the log entry was created
-- =====================================================

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Get all email logs for a specific booking
-- SELECT * FROM booking_email_logs WHERE booking_id = 'your-booking-id' ORDER BY sent_at DESC;

-- Get email logs sent by a specific user
-- SELECT * FROM booking_email_logs WHERE sent_by = 1 ORDER BY sent_at DESC;

-- Get email logs by type
-- SELECT * FROM booking_email_logs WHERE email_type = 'booking_details' ORDER BY sent_at DESC;

-- Get email logs with successful sends only
-- SELECT * FROM booking_email_logs WHERE JSON_EXTRACT(results, '$[*].success') = true;

-- Count emails sent per booking
-- SELECT booking_id, COUNT(*) as email_count, SUM(participants_count) as total_participants 
-- FROM booking_email_logs 
-- GROUP BY booking_id;

-- =====================================================


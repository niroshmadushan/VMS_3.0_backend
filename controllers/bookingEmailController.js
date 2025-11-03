const { executeQuery, getOne } = require('../config/database');
const { sendEmail } = require('../services/emailService');

/**
 * Send booking details email to participants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendBookingDetailsEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { participantIds, emailType = 'booking_details', customMessage } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get booking details
        const [bookingResult] = await executeQuery(
            `SELECT 
                b.*,
                p.name as place_name,
                p.address as place_address,
                p.phone as place_phone,
                p.email as place_email,
                u.email as created_by_email,
                CONCAT(pr.first_name, ' ', pr.last_name) as created_by_name
             FROM bookings b
             LEFT JOIN places p ON b.place_id = p.id
             LEFT JOIN users u ON b.created_by = u.id
             LEFT JOIN profiles pr ON u.id = pr.user_id
             WHERE b.id = ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Get participants based on provided IDs or all participants
        let participants = [];
        if (participantIds && participantIds.length > 0) {
            // Get specific participants
            const participantQuery = `
                SELECT 
                    ep.id,
                    ep.full_name,
                    ep.email,
                    ep.phone,
                    ep.company_name,
                    ep.member_type,
                    ep.booking_id
                FROM external_participants ep
                WHERE ep.booking_id = ? AND ep.id IN (${participantIds.map(() => '?').join(',')}) AND ep.is_deleted = 0
            `;
            const [participantResult] = await executeQuery(participantQuery, [bookingId, ...participantIds]);
            participants = participantResult;
        } else {
            // Get all participants for this booking
            const [participantResult] = await executeQuery(
                `SELECT 
                    ep.id,
                    ep.full_name,
                    ep.email,
                    ep.phone,
                    ep.company_name,
                    ep.member_type,
                    ep.booking_id
                FROM external_participants ep
                WHERE ep.booking_id = ? AND ep.is_deleted = 0`,
                [bookingId]
            );
            participants = participantResult;
        }

        if (participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants found for this booking'
            });
        }

        // Send emails to participants
        const emailResults = [];
        const emailPromises = participants.map(async (participant) => {
            try {
                if (!participant.email) {
                    return {
                        participantId: participant.id,
                        participantName: participant.full_name,
                        success: false,
                        message: 'No email address provided'
                    };
                }

                // Generate email content based on type
                const emailContent = generateEmailContent(booking, participant, emailType, customMessage);
                
                // Send email
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });

                return {
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: emailResult.success,
                    message: emailResult.message || 'Email sent successfully'
                };
            } catch (error) {
                console.error(`Error sending email to ${participant.email}:`, error);
                return {
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: false,
                    message: error.message
                };
            }
        });

        const results = await Promise.all(emailPromises);

        // Log email sending activity
        await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [bookingId, userId, emailType, participants.length, JSON.stringify(results)]
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            message: `Email sending completed. ${successCount} successful, ${failureCount} failed.`,
            data: {
                bookingId,
                bookingTitle: booking.title,
                totalParticipants: participants.length,
                emailsSent: successCount,
                emailsFailed: failureCount,
                results: results
            }
        });

    } catch (error) {
        console.error('Error sending booking details email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send booking details email',
            error: error.message
        });
    }
};

/**
 * Send booking reminder emails
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendBookingReminderEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reminderType = '24_hours', customMessage } = req.body;
        const userId = req.user.id;

        // Get booking details
        const [bookingResult] = await executeQuery(
            `SELECT 
                b.*,
                p.name as place_name,
                p.address as place_address,
                p.phone as place_phone,
                p.email as place_email
             FROM bookings b
             LEFT JOIN places p ON b.place_id = p.id
             WHERE b.id = ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Get all participants
        const [participants] = await executeQuery(
            `SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name,
                ep.member_type
            FROM external_participants ep
            WHERE ep.booking_id = ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL`,
            [bookingId]
        );

        if (participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants with email addresses found'
            });
        }

        // Send reminder emails
        const emailResults = [];
        const emailPromises = participants.map(async (participant) => {
            try {
                const emailContent = generateReminderEmailContent(booking, participant, reminderType, customMessage);
                
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });

                return {
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: emailResult.success,
                    message: emailResult.message || 'Reminder sent successfully'
                };
            } catch (error) {
                return {
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: false,
                    message: error.message
                };
            }
        });

        const results = await Promise.all(emailPromises);

        // Log reminder sending activity
        await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [bookingId, userId, `reminder_${reminderType}`, participants.length, JSON.stringify(results)]
        );

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `Reminder emails sent to ${successCount} participants`,
            data: {
                bookingId,
                bookingTitle: booking.title,
                reminderType,
                totalParticipants: participants.length,
                emailsSent: successCount,
                results: results
            }
        });

    } catch (error) {
        console.error('Error sending booking reminder email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send booking reminder email',
            error: error.message
        });
    }
};

/**
 * Get booking participants for email selection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingParticipants = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const [bookingResult] = await executeQuery(
            `SELECT b.id, b.title, b.start_time, b.end_time, p.name as place_name
             FROM bookings b
             LEFT JOIN places p ON b.place_id = p.id
             WHERE b.id = ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Get participants
        const [participants] = await executeQuery(
            `SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name,
                ep.member_type,
                CASE WHEN ep.email IS NOT NULL AND ep.email != '' THEN 1 ELSE 0 END as has_email
            FROM external_participants ep
            WHERE ep.booking_id = ? AND ep.is_deleted = 0
            ORDER BY ep.full_name`,
            [bookingId]
        );

        res.json({
            success: true,
            message: 'Booking participants retrieved successfully',
            data: {
                booking: bookingResult[0],
                participants: participants,
                totalParticipants: participants.length,
                participantsWithEmail: participants.filter(p => p.has_email).length
            }
        });

    } catch (error) {
        console.error('Error getting booking participants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get booking participants',
            error: error.message
        });
    }
};

/**
 * Get email sending history for a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingEmailHistory = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [emailHistory] = await executeQuery(
            `SELECT 
                bel.*,
                CONCAT(pr.first_name, ' ', pr.last_name) as sent_by_name,
                u.email as sent_by_email
            FROM booking_email_logs bel
            LEFT JOIN users u ON bel.sent_by = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE bel.booking_id = ?
            ORDER BY bel.sent_at DESC`,
            [bookingId]
        );

        res.json({
            success: true,
            message: 'Email history retrieved successfully',
            data: {
                bookingId,
                emailHistory: emailHistory,
                totalEmailsSent: emailHistory.length
            }
        });

    } catch (error) {
        console.error('Error getting booking email history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get email history',
            error: error.message
        });
    }
};

/**
 * Generate email content based on type
 */
function generateEmailContent(booking, participant, emailType, customMessage) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    let subject, html, text;

    switch (emailType) {
        case 'booking_details':
            subject = `Booking Details - ${booking.title}`;
            html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                        .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff; }
                        .detail-row { margin: 10px 0; }
                        .label { font-weight: bold; color: #495057; }
                        .value { color: #6c757d; }
                        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📅 Booking Details</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${participant.full_name},</p>
                            <p>Here are the details for your upcoming booking:</p>
                            
                            <div class="booking-details">
                                <h3>${booking.title}</h3>
                                <div class="detail-row">
                                    <span class="label">📅 Date:</span>
                                    <span class="value">${formatDate(booking.start_time)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">🕐 Time:</span>
                                    <span class="value">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">📍 Location:</span>
                                    <span class="value">${booking.place_name || 'TBD'}</span>
                                </div>
                                ${booking.place_address ? `
                                <div class="detail-row">
                                    <span class="label">🏢 Address:</span>
                                    <span class="value">${booking.place_address}</span>
                                </div>
                                ` : ''}
                                ${booking.description ? `
                                <div class="detail-row">
                                    <span class="label">📝 Description:</span>
                                    <span class="value">${booking.description}</span>
                                </div>
                                ` : ''}
                            </div>
                            
                            ${customMessage ? `<p><strong>Additional Message:</strong><br>${customMessage}</p>` : ''}
                            
                            <p>If you have any questions or need to make changes, please contact us.</p>
                            
                            <p>Best regards,<br>Booking Management Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            text = `
                Booking Details - ${booking.title}
                
                Dear ${participant.full_name},
                
                Here are the details for your upcoming booking:
                
                ${booking.title}
                Date: ${formatDate(booking.start_time)}
                Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}
                Location: ${booking.place_name || 'TBD'}
                ${booking.place_address ? `Address: ${booking.place_address}` : ''}
                ${booking.description ? `Description: ${booking.description}` : ''}
                
                ${customMessage ? `Additional Message: ${customMessage}` : ''}
                
                If you have any questions or need to make changes, please contact us.
                
                Best regards,
                Booking Management Team
            `;
            break;

        case 'booking_confirmation':
            subject = `Booking Confirmed - ${booking.title}`;
            html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                        .confirmation { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Booking Confirmed</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${participant.full_name},</p>
                            
                            <div class="confirmation">
                                <h3>Your booking has been confirmed!</h3>
                                <p><strong>${booking.title}</strong></p>
                                <p>Date: ${formatDate(booking.start_time)}</p>
                                <p>Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                                <p>Location: ${booking.place_name || 'TBD'}</p>
                            </div>
                            
                            ${customMessage ? `<p><strong>Additional Information:</strong><br>${customMessage}</p>` : ''}
                            
                            <p>We look forward to seeing you!</p>
                            
                            <p>Best regards,<br>Booking Management Team</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;

        default:
            subject = `Booking Information - ${booking.title}`;
            html = `<p>Dear ${participant.full_name},<br><br>Please find your booking details attached.<br><br>Best regards,<br>Booking Management Team</p>`;
            text = `Dear ${participant.full_name},\n\nPlease find your booking details attached.\n\nBest regards,\nBooking Management Team`;
    }

    return { subject, html, text };
}

/**
 * Generate reminder email content
 */
function generateReminderEmailContent(booking, participant, reminderType, customMessage) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    let subject, html, text;

    switch (reminderType) {
        case '24_hours':
            subject = `Reminder: Booking Tomorrow - ${booking.title}`;
            html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                        .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>⏰ Booking Reminder</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${participant.full_name},</p>
                            
                            <div class="reminder">
                                <h3>This is a friendly reminder about your upcoming booking:</h3>
                                <p><strong>${booking.title}</strong></p>
                                <p>📅 Date: ${formatDate(booking.start_time)}</p>
                                <p>🕐 Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                                <p>📍 Location: ${booking.place_name || 'TBD'}</p>
                            </div>
                            
                            ${customMessage ? `<p><strong>Additional Information:</strong><br>${customMessage}</p>` : ''}
                            
                            <p>Please arrive on time. If you need to make any changes, please contact us as soon as possible.</p>
                            
                            <p>Best regards,<br>Booking Management Team</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;

        case '1_hour':
            subject = `Reminder: Booking in 1 Hour - ${booking.title}`;
            html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                        .urgent { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚨 Urgent Reminder</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${participant.full_name},</p>
                            
                            <div class="urgent">
                                <h3>Your booking starts in 1 hour!</h3>
                                <p><strong>${booking.title}</strong></p>
                                <p>📅 Date: ${formatDate(booking.start_time)}</p>
                                <p>🕐 Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                                <p>📍 Location: ${booking.place_name || 'TBD'}</p>
                            </div>
                            
                            <p>Please make sure you're ready to attend. If you cannot make it, please contact us immediately.</p>
                            
                            <p>Best regards,<br>Booking Management Team</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;

        default:
            subject = `Reminder: ${booking.title}`;
            html = `<p>Dear ${participant.full_name},<br><br>This is a reminder about your upcoming booking.<br><br>Best regards,<br>Booking Management Team</p>`;
    }

    text = html.replace(/<[^>]*>/g, ''); // Strip HTML tags for text version

    return { subject, html, text };
}

module.exports = {
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingParticipants,
    getBookingEmailHistory
};


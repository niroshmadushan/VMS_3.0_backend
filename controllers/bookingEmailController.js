const { executeQuery, getOne } = require('../config/database');
const { sendEmail } = require('../services/emailService');
const { generateICSFromFrontend, generateCSVFromFrontend } = require('../services/calendarService');

/**
 * Send booking email with data from frontend (no database queries)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendBookingEmailFromFrontend = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Get all data from frontend request body
        const {
            meetingName,
            date,
            startTime,
            endTime,
            place,
            description,
            participantEmails, // Array of email addresses
            emailType = 'booking_details',
            customMessage = '',
            includeCalendar = true, // Include ICS calendar file by default
            calendarFormat = 'ics' // 'ics' or 'csv'
        } = req.body;

        console.log('📧 ========== BOOKING EMAIL FROM FRONTEND ==========');
        console.log('📋 Request Details:');
        console.log('   - User ID:', userId);
        console.log('   - User Role:', userRole);
        console.log('   - Meeting Name:', meetingName);
        console.log('   - Date:', date);
        console.log('   - Start Time:', startTime);
        console.log('   - End Time:', endTime);
        console.log('   - Place:', place);
        console.log('   - Description:', description || '(none)');
        console.log('   - Participant Emails:', participantEmails ? participantEmails.length + ' emails' : 'none');
        console.log('   - Email Type:', emailType);
        console.log('   - Custom Message:', customMessage || '(none)');
        console.log('==========================================');

        // Validate required fields
        if (!meetingName) {
            return res.status(400).json({
                success: false,
                message: 'Meeting name is required'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Start time and end time are required'
            });
        }

        if (!participantEmails || !Array.isArray(participantEmails) || participantEmails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one participant email is required'
            });
        }

        // Create booking object from frontend data
        const booking = {
            title: meetingName,
            description: description || '',
            place_name: place || 'TBD',
            start_time: `${date} ${startTime}`,
            end_time: `${date} ${endTime}`,
            booking_date: date
        };

        console.log('');
        console.log('📅 Booking Object Created:');
        console.log('   - Title:', booking.title);
        console.log('   - Date:', booking.booking_date);
        console.log('   - Start Time:', booking.start_time);
        console.log('   - End Time:', booking.end_time);
        console.log('   - Place:', booking.place_name);
        console.log('   - Description:', booking.description);
        console.log('');

        // Send emails to all participants
        console.log('📤 Starting to send emails to', participantEmails.length, 'participants...');
        console.log('');

        const emailPromises = participantEmails.map(async (email, index) => {
            try {
                // Create participant object
                const participant = {
                    full_name: email.split('@')[0], // Use email username as name
                    email: email
                };

                console.log(`📧 [${index + 1}/${participantEmails.length}] Processing: ${email}`);

                // Generate email content
                const emailContent = generateEmailContentFromData(booking, participant, emailType, customMessage);

                console.log('');
                console.log('📧 ========== EMAIL CONTENT ==========');
                console.log('   To:', email);
                console.log('   Subject:', emailContent.subject);
                console.log('');
                console.log('   📝 HTML Body (first 500 chars):');
                console.log('   ' + emailContent.html.substring(0, 500) + '...');
                console.log('');
                console.log('   📄 Text Body:');
                console.log('   ' + emailContent.text.replace(/\n/g, '\n   '));
                console.log('==========================================');
                console.log('');

                // Prepare attachments (calendar file)
                const attachments = [];
                if (includeCalendar) {
                    try {
                        const calendarData = {
                            meetingName,
                            date,
                            startTime,
                            endTime,
                            place: place || '',
                            description: description || '',
                            participantEmails: [email],
                            organizerEmail: email
                        };
                        
                        if (calendarFormat === 'csv') {
                            const csvContent = generateCSVFromFrontend(calendarData);
                            attachments.push({
                                filename: `${meetingName.replace(/[^a-z0-9]/gi, '_')}_${date}.csv`,
                                content: csvContent,
                                contentType: 'text/csv'
                            });
                            console.log('   📅 CSV calendar file attached');
                        } else {
                            // Default to ICS
                            const icsContent = generateICSFromFrontend(calendarData);
                            attachments.push({
                                filename: `${meetingName.replace(/[^a-z0-9]/gi, '_')}_${date}.ics`,
                                content: icsContent,
                                contentType: 'text/calendar; charset=utf-8; method=REQUEST'
                            });
                            console.log('   📅 ICS calendar file attached');
                        }
                    } catch (calendarError) {
                        console.error('   ⚠️  Error generating calendar file:', calendarError.message);
                        // Continue without calendar attachment
                    }
                }

                // Send email
                const emailResult = await sendEmail({
                    to: email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text,
                    attachments: attachments
                });

                if (emailResult.success) {
                    console.log(`   ✅ SUCCESS: Email sent to ${email}`);
                } else {
                    console.log(`   ❌ FAILED: ${emailResult.error || 'Unknown error'}`);
                }

                return {
                    participantEmail: email,
                    success: emailResult.success,
                    message: emailResult.message || (emailResult.success ? 'Email sent successfully' : 'Failed to send email')
                };
            } catch (error) {
                console.error(`   ❌ ERROR sending email to ${email}:`, error.message);
                return {
                    participantEmail: email,
                    success: false,
                    message: error.message
                };
            }
        });

        const results = await Promise.all(emailPromises);

        // Log email sending activity (optional - you can remove this if you don't want to log)
        const logResult = await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            ['frontend-sent', userId, emailType, participantEmails.length, JSON.stringify(results)]
        );

        if (!logResult.success) {
            console.error('Failed to log email activity:', logResult.error);
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log('');
        console.log('📊 Email Sending Summary:');
        console.log('   ✅ Successful:', successCount);
        console.log('   ❌ Failed:', failureCount);
        console.log('   📧 Total Processed:', results.length);
        console.log('==========================================');
        console.log('');

        res.json({
            success: true,
            message: `Email sending completed. ${successCount} successful, ${failureCount} failed.`,
            data: {
                meetingName,
                totalParticipants: participantEmails.length,
                emailsSent: successCount,
                emailsFailed: failureCount,
                results: results
            }
        });

    } catch (error) {
        console.error('Error sending booking email from frontend:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send booking email',
            error: error.message
        });
    }
};

/**
 * Generate email content from frontend data (no database queries)
 */
function generateEmailContentFromData(booking, participant, emailType, customMessage) {
    console.log('📧 generateEmailContentFromData - booking.start_time:', booking.start_time);
    console.log('📧 generateEmailContentFromData - booking.end_time:', booking.end_time);
    
    const formatDate = (dateInput) => {
        if (!dateInput) {
            return String(dateInput || 'TBD');
        }
        // Return raw value as string - no formatting
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        return rawValue;
    };

    const formatTime = (dateInput) => {
        if (!dateInput) {
            return String(dateInput || 'TBD');
        }
        // Return raw value as string - no formatting
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        return rawValue;
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
                                    <span class="value">${formatDate(booking.booking_date || booking.start_time)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">🕐 Time:</span>
                                    <span class="value">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">📍 Location:</span>
                                    <span class="value">${booking.place_name || 'TBD'}</span>
                                </div>
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
                Date: ${formatDate(booking.booking_date || booking.start_time)}
                Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}
                Location: ${booking.place_name || 'TBD'}
                ${booking.description ? `Description: ${booking.description}` : ''}
                
                ${customMessage ? `Additional Message: ${customMessage}` : ''}
                
                If you have any questions or need to make changes, please contact us.
                
                Best regards,
                Booking Management Team
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

        // Console log request details
        console.log('📧 ========== BOOKING EMAIL REQUEST ==========');
        console.log('📋 Request Details:');
        console.log('   - Booking ID:', bookingId);
        console.log('   - User ID:', userId);
        console.log('   - User Role:', userRole);
        console.log('   - Email Type:', emailType);
        console.log('   - Custom Message:', customMessage || '(none)');
        console.log('   - Participant IDs:', participantIds ? participantIds.length + ' selected' : 'ALL participants');
        if (participantIds && participantIds.length > 0) {
            console.log('   - Selected Participant IDs:', participantIds);
            // Categorize participant IDs (frontend sends prefixed IDs)
            const externalIds = participantIds.filter(id => id.startsWith('external-'));
            const responsibleIds = participantIds.filter(id => id.startsWith('responsible-'));
            const internalIds = participantIds.filter(id => id.startsWith('internal-'));
            if (externalIds.length > 0) console.log('      📌 External participants:', externalIds.length);
            if (responsibleIds.length > 0) console.log('      👤 Responsible person:', responsibleIds.length);
            if (internalIds.length > 0) console.log('      🏢 Internal participants:', internalIds.length);
        }
        console.log('==========================================');

        // Get booking details with properly formatted dates
        // Fetching: booking_date, start_time, end_time from bookings table
        const bookingQueryResult = await executeQuery(
            `SELECT 
                b.id,
                b.title,
                b.description,
                b.place_id,
                b.created_by,
                b.status,
                b.is_deleted,
                b.created_at,
                b.updated_at,
                -- Date and time columns from bookings table
                b.booking_date,
                b.start_time,
                b.end_time,
                -- Formatted versions for easier handling
                CASE 
                    WHEN b.booking_date IS NOT NULL 
                    THEN DATE_FORMAT(b.booking_date, '%Y-%m-%d') 
                    ELSE NULL 
                END as booking_date_str,
                CASE 
                    WHEN b.start_time IS NOT NULL 
                    THEN DATE_FORMAT(b.start_time, '%Y-%m-%d %H:%i:%s') 
                    ELSE NULL 
                END as start_time_str,
                CASE 
                    WHEN b.end_time IS NOT NULL 
                    THEN DATE_FORMAT(b.end_time, '%Y-%m-%d %H:%i:%s') 
                    ELSE NULL 
                END as end_time_str,
                -- Place information
                p.name as place_name,
                p.address as place_address,
                p.phone as place_phone,
                p.email as place_email,
                -- Creator information
                u.email as created_by_email,
                CONCAT(pr.first_name, ' ', pr.last_name) as created_by_name
             FROM bookings b
             LEFT JOIN places p ON BINARY b.place_id = BINARY p.id
             LEFT JOIN users u ON b.created_by = u.id
             LEFT JOIN profiles pr ON u.id = pr.user_id
             WHERE BINARY b.id = BINARY ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (!bookingQueryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: bookingQueryResult.error
            });
        }

        if (bookingQueryResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingQueryResult.data[0];
        
        console.log('');
        console.log('📋 ========== BOOKING DATA FROM DATABASE ==========');
        console.log('   All booking columns:');
        console.log('   - booking_date:', booking.booking_date, '(Type:', typeof booking.booking_date, ')');
        console.log('   - start_time:', booking.start_time, '(Type:', typeof booking.start_time, ')');
        console.log('   - end_time:', booking.end_time, '(Type:', typeof booking.end_time, ')');
        console.log('   - booking_date_str:', booking.booking_date_str, '(Type:', typeof booking.booking_date_str, ')');
        console.log('   - start_time_str:', booking.start_time_str, '(Type:', typeof booking.start_time_str, ')');
        console.log('   - end_time_str:', booking.end_time_str, '(Type:', typeof booking.end_time_str, ')');
        console.log('   - Title:', booking.title);
        console.log('   - Place:', booking.place_name);
        console.log('==========================================');
        console.log('');
        
        // Determine which date/time to use for display
        // Priority: booking_date (date) + start_time/end_time (time) OR start_time/end_time (date + time)
        
        // For DATE: Use booking_date if available, otherwise extract date from start_time
        if (booking.booking_date_str && booking.booking_date_str !== 'null' && booking.booking_date_str !== '') {
            booking.booking_date_display = booking.booking_date_str;
            console.log('✅ Using booking_date_str for date:', booking.booking_date_display);
        } else if (booking.booking_date instanceof Date) {
            const year = booking.booking_date.getFullYear();
            const month = String(booking.booking_date.getMonth() + 1).padStart(2, '0');
            const day = String(booking.booking_date.getDate()).padStart(2, '0');
            booking.booking_date_display = `${year}-${month}-${day}`;
            console.log('✅ Converted booking_date Date to string:', booking.booking_date_display);
        } else if (booking.booking_date && booking.booking_date !== 'null' && booking.booking_date !== '') {
            booking.booking_date_display = String(booking.booking_date);
            console.log('✅ Using original booking_date:', booking.booking_date_display);
        } else if (booking.start_time_str) {
            // Extract date from start_time if booking_date is not available
            booking.booking_date_display = booking.start_time_str.split(' ')[0];
            console.log('✅ Extracted date from start_time_str:', booking.booking_date_display);
        } else if (booking.start_time instanceof Date) {
            const year = booking.start_time.getFullYear();
            const month = String(booking.start_time.getMonth() + 1).padStart(2, '0');
            const day = String(booking.start_time.getDate()).padStart(2, '0');
            booking.booking_date_display = `${year}-${month}-${day}`;
            console.log('✅ Extracted date from start_time Date:', booking.booking_date_display);
        } else {
            console.error('❌ No valid booking_date found!');
            booking.booking_date_display = 'TBD';
        }
        
        // For START TIME: Use start_time
        if (booking.start_time_str && booking.start_time_str !== 'null' && booking.start_time_str !== '') {
            booking.start_time_display = booking.start_time_str;
            console.log('✅ Using start_time_str:', booking.start_time_display);
        } else if (booking.start_time instanceof Date) {
            const year = booking.start_time.getFullYear();
            const month = String(booking.start_time.getMonth() + 1).padStart(2, '0');
            const day = String(booking.start_time.getDate()).padStart(2, '0');
            const hours = String(booking.start_time.getHours()).padStart(2, '0');
            const minutes = String(booking.start_time.getMinutes()).padStart(2, '0');
            const seconds = String(booking.start_time.getSeconds()).padStart(2, '0');
            booking.start_time_display = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            console.log('✅ Converted start_time Date to string:', booking.start_time_display);
        } else if (booking.start_time && booking.start_time !== 'null' && booking.start_time !== '') {
            booking.start_time_display = String(booking.start_time);
            console.log('✅ Using original start_time:', booking.start_time_display);
        } else {
            console.error('❌ No valid start_time found!');
            booking.start_time_display = 'TBD';
        }
        
        // For END TIME: Use end_time
        if (booking.end_time_str && booking.end_time_str !== 'null' && booking.end_time_str !== '') {
            booking.end_time_display = booking.end_time_str;
            console.log('✅ Using end_time_str:', booking.end_time_display);
        } else if (booking.end_time instanceof Date) {
            const year = booking.end_time.getFullYear();
            const month = String(booking.end_time.getMonth() + 1).padStart(2, '0');
            const day = String(booking.end_time.getDate()).padStart(2, '0');
            const hours = String(booking.end_time.getHours()).padStart(2, '0');
            const minutes = String(booking.end_time.getMinutes()).padStart(2, '0');
            const seconds = String(booking.end_time.getSeconds()).padStart(2, '0');
            booking.end_time_display = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            console.log('✅ Converted end_time Date to string:', booking.end_time_display);
        } else if (booking.end_time && booking.end_time !== 'null' && booking.end_time !== '') {
            booking.end_time_display = String(booking.end_time);
            console.log('✅ Using original end_time:', booking.end_time_display);
        } else {
            console.error('❌ No valid end_time found!');
            booking.end_time_display = 'TBD';
        }
        
        // Set the values that will be used in email
        booking.start_time = booking.start_time_display;
        booking.end_time = booking.end_time_display;

        console.log('');
        console.log('📅 ========== BOOKING DATA FOR EMAIL ==========');
        console.log('   - Title:', booking.title);
        console.log('   - Booking Date:', booking.booking_date_display || 'N/A');
        console.log('   - Start Time:', booking.start_time, '(Type:', typeof booking.start_time, ')');
        console.log('   - End Time:', booking.end_time, '(Type:', typeof booking.end_time, ')');
        console.log('   - Place:', booking.place_name || '(no place)');
        console.log('   - Status:', booking.status);
        console.log('==========================================');
        console.log('');
        
        // Validate dates before proceeding
        if (!booking.start_time || booking.start_time === 'TBD' || !booking.end_time || booking.end_time === 'TBD') {
            console.error('⚠️ WARNING: Missing start_time or end_time in booking data!');
            console.error('   - start_time:', booking.start_time);
            console.error('   - end_time:', booking.end_time);
            console.error('   - booking_date:', booking.booking_date);
        }

        // Get participants based on provided IDs or all participants
        let participants = [];
        if (participantIds && participantIds.length > 0) {
            console.log('👥 Fetching SPECIFIC participants:', participantIds.length, 'participants');
            
            // Separate participants by type based on prefixed ID format
            // Frontend sends: 
            // - internal-{bookingId}-{userId}
            // - external-{participantId}
            // - responsible-{bookingId}
            const externalParticipantIds = []; // UUIDs from external_participants (after "external-" prefix)
            const internalUserIds = []; // User IDs extracted from "internal-{bookingId}-{userId}"
            let responsiblePersonNeeded = false;
            
            participantIds.forEach(id => {
                if (id.startsWith('responsible-')) {
                    // Format: responsible-{bookingId}
                    const extractedBookingId = id.replace('responsible-', '');
                    if (extractedBookingId === bookingId) {
                        responsiblePersonNeeded = true;
                        console.log('   🔍 Found responsible person ID:', id);
                        console.log('      - Extracted Booking ID:', extractedBookingId);
                    } else {
                        console.log('   ⚠️ WARNING: Responsible person booking ID mismatch:', extractedBookingId, 'vs', bookingId);
                    }
                } else if (id.startsWith('internal-')) {
                    // Format: internal-{bookingId}-{userId} OR internal-{bookingId}-{email}
                    // Parse: internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-0
                    // OR: internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-niroshmax01@gmail.com
                    const parts = id.split('-');
                    if (parts.length >= 3) {
                        // UUID has 5 parts, so format is: internal-{uuid-part1}-{uuid-part2}-{uuid-part3}-{uuid-part4}-{uuid-part5}-{identifier}
                        const identifier = parts[parts.length - 1]; // Last part is user ID or email
                        const extractedBookingId = parts.slice(1, -1).join('-'); // Everything between 'internal-' and last part
                        
                        // Check if identifier is a number (user ID) or email (contains @)
                        const isEmail = identifier.includes('@');
                        const isUserId = /^\d+$/.test(identifier);
                        
                        if (isEmail) {
                            internalUserIds.push({
                                email: identifier,
                                bookingId: extractedBookingId,
                                type: 'email'
                            });
                            console.log('   🔍 Found internal participant ID (by email):', id);
                            console.log('      - Extracted Email:', identifier);
                            console.log('      - Extracted Booking ID:', extractedBookingId);
                        } else if (isUserId) {
                            internalUserIds.push({
                                userId: identifier,
                                bookingId: extractedBookingId,
                                type: 'id'
                            });
                            console.log('   🔍 Found internal participant ID (by user ID):', id);
                            console.log('      - Extracted User ID:', identifier);
                            console.log('      - Extracted Booking ID:', extractedBookingId);
                        } else {
                            console.log('   ⚠️ WARNING: Invalid internal participant identifier (not user ID or email):', identifier);
                        }
                    } else {
                        console.log('   ⚠️ WARNING: Invalid internal participant ID format:', id);
                    }
                } else if (id.startsWith('external-')) {
                    // Format: external-{participantId}
                    const extractedParticipantId = id.replace('external-', '');
                    externalParticipantIds.push(extractedParticipantId);
                    console.log('   🔍 Found external participant ID:', id);
                    console.log('      - Extracted Participant ID:', extractedParticipantId);
                } else {
                    // Fallback: treat as external participant UUID (for backward compatibility)
                    externalParticipantIds.push(id);
                    console.log('   🔍 Found participant ID (no prefix, treating as external):', id);
                }
            });

            // Get external participants (UUIDs)
            if (externalParticipantIds.length > 0) {
                console.log('📌 Fetching', externalParticipantIds.length, 'external participants...');
                const participantQuery = `
                    SELECT 
                        ep.id,
                        ep.full_name,
                        ep.email,
                        ep.phone,
                        ep.company_name,
                        ep.booking_id
                    FROM external_participants ep
                    WHERE BINARY ep.booking_id = BINARY ? AND BINARY ep.id IN (${externalParticipantIds.map(() => '?').join(',')}) AND ep.is_deleted = 0
                `;
                const participantQueryResult = await executeQuery(participantQuery, [bookingId, ...externalParticipantIds]);
                if (!participantQueryResult.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error while fetching participants',
                        error: participantQueryResult.error
                    });
                }
                const externalParticipants = Array.isArray(participantQueryResult.data) ? participantQueryResult.data : [];
                participants.push(...externalParticipants);
                console.log('✅ Found', externalParticipants.length, 'external participants');
                externalParticipants.forEach((p, index) => {
                    console.log(`   ${index + 1}. ${p.full_name} (${p.email || 'NO EMAIL'}) - ID: ${p.id}`);
                });
            }

            // Get responsible person from booking (when responsible-{bookingId} is sent)
            if (responsiblePersonNeeded) {
                console.log('👤 Fetching responsible person from booking...');
                const responsiblePersonQuery = `
                    SELECT 
                        b.created_by as user_id,
                        u.id,
                        u.email,
                        CONCAT(pr.first_name, ' ', pr.last_name) as full_name,
                        pr.phone,
                        '' as company_name,
                        ? as booking_id,
                        'responsible' as participant_type
                    FROM bookings b
                    JOIN users u ON b.created_by = u.id
                    LEFT JOIN profiles pr ON u.id = pr.user_id
                    WHERE BINARY b.id = BINARY ?
                `;
                const responsibleResult = await executeQuery(responsiblePersonQuery, [bookingId, bookingId]);
                if (responsibleResult.success && responsibleResult.data && responsibleResult.data.length > 0) {
                    const responsiblePerson = responsibleResult.data[0];
                    // Create a participant-like object for the responsible person
                    const responsibleParticipant = {
                        id: `responsible-${bookingId}`, // Keep original format
                        full_name: responsiblePerson.full_name || responsiblePerson.email,
                        email: responsiblePerson.email,
                        phone: responsiblePerson.phone || null,
                        company_name: responsiblePerson.company_name || null,
                        booking_id: bookingId,
                        participant_type: 'responsible'
                    };
                    participants.push(responsibleParticipant);
                    console.log('✅ Found responsible person:', responsibleParticipant.full_name, `(${responsibleParticipant.email}) - User ID: ${responsiblePerson.user_id}`);
                } else {
                    console.log('⚠️ WARNING: Responsible person not found for this booking');
                }
            }

            // Get internal participants (users by user ID or email from internal-{bookingId}-{identifier})
            if (internalUserIds.length > 0) {
                console.log('🏢 Fetching', internalUserIds.length, 'internal participants (users)...');
                
                // Separate by ID and email
                const userIds = internalUserIds.filter(item => item.type === 'id').map(item => item.userId);
                const userEmails = internalUserIds.filter(item => item.type === 'email').map(item => item.email);
                
                let internalUsersResult = { success: true, data: [] };
                
                // Query by user IDs if any
                if (userIds.length > 0) {
                    console.log('   📋 Querying by user IDs:', userIds);
                    const internalUsersQueryById = `
                        SELECT 
                            u.id as user_id,
                            u.email,
                            CONCAT(pr.first_name, ' ', pr.last_name) as full_name,
                            pr.phone,
                            '' as company_name
                        FROM users u
                        LEFT JOIN profiles pr ON u.id = pr.user_id
                        WHERE u.id IN (${userIds.map(() => '?').join(',')})
                    `;
                    const resultById = await executeQuery(internalUsersQueryById, userIds);
                    if (resultById.success && resultById.data) {
                        internalUsersResult.data.push(...(Array.isArray(resultById.data) ? resultById.data : []));
                    }
                }
                
                // Query by emails if any
                if (userEmails.length > 0) {
                    console.log('   📧 Querying by emails:', userEmails);
                    const internalUsersQueryByEmail = `
                        SELECT 
                            u.id as user_id,
                            u.email,
                            CONCAT(pr.first_name, ' ', pr.last_name) as full_name,
                            pr.phone,
                            '' as company_name
                        FROM users u
                        LEFT JOIN profiles pr ON u.id = pr.user_id
                        WHERE u.email IN (${userEmails.map(() => '?').join(',')})
                    `;
                    const resultByEmail = await executeQuery(internalUsersQueryByEmail, userEmails);
                    if (resultByEmail.success && resultByEmail.data) {
                        internalUsersResult.data.push(...(Array.isArray(resultByEmail.data) ? resultByEmail.data : []));
                    }
                }
                
                if (internalUsersResult.data && internalUsersResult.data.length > 0) {
                    // Map internal users to participant format
                    internalUsersResult.data.forEach(user => {
                        // Find matching internal data by user ID or email
                        const internalData = internalUserIds.find(item => 
                            (item.type === 'id' && item.userId == user.user_id) ||
                            (item.type === 'email' && item.email === user.email)
                        );
                        
                        // Determine the identifier to use in the ID
                        const identifier = internalData 
                            ? (internalData.type === 'email' ? internalData.email : internalData.userId)
                            : user.user_id.toString();
                        
                        const internalParticipant = {
                            id: internalData 
                                ? `internal-${internalData.bookingId}-${identifier}` 
                                : `internal-${bookingId}-${user.user_id}`, // Keep original format
                            full_name: user.full_name || user.email,
                            email: user.email,
                            phone: user.phone || null,
                            company_name: user.company_name || null,
                            booking_id: internalData ? internalData.bookingId : bookingId,
                            participant_type: 'internal'
                        };
                        participants.push(internalParticipant);
                        console.log(`✅ Found internal participant: ${internalParticipant.full_name} (${internalParticipant.email}) - User ID: ${user.user_id}`);
                    });
                } else {
                    const notFoundIds = userIds.length > 0 ? `User IDs: ${userIds.join(', ')}` : '';
                    const notFoundEmails = userEmails.length > 0 ? `Emails: ${userEmails.join(', ')}` : '';
                    console.log('⚠️ WARNING: Could not find internal participants for', notFoundIds, notFoundEmails);
                }
            }
        } else {
            console.log('👥 Fetching ALL participants for this booking');
            // Get all participants for this booking
            const participantQueryResult = await executeQuery(
                `SELECT 
                    ep.id,
                    ep.full_name,
                    ep.email,
                    ep.phone,
                    ep.company_name,
                    ep.booking_id
                FROM external_participants ep
                WHERE BINARY ep.booking_id = BINARY ? AND ep.is_deleted = 0`,
                [bookingId]
            );
            if (!participantQueryResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error while fetching participants',
                    error: participantQueryResult.error
                });
            }
            participants = Array.isArray(participantQueryResult.data) ? participantQueryResult.data : [];
            console.log('✅ Found', participants.length, 'total participants');
            participants.forEach((p, index) => {
                console.log(`   ${index + 1}. ${p.full_name} (${p.email || 'NO EMAIL'}) - ID: ${p.id}`);
            });
        }

        if (participants.length === 0) {
            console.log('❌ ERROR: No participants found for this booking');
            return res.status(400).json({
                success: false,
                message: 'No participants found for this booking'
            });
        }

        console.log('📤 Starting to send emails to', participants.length, 'participants...');
        console.log('');

        // Send emails to participants
        const emailPromises = participants.map(async (participant, index) => {
            try {
                console.log(`📧 [${index + 1}/${participants.length}] Processing: ${participant.full_name}`);
                console.log(`   📬 Sending to: ${participant.email}`);
                console.log(`   📅 Start Time (raw):`, booking.start_time, 'Type:', typeof booking.start_time);
                console.log(`   📅 End Time (raw):`, booking.end_time, 'Type:', typeof booking.end_time);
                
                if (!participant.email) {
                    console.log(`   ❌ SKIPPED: No email address for ${participant.full_name}`);
                    return {
                        participantId: participant.id,
                        participantName: participant.full_name,
                        success: false,
                        message: 'No email address provided'
                    };
                }

                console.log(`   📬 Sending to: ${participant.email}`);
                
                // Generate email content based on type
                const emailContent = generateEmailContent(booking, participant, emailType, customMessage);
                
                console.log('');
                console.log('📧 ========== EMAIL CONTENT ==========');
                console.log('   To:', participant.email);
                console.log('   Subject:', emailContent.subject);
                console.log('   Email Type:', emailType);
                console.log('');
                console.log('   📝 HTML Body (first 500 chars):');
                console.log('   ' + emailContent.html.substring(0, 500) + '...');
                console.log('');
                console.log('   📄 Text Body:');
                console.log('   ' + emailContent.text.replace(/\n/g, '\n   '));
                console.log('==========================================');
                console.log('');
                
                // Validate email service before sending
                if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                    const errorMsg = 'Email service not configured. Please set SMTP_USER and SMTP_PASS in config.env';
                    console.error(`   ❌ FAILED: ${errorMsg}`);
                    return {
                        participantId: participant.id,
                        participantName: participant.full_name,
                        participantEmail: participant.email,
                        success: false,
                        message: errorMsg
                    };
                }

                // Send email
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });

                if (emailResult.success) {
                    console.log(`   ✅ SUCCESS: Email sent to ${participant.email} (Message ID: ${emailResult.messageId || 'N/A'})`);
                } else {
                    console.error(`   ❌ FAILED: ${emailResult.error || 'Unknown error'}`);
                    // Log more details for debugging
                    if (emailResult.error) {
                        console.error(`      Error details:`, emailResult.error);
                    }
                }

                return {
                    participantId: participant.id,
                    participantName: participant.full_name,
                    participantEmail: participant.email,
                    success: emailResult.success,
                    message: emailResult.success 
                        ? 'Email sent successfully' 
                        : (emailResult.error || 'Failed to send email'),
                    error: emailResult.success ? undefined : (emailResult.error || 'Unknown error')
                };
            } catch (error) {
                console.error(`   ❌ ERROR sending email to ${participant.email}:`, error.message);
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
        
        console.log('');
        console.log('📊 Email Sending Summary:');

        // Log email sending activity
        const logResult = await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [bookingId, userId, emailType, participants.length, JSON.stringify(results)]
        );
        
        if (!logResult.success) {
            console.error('Failed to log email activity:', logResult.error);
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log('   ✅ Successful:', successCount);
        console.log('   ❌ Failed:', failureCount);
        console.log('   📧 Total Processed:', results.length);
        console.log('==========================================');
        console.log('');

        // Prepare detailed response with error information
        const failedEmails = results.filter(r => !r.success).map(r => ({
            participant: r.participantName,
            email: r.participantEmail,
            error: r.error || r.message
        }));

        res.json({
            success: failureCount === 0, // Only true if all emails sent successfully
            message: failureCount === 0 
                ? `All emails sent successfully to ${successCount} participant(s)` 
                : `Email sending completed. ${successCount} successful, ${failureCount} failed.`,
            data: {
                bookingId,
                bookingTitle: booking.title,
                totalParticipants: participants.length,
                emailsSent: successCount,
                emailsFailed: failureCount,
                results: results,
                failedEmails: failedEmails.length > 0 ? failedEmails : undefined
            },
            error: failureCount > 0 ? `Failed to send ${failureCount} email(s). Check server logs for details.` : undefined
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

        // Get booking details with properly formatted dates
        // Fetching: booking_date, start_time, end_time from bookings table
        const bookingQueryResult = await executeQuery(
            `SELECT 
                b.id,
                b.title,
                b.description,
                b.place_id,
                b.created_by,
                b.status,
                b.is_deleted,
                b.created_at,
                b.updated_at,
                -- Date and time columns from bookings table
                b.booking_date,
                b.start_time,
                b.end_time,
                -- Formatted versions
                CASE 
                    WHEN b.booking_date IS NOT NULL 
                    THEN DATE_FORMAT(b.booking_date, '%Y-%m-%d') 
                    ELSE NULL 
                END as booking_date_str,
                CASE 
                    WHEN b.start_time IS NOT NULL 
                    THEN DATE_FORMAT(b.start_time, '%Y-%m-%d %H:%i:%s') 
                    ELSE NULL 
                END as start_time_str,
                CASE 
                    WHEN b.end_time IS NOT NULL 
                    THEN DATE_FORMAT(b.end_time, '%Y-%m-%d %H:%i:%s') 
                    ELSE NULL 
                END as end_time_str,
                -- Place information
                p.name as place_name,
                p.address as place_address,
                p.phone as place_phone,
                p.email as place_email
             FROM bookings b
             LEFT JOIN places p ON BINARY b.place_id = BINARY p.id
             WHERE BINARY b.id = BINARY ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (!bookingQueryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: bookingQueryResult.error
            });
        }

        if (bookingQueryResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingQueryResult.data[0];
        
        console.log('');
        console.log('📋 ========== REMINDER EMAIL - BOOKING DATA ==========');
        console.log('   - booking_date:', booking.booking_date, '(Type:', typeof booking.booking_date, ')');
        console.log('   - start_time:', booking.start_time, '(Type:', typeof booking.start_time, ')');
        console.log('   - end_time:', booking.end_time, '(Type:', typeof booking.end_time, ')');
        console.log('   - booking_date_str:', booking.booking_date_str);
        console.log('   - start_time_str:', booking.start_time_str);
        console.log('   - end_time_str:', booking.end_time_str);
        console.log('==========================================');
        console.log('');
        
        // Set display values (same logic as booking details)
        if (booking.start_time_str && booking.start_time_str !== 'null' && booking.start_time_str !== '') {
            booking.start_time = booking.start_time_str;
        } else if (booking.start_time instanceof Date) {
            const year = booking.start_time.getFullYear();
            const month = String(booking.start_time.getMonth() + 1).padStart(2, '0');
            const day = String(booking.start_time.getDate()).padStart(2, '0');
            const hours = String(booking.start_time.getHours()).padStart(2, '0');
            const minutes = String(booking.start_time.getMinutes()).padStart(2, '0');
            const seconds = String(booking.start_time.getSeconds()).padStart(2, '0');
            booking.start_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else if (booking.start_time) {
            booking.start_time = String(booking.start_time);
        }
        
        if (booking.end_time_str && booking.end_time_str !== 'null' && booking.end_time_str !== '') {
            booking.end_time = booking.end_time_str;
        } else if (booking.end_time instanceof Date) {
            const year = booking.end_time.getFullYear();
            const month = String(booking.end_time.getMonth() + 1).padStart(2, '0');
            const day = String(booking.end_time.getDate()).padStart(2, '0');
            const hours = String(booking.end_time.getHours()).padStart(2, '0');
            const minutes = String(booking.end_time.getMinutes()).padStart(2, '0');
            const seconds = String(booking.end_time.getSeconds()).padStart(2, '0');
            booking.end_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else if (booking.end_time) {
            booking.end_time = String(booking.end_time);
        }

        // Get all participants
        const participantQueryResult = await executeQuery(
            `SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name
            FROM external_participants ep
            WHERE BINARY ep.booking_id = BINARY ? AND ep.is_deleted = 0 AND ep.email IS NOT NULL`,
            [bookingId]
        );

        if (!participantQueryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error while fetching participants',
                error: participantQueryResult.error
            });
        }

        const participants = Array.isArray(participantQueryResult.data) ? participantQueryResult.data : [];

        if (participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants with email addresses found'
            });
        }

        // Send reminder emails
        const emailPromises = participants.map(async (participant) => {
            try {
                const emailContent = generateReminderEmailContent(booking, participant, reminderType, customMessage);
                
                console.log('');
                console.log('📧 ========== REMINDER EMAIL CONTENT ==========');
                console.log('   To:', participant.email);
                console.log('   Subject:', emailContent.subject);
                console.log('   Reminder Type:', reminderType);
                console.log('');
                console.log('   📝 HTML Body (first 500 chars):');
                console.log('   ' + emailContent.html.substring(0, 500) + '...');
                console.log('');
                console.log('   📄 Text Body:');
                console.log('   ' + emailContent.text.replace(/\n/g, '\n   '));
                console.log('==========================================');
                console.log('');
                
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
        const logResult = await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [bookingId, userId, `reminder_${reminderType}`, participants.length, JSON.stringify(results)]
        );
        
        if (!logResult.success) {
            console.error('Failed to log reminder activity:', logResult.error);
        }

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
        const bookingQueryResult = await executeQuery(
            `SELECT b.id, b.title, b.start_time, b.end_time, p.name as place_name
             FROM bookings b
             LEFT JOIN places p ON BINARY b.place_id = BINARY p.id
             WHERE BINARY b.id = BINARY ? AND b.is_deleted = 0`,
            [bookingId]
        );

        if (!bookingQueryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: bookingQueryResult.error
            });
        }

        if (bookingQueryResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Get external participants
        const participantQueryResult = await executeQuery(
            `SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name,
                CASE WHEN ep.email IS NOT NULL AND ep.email != '' THEN 1 ELSE 0 END as has_email,
                'external' as participant_type
            FROM external_participants ep
            WHERE BINARY ep.booking_id = BINARY ? AND ep.is_deleted = 0
            ORDER BY ep.full_name`,
            [bookingId]
        );

        if (!participantQueryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error while fetching participants',
                error: participantQueryResult.error
            });
        }

        let participants = Array.isArray(participantQueryResult.data) ? participantQueryResult.data : [];

        // Get responsible person from booking (created_by)
        const responsiblePersonQuery = `
            SELECT 
                ? as id,
                u.email,
                CONCAT(pr.first_name, ' ', pr.last_name) as full_name,
                pr.phone,
                '' as company_name,
                CASE WHEN u.email IS NOT NULL AND u.email != '' THEN 1 ELSE 0 END as has_email,
                'responsible' as participant_type
            FROM bookings b
            JOIN users u ON b.created_by = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE BINARY b.id = BINARY ?
        `;
        const responsiblePersonResult = await executeQuery(responsiblePersonQuery, [`responsible-${bookingId}`, bookingId]);
        
        if (responsiblePersonResult.success && responsiblePersonResult.data && responsiblePersonResult.data.length > 0) {
            const responsiblePerson = responsiblePersonResult.data[0];
            // Add responsible person to the beginning of the participants list
            participants.unshift(responsiblePerson);
        }

        // Note: Internal participants are typically fetched only when explicitly requested via participantIds
        // They are not included in the "all participants" list by default

        res.json({
            success: true,
            message: 'Booking participants retrieved successfully',
            data: {
                booking: bookingQueryResult.data[0],
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

        const emailHistoryResult = await executeQuery(
            `SELECT 
                bel.*,
                CONCAT(pr.first_name, ' ', pr.last_name) as sent_by_name,
                u.email as sent_by_email
            FROM booking_email_logs bel
            LEFT JOIN users u ON bel.sent_by = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE BINARY bel.booking_id = BINARY ?
            ORDER BY bel.sent_at DESC`,
            [bookingId]
        );

        if (!emailHistoryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: emailHistoryResult.error
            });
        }

        const emailHistory = Array.isArray(emailHistoryResult.data) ? emailHistoryResult.data : [];

        res.json({
            success: true,
            message: 'Email history retrieved successfully',
            data: {
                bookingId,
                emailHistory: emailHistory,
                totalEmailsSent: emailHistory ? emailHistory.length : 0
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
    console.log('📧 generateEmailContent - booking.start_time:', booking.start_time, 'Type:', typeof booking.start_time);
    console.log('📧 generateEmailContent - booking.end_time:', booking.end_time, 'Type:', typeof booking.end_time);
    
    const formatDate = (dateInput) => {
        console.log('🔍 formatDate called with:', dateInput, 'Type:', typeof dateInput, 'Is Date:', dateInput instanceof Date);
        
        // First, just return the raw value to see what we have
        if (!dateInput) {
            console.error('❌ formatDate: dateInput is null or undefined');
            return dateInput ? String(dateInput) : 'TBD';
        }
        
        // Return raw value as string - no formatting
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        
        console.log('✅ formatDate returning raw value:', rawValue);
        return rawValue;
    };

    const formatTime = (dateInput) => {
        console.log('🔍 formatTime called with:', dateInput, 'Type:', typeof dateInput, 'Is Date:', dateInput instanceof Date);
        
        // First, just return the raw value to see what we have
        if (!dateInput) {
            console.error('❌ formatTime: dateInput is null or undefined');
            return dateInput ? String(dateInput) : 'TBD';
        }
        
        // Return raw value as string - no formatting
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        
        console.log('✅ formatTime returning raw value:', rawValue);
        return rawValue;
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
            text = `
                Booking Confirmed - ${booking.title}
                
                Dear ${participant.full_name},
                
                Your booking has been confirmed!
                
                ${booking.title}
                Date: ${formatDate(booking.start_time)}
                Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}
                Location: ${booking.place_name || 'TBD'}
                
                ${customMessage ? `Additional Information: ${customMessage}` : ''}
                
                We look forward to seeing you!
                
                Best regards,
                Booking Management Team
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
    const formatDate = (dateInput) => {
        console.log('🔍 formatDate (reminder) called with:', dateInput, 'Type:', typeof dateInput, 'Is Date:', dateInput instanceof Date);
        
        // Return raw value as string - no formatting
        if (!dateInput) {
            console.error('❌ formatDate: dateInput is null or undefined');
            return dateInput ? String(dateInput) : 'TBD';
        }
        
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        
        console.log('✅ formatDate (reminder) returning raw value:', rawValue);
        return rawValue;
    };

    const formatTime = (dateInput) => {
        console.log('🔍 formatTime (reminder) called with:', dateInput, 'Type:', typeof dateInput, 'Is Date:', dateInput instanceof Date);
        
        // Return raw value as string - no formatting
        if (!dateInput) {
            console.error('❌ formatTime: dateInput is null or undefined');
            return dateInput ? String(dateInput) : 'TBD';
        }
        
        const rawValue = dateInput instanceof Date 
            ? dateInput.toISOString() 
            : String(dateInput);
        
        console.log('✅ formatTime (reminder) returning raw value:', rawValue);
        return rawValue;
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

/**
 * Download calendar file (ICS or CSV) for a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadCalendarFile = async (req, res) => {
    try {
        const {
            meetingName,
            date,
            startTime,
            endTime,
            place = '',
            description = '',
            format = 'ics' // 'ics' or 'csv'
        } = req.body;

        // Validate required fields
        if (!meetingName || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: meetingName, date, startTime, endTime'
            });
        }

        const calendarData = {
            meetingName,
            date,
            startTime,
            endTime,
            place,
            description
        };

        let fileContent, filename, contentType;

        if (format === 'csv') {
            fileContent = generateCSVFromFrontend(calendarData);
            filename = `${meetingName.replace(/[^a-z0-9]/gi, '_')}_${date}.csv`;
            contentType = 'text/csv';
        } else {
            // Default to ICS
            fileContent = generateICSFromFrontend(calendarData);
            filename = `${meetingName.replace(/[^a-z0-9]/gi, '_')}_${date}.ics`;
            contentType = 'text/calendar; charset=utf-8';
        }

        // Set response headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));

        // Send file content
        res.send(fileContent);

    } catch (error) {
        console.error('Error generating calendar file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate calendar file',
            error: error.message
        });
    }
};

module.exports = {
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingParticipants,
    getBookingEmailHistory,
    sendBookingEmailFromFrontend,
    downloadCalendarFile
};


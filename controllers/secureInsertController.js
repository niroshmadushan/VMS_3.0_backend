const { executeQuery } = require('../config/database');
const {
    canAccessTable,
    canPerformOperation,
    getAllowedColumns,
    getPaginationLimits
} = require('../config/permissions');
const { sendEmail } = require('../services/emailService');
const { generateICSFromFrontend } = require('../services/calendarService');

/**
 * Helper function to send booking confirmation emails automatically
 * This runs asynchronously and doesn't block the response
 * Includes retry mechanism in case participants are added after booking creation
 */
const sendBookingConfirmationEmails = async (bookingId, userId, retryCount = 0, maxRetries = 3) => {
    try {
        console.log(`📧 [AUTO EMAIL] Checking for participants to send booking confirmation emails... (Attempt ${retryCount + 1}/${maxRetries + 1})`);

        // Get booking details
        const bookingQuery = `
            SELECT 
                b.id,
                b.title,
                b.description,
                b.place_id,
                b.start_time,
                b.end_time,
                b.status,
                DATE(b.start_time) as booking_date,
                p.name as place_name,
                p.address as place_address
            FROM bookings b
            LEFT JOIN places p ON BINARY b.place_id = BINARY p.id
            WHERE BINARY b.id = BINARY ? AND b.is_deleted = 0
        `;

        const bookingResult = await executeQuery(bookingQuery, [bookingId]);

        if (!bookingResult.success || !bookingResult.data || bookingResult.data.length === 0) {
            console.log(`📧 [AUTO EMAIL] Booking not found: ${bookingId}`);
            return;
        }

        const booking = bookingResult.data[0];

        // Get external participants with email addresses
        const participantQuery = `
            SELECT 
                ep.id,
                ep.full_name,
                ep.email,
                ep.phone,
                ep.company_name
            FROM external_participants ep
            WHERE BINARY ep.booking_id = BINARY ? 
            AND ep.is_deleted = 0 
            AND ep.email IS NOT NULL 
            AND ep.email != ''
        `;

        const participantResult = await executeQuery(participantQuery, [bookingId]);

        if (!participantResult.success || !participantResult.data || participantResult.data.length === 0) {
            // If no participants found and we haven't exceeded max retries, retry after a delay
            if (retryCount < maxRetries) {
                console.log(`📧 [AUTO EMAIL] No participants found yet. Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                return sendBookingConfirmationEmails(bookingId, userId, retryCount + 1, maxRetries);
            } else {
                console.log(`📧 [AUTO EMAIL] No participants with email addresses found for booking ${bookingId} after ${maxRetries + 1} attempts`);
                return;
            }
        }

        const participants = participantResult.data;
        console.log(`📧 [AUTO EMAIL] Found ${participants.length} participants with emails for booking: ${booking.title}`);

        // Validate email service configuration
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('📧 [AUTO EMAIL] Email service not configured! Please set SMTP_USER and SMTP_PASS in config.env');
            return;
        }

        // Send emails to all participants
        const emailPromises = participants.map(async (participant) => {
            try {
                // Generate email content
                const subject = `Booking Confirmation - ${booking.title}`;
                const formatDateTime = (dateTime) => {
                    if (!dateTime) return 'TBD';
                    const d = new Date(dateTime);
                    return d.toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
                            .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
                            .detail-row { margin: 10px 0; }
                            .label { font-weight: bold; color: #495057; }
                            .value { color: #6c757d; }
                            .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>✅ Booking Confirmed</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${participant.full_name},</p>
                                <p>Your booking has been confirmed. Here are the details:</p>
                                
                                <div class="booking-details">
                                    <h3>${booking.title}</h3>
                                    <div class="detail-row">
                                        <span class="label">📅 Date & Time:</span>
                                        <span class="value">${formatDateTime(booking.start_time)} - ${formatDateTime(booking.end_time)}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="label">📍 Location:</span>
                                        <span class="value">${booking.place_name || 'TBD'}</span>
                                    </div>
                                    ${booking.place_address ? `
                                    <div class="detail-row">
                                        <span class="label">📍 Address:</span>
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
                                
                                <p>We look forward to seeing you!</p>
                                
                                <p>Best regards,<br>Booking Management Team</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated confirmation email. Please do not reply to this email.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                const text = `
                    Booking Confirmation - ${booking.title}
                    
                    Dear ${participant.full_name},
                    
                    Your booking has been confirmed. Here are the details:
                    
                    ${booking.title}
                    Date & Time: ${formatDateTime(booking.start_time)} - ${formatDateTime(booking.end_time)}
                    Location: ${booking.place_name || 'TBD'}
                    ${booking.place_address ? `Address: ${booking.place_address}` : ''}
                    ${booking.description ? `Description: ${booking.description}` : ''}
                    
                    We look forward to seeing you!
                    
                    Best regards,
                    Booking Management Team
                `;

                // Send email
                const emailResult = await sendEmail({
                    to: participant.email,
                    subject: subject,
                    html: html,
                    text: text
                });

                if (emailResult.success) {
                    console.log(`   ✅ [AUTO EMAIL] Email sent successfully to ${participant.email} (Message ID: ${emailResult.messageId || 'N/A'})`);
                } else {
                    console.error(`   ❌ [AUTO EMAIL] Failed to send email to ${participant.email}`);
                    console.error(`      Error: ${emailResult.error || 'Unknown error'}`);
                    // Log full error details for debugging
                    if (emailResult.errorDetails) {
                        console.error(`      Details:`, emailResult.errorDetails);
                    }
                }

                return {
                    participantId: participant.id,
                    participantEmail: participant.email,
                    success: emailResult.success,
                    message: emailResult.message || 'Email sent successfully'
                };
            } catch (error) {
                console.error(`   ❌ [AUTO EMAIL] Error sending email to ${participant.email}:`, error.message);
                return {
                    participantId: participant.id,
                    participantEmail: participant.email,
                    success: false,
                    message: error.message
                };
            }
        });

        const results = await Promise.all(emailPromises);

        // Log email sending activity
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`📧 [AUTO EMAIL] Email sending completed: ${successCount} sent, ${failCount} failed`);

        // Log to booking_email_logs table
        await executeQuery(
            `INSERT INTO booking_email_logs 
             (booking_id, sent_by, email_type, participants_count, sent_at, results)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [bookingId, userId, 'booking_confirmation', participants.length, JSON.stringify(results)]
        );

    } catch (error) {
        console.error('📧 [AUTO EMAIL] Error in sendBookingConfirmationEmails:', error);
        // Don't throw - this is a background process
    }
};

// Secure INSERT Controller
const secureInsert = async (req, res) => {
    try {
        const { tableName } = req.params;
        const insertData = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;

        // Validate table name
        if (!tableName || typeof tableName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid table name'
            });
        }

        // Check if user can access this table
        if (!canAccessTable(userRole, tableName)) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to access table: ${tableName}`
            });
        }

        // Check if user can perform INSERT operation on this table
        if (!canPerformOperation(userRole, tableName, 'create')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to INSERT into table: ${tableName}`
            });
        }

        // Validate insert data
        if (!insertData || typeof insertData !== 'object' || Object.keys(insertData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Insert data is required'
            });
        }

        // Get allowed columns for this role and table
        const allowedColumns = getAllowedColumns(userRole, tableName);

        // If no specific columns are allowed, deny access
        if (allowedColumns.length === 0) {
            return res.status(403).json({
                success: false,
                message: `Access denied - No columns accessible for role: ${userRole}`
            });
        }

        // Filter insert data to only include allowed columns
        const filteredData = {};
        const invalidColumns = [];

        for (const [column, value] of Object.entries(insertData)) {
            if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
                filteredData[column] = value;
            } else {
                invalidColumns.push(column);
            }
        }

        // If there are invalid columns and user doesn't have wildcard access
        if (invalidColumns.length > 0 && !allowedColumns.includes('*')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - Invalid columns for your role: ${invalidColumns.join(', ')}`
            });
        }

        // Add audit fields only if they exist in allowed columns
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (allowedColumns.includes('*') || allowedColumns.includes('created_at')) {
            filteredData.created_at = now;
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('updated_at')) {
            filteredData.updated_at = now;
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('created_by')) {
            filteredData.created_by = String(userId);
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('updated_by')) {
            filteredData.updated_by = String(userId);
        }

        // Build INSERT query
        const columns = Object.keys(filteredData);
        const values = Object.values(filteredData);
        const placeholders = columns.map(() => '?').join(', ');

        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        console.log(`[SECURE INSERT] User ${userId} (${userRole}) inserting into table: ${tableName}`);
        console.log(`[SECURE INSERT] Columns: ${columns.join(', ')}`);

        // Execute insert query
        const result = await executeQuery(insertQuery, values);

        if (result.success) {
            // Get the inserted record ID
            // For UUID tables (like bookings), the ID is in the insertData, not insertId
            let recordId = result.data.insertId;

            // If no insertId (UUID tables), try to get ID from filteredData or insertData
            if (!recordId || recordId === 0) {
                recordId = filteredData.id || insertData.id;
            }

            // Get the inserted record
            let insertedRecord = null;
            if (recordId) {
                const selectQuery = `SELECT * FROM ${tableName} WHERE BINARY id = BINARY ?`;
                const recordResult = await executeQuery(selectQuery, [recordId]);
                if (recordResult.success && recordResult.data && recordResult.data.length > 0) {
                    insertedRecord = recordResult.data[0];
                    // Use the ID from the database record if we didn't have it before
                    if (!recordId) {
                        recordId = insertedRecord.id;
                    }
                }
            }

            // If this is a booking creation, automatically send confirmation emails
            if (tableName === 'bookings' && recordId) {
                console.log(`📧 [AUTO EMAIL] Booking created with ID: ${recordId}, triggering automatic email sending...`);
                // Run email sending in background (don't await - non-blocking)
                sendBookingConfirmationEmails(recordId, userId).catch(error => {
                    console.error('📧 [AUTO EMAIL] Background email sending failed:', error);
                });
            }

            // If this is an external_participant creation, automatically send confirmation emails for the booking
            if (tableName === 'external_participants' && filteredData.booking_id) {
                const bookingId = filteredData.booking_id;
                console.log(`📧 [AUTO EMAIL] Participant added to booking ${bookingId}, triggering automatic email sending...`);
                // Run email sending in background (don't await - non-blocking)
                sendBookingConfirmationEmails(bookingId, userId).catch(error => {
                    console.error('📧 [AUTO EMAIL] Background email sending failed:', error);
                });
            }

            return res.status(201).json({
                success: true,
                message: `Record inserted successfully into ${tableName}`,
                data: {
                    id: recordId,
                    record: insertedRecord,
                    insertedColumns: columns,
                    filteredColumns: allowedColumns.includes('*') ? 'all' : allowedColumns
                },
                meta: {
                    table: tableName,
                    role: userRole,
                    operation: 'insert',
                    timestamp: now
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to insert record',

            });
        }

    } catch (error) {
        console.error('Secure Insert Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during insert operation'
        });
    }
};

// Bulk INSERT Controller
const secureBulkInsert = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { data } = req.body; // Array of objects
        const userRole = req.user.role;
        const userId = req.user.id;

        // Validate table name
        if (!tableName || typeof tableName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid table name'
            });
        }

        // Check if user can access this table
        if (!canAccessTable(userRole, tableName)) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to access table: ${tableName}`
            });
        }

        // Check if user can perform INSERT operation on this table
        if (!canPerformOperation(userRole, tableName, 'create')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to INSERT into table: ${tableName}`
            });
        }

        // Validate bulk data
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk insert data array is required'
            });
        }

        // Get allowed columns for this role and table
        const allowedColumns = getAllowedColumns(userRole, tableName);

        if (allowedColumns.length === 0) {
            return res.status(403).json({
                success: false,
                message: `Access denied - No columns accessible for role: ${userRole}`
            });
        }

        // Filter and validate each record
        const filteredRecords = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            if (!record || typeof record !== 'object') {
                errors.push(`Record ${i + 1}: Invalid object`);
                continue;
            }

            const filteredData = {};
            const invalidColumns = [];

            for (const [column, value] of Object.entries(record)) {
                if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
                    filteredData[column] = value;
                } else {
                    invalidColumns.push(column);
                }
            }

            if (invalidColumns.length > 0 && !allowedColumns.includes('*')) {
                errors.push(`Record ${i + 1}: Invalid columns - ${invalidColumns.join(', ')}`);
                continue;
            }

            // Add audit fields only if they exist in allowed columns
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            if (allowedColumns.includes('*') || allowedColumns.includes('created_at')) {
                filteredData.created_at = now;
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('updated_at')) {
                filteredData.updated_at = now;
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('created_by')) {
                filteredData.created_by = String(userId);
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('updated_by')) {
                filteredData.updated_by = String(userId);
            }

            filteredRecords.push(filteredData);
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors in bulk data',
                errors: errors
            });
        }

        if (filteredRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid records to insert'
            });
        }

        // Build bulk INSERT query
        const columns = Object.keys(filteredRecords[0]);
        const placeholders = `(${columns.map(() => '?').join(', ')})`;
        const valuesPlaceholders = filteredRecords.map(() => placeholders).join(', ');

        const bulkInsertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valuesPlaceholders}`;
        const allValues = filteredRecords.flatMap(record => Object.values(record));

        console.log(`[SECURE BULK INSERT] User ${userId} (${userRole}) bulk inserting ${filteredRecords.length} records into table: ${tableName}`);

        // Execute bulk insert query
        const result = await executeQuery(bulkInsertQuery, allValues);

        if (result.success) {
            return res.status(201).json({
                success: true,
                message: `Bulk insert completed successfully - ${filteredRecords.length} records inserted into ${tableName}`,
                data: {
                    insertedCount: filteredRecords.length,
                    firstInsertId: result.data.insertId,
                    lastInsertId: result.data.insertId + filteredRecords.length - 1,
                    columns: columns
                },
                meta: {
                    table: tableName,
                    role: userRole,
                    operation: 'bulk_insert',
                    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to perform bulk insert',

            });
        }

    } catch (error) {
        console.error('Secure Bulk Insert Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk insert operation'
        });
    }
};

module.exports = {
    secureInsert,
    secureBulkInsert
};

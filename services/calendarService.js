/**
 * Calendar Service
 * Generates ICS (iCalendar) files for Google Calendar, Microsoft Outlook, Apple Calendar, etc.
 */

/**
 * Escape special characters in ICS content
 */
function escapeICS(text) {
    if (!text) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(dateInput, timezone = 'UTC') {
    let date;
    
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        // Handle various date formats
        // Format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS" or ISO string
        const dateStr = dateInput.replace(' ', 'T');
        date = new Date(dateStr);
        
        // If timezone is not UTC, convert to UTC
        if (timezone !== 'UTC' && !dateStr.includes('Z')) {
            // For now, assume local time if no timezone specified
            // You can enhance this with timezone conversion if needed
        }
    } else {
        throw new Error('Invalid date format');
    }
    
    // Convert to UTC and format as ICS
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS file content for a booking event
 * @param {Object} booking - Booking object
 * @param {Object} options - Additional options
 * @returns {String} ICS file content
 */
function generateICS(booking, options = {}) {
    const {
        organizerEmail = 'noreply@booking-system.com',
        organizerName = 'Booking Management System',
        location = '',
        description = '',
        url = '',
        timezone = 'UTC',
        method = 'REQUEST' // REQUEST, PUBLISH, CANCEL
    } = options;
    
    // Extract booking details
    const title = booking.title || booking.meetingName || 'Meeting';
    const startTime = booking.start_time || booking.startTime;
    const endTime = booking.end_time || booking.endTime;
    const place = booking.place_name || booking.place || location;
    const desc = booking.description || description || '';
    const bookingUrl = booking.url || url || '';
    
    // Format dates
    const dtStart = formatICSDate(startTime, timezone);
    const dtEnd = formatICSDate(endTime, timezone);
    const dtStamp = formatICSDate(new Date(), timezone);
    
    // Generate unique ID
    const uid = booking.id || `booking-${Date.now()}@booking-system.com`;
    
    // Build ICS content
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Booking Management System//Calendar Service//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:' + method,
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + dtStamp,
        'DTSTART:' + dtStart,
        'DTEND:' + dtEnd,
        'SUMMARY:' + escapeICS(title),
        'DESCRIPTION:' + escapeICS(desc),
        'LOCATION:' + escapeICS(place),
        'ORGANIZER;CN=' + escapeICS(organizerName) + ':MAILTO:' + organizerEmail,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        ...(bookingUrl ? ['URL:' + bookingUrl] : []),
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: ' + escapeICS(title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
    
    return ics;
}

/**
 * Generate ICS file from frontend data
 * @param {Object} data - Frontend booking data
 * @param {Object} options - Additional options
 * @returns {String} ICS file content
 */
function generateICSFromFrontend(data, options = {}) {
    const {
        meetingName,
        date,
        startTime,
        endTime,
        place = '',
        description = '',
        participantEmails = [],
        organizerEmail,
        organizerName = 'Booking Management System',
        url = '',
        timezone = 'UTC'
    } = data;
    
    // Combine date and time
    const startDateTime = `${date} ${startTime}`;
    const endDateTime = `${date} ${endTime}`;
    
    // Create booking object
    const booking = {
        title: meetingName,
        description: description,
        place_name: place,
        start_time: startDateTime,
        end_time: endDateTime,
        id: `frontend-booking-${Date.now()}`
    };
    
    // Use first participant as organizer if not provided
    const orgEmail = organizerEmail || (participantEmails && participantEmails.length > 0 ? participantEmails[0] : 'noreply@booking-system.com');
    
    return generateICS(booking, {
        organizerEmail: orgEmail,
        organizerName: organizerName,
        location: place,
        description: description,
        url: url,
        timezone: timezone
    });
}

/**
 * Generate CSV file for calendar import (alternative to ICS)
 * @param {Object} booking - Booking object
 * @returns {String} CSV file content
 */
function generateCSV(booking) {
    const title = booking.title || booking.meetingName || 'Meeting';
    const startTime = booking.start_time || booking.startTime;
    const endTime = booking.end_time || booking.endTime;
    const place = booking.place_name || booking.place || '';
    const description = booking.description || '';
    
    // Format dates for CSV (Google Calendar format: YYYYMMDDTHHmmssZ)
    const formatCSVDateTime = (dateInput) => {
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            // Handle "YYYY-MM-DD HH:MM:SS" format
            const dateStr = dateInput.includes('T') ? dateInput : dateInput.replace(' ', 'T');
            date = new Date(dateStr);
        } else {
            return '';
        }
        
        // Convert to UTC and format
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };
    
    // Escape CSV fields (replace " with "")
    const escapeCSV = (text) => {
        if (!text) return '';
        return String(text).replace(/"/g, '""');
    };
    
    const csv = [
        'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location',
        `"${escapeCSV(title)}","${formatCSVDateTime(startTime)}","${formatCSVDateTime(startTime)}","${formatCSVDateTime(endTime)}","${formatCSVDateTime(endTime)}",False,"${escapeCSV(description)}","${escapeCSV(place)}"`
    ].join('\n');
    
    return csv;
}

/**
 * Generate CSV file from frontend data
 * @param {Object} data - Frontend booking data
 * @returns {String} CSV file content
 */
function generateCSVFromFrontend(data) {
    const {
        meetingName,
        date,
        startTime,
        endTime,
        place = '',
        description = ''
    } = data;
    
    // Combine date and time
    const startDateTime = `${date} ${startTime}`;
    const endDateTime = `${date} ${endTime}`;
    
    const booking = {
        title: meetingName,
        description: description,
        place_name: place,
        start_time: startDateTime,
        end_time: endDateTime
    };
    
    return generateCSV(booking);
}

module.exports = {
    generateICS,
    generateICSFromFrontend,
    generateCSV,
    generateCSVFromFrontend,
    formatICSDate,
    escapeICS
};


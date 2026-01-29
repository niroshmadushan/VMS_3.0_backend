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
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Fold long lines in ICS content (max 75 characters)
 */
function foldLine(line) {
    const maxLength = 74;
    if (line.length <= maxLength) return line;

    let result = '';
    let currentLine = line;

    while (currentLine.length > maxLength) {
        result += currentLine.substring(0, maxLength) + '\r\n ';
        currentLine = currentLine.substring(maxLength);
    }

    result += currentLine;
    return result;
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(dateInput, timezone = 'UTC') {
    let date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        let dateStr = String(dateInput).trim();

        if (dateStr.startsWith('0000') || !dateStr) {
            date = new Date();
        } else {
            // Handle various formats, e.g., "HH:mm:ss" or just "HH:mm"
            if (dateStr.length <= 8 && dateStr.includes(':')) {
                const today = new Date().toISOString().split('T')[0];
                dateStr = `${today}T${dateStr}`;
            }
            dateStr = dateStr.replace(' ', 'T');
            date = new Date(dateStr);
        }
    } else {
        date = new Date();
    }

    if (isNaN(date.getTime())) {
        date = new Date();
    }

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
 */
function generateICS(booking, options = {}) {
    const {
        organizerEmail = 'noreply@booking-system.com',
        organizerName = 'Booking Management System',
        location = '',
        description = '',
        url = '',
        timezone = 'UTC',
        method = 'REQUEST',
        attendees = []
    } = options;

    const title = booking.title || booking.meetingName || options.title || 'Meeting Invitation';
    const startTime = booking.start_time || booking.startTime;
    const endTime = booking.end_time || booking.endTime;
    const place = booking.place_name || booking.place || location || 'TBD';
    const desc = booking.description || description || 'No description provided';

    const dtStart = formatICSDate(startTime, timezone);
    const dtEnd = formatICSDate(endTime, timezone);
    const dtStamp = formatICSDate(new Date(), timezone);
    const uid = booking.id || `booking-${Date.now()}@booking-system.com`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Booking Management System//Calendar Service//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:' + method,
        'X-WR-CALNAME:' + escapeICS(title),
        'X-WR-TIMEZONE:' + timezone,
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + dtStamp,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        'SUMMARY:' + escapeICS(title),
        'DESCRIPTION:' + escapeICS(desc),
        'LOCATION:' + escapeICS(place),
        `ORGANIZER;CN="${escapeICS(organizerName)}":mailto:${organizerEmail}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        ...attendees.map(a => `ATTENDEE;RSVP=TRUE;CN="${escapeICS(a.name || a.email)}":mailto:${a.email}`),
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: ' + escapeICS(title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return lines.map(foldLine).join('\r\n');
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
        title: meetingName,
        organizerEmail: orgEmail,
        organizerName: organizerName,
        location: place,
        description: description,
        url: url,
        timezone: timezone,
        attendees: participantEmails.map(email => ({ email, name: email.split('@')[0] }))
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


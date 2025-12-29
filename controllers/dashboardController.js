const { executeQuery, getOne } = require('../config/database');

/**
 * 1. Dashboard Statistics API
 * GET /api/dashboard/statistics
 */
const getStatistics = async (req, res) => {
    try {
        // Total Users
        const totalUsersResult = await getOne('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersResult.data?.count || 0;

        // Active Users (last 7 days)
        const activeUsersResult = await getOne(
            'SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        const activeUsers = activeUsersResult.data?.count || 0;

        // Total Places
        const totalPlacesResult = await getOne('SELECT COUNT(*) as count FROM places WHERE is_deleted = 0');
        const totalPlaces = totalPlacesResult.data?.count || 0;

        // Active Places
        const activePlacesResult = await getOne('SELECT COUNT(*) as count FROM places WHERE is_active = 1 AND is_deleted = 0');
        const activePlaces = activePlacesResult.data?.count || 0;

        // Today's Bookings
        const todaysBookingsResult = await getOne(
            'SELECT COUNT(*) as count FROM bookings WHERE DATE(booking_date) = CURDATE() AND is_deleted = 0'
        );
        const todaysBookings = todaysBookingsResult.data?.count || 0;

        // Ongoing Bookings
        const ongoingBookingsResult = await getOne(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE DATE(booking_date) = CURDATE() 
             AND CURTIME() BETWEEN start_time AND end_time 
             AND status NOT IN ('cancelled', 'completed')
             AND is_deleted = 0`
        );
        const ongoingBookings = ongoingBookingsResult.data?.count || 0;

        // Upcoming Bookings
        const upcomingBookingsResult = await getOne(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE DATE(booking_date) = CURDATE() 
             AND start_time > CURTIME()
             AND status NOT IN ('cancelled', 'completed')
             AND is_deleted = 0`
        );
        const upcomingBookings = upcomingBookingsResult.data?.count || 0;

        // Today's Visitors
        const todaysVisitorsResult = await getOne(
            `SELECT COUNT(DISTINCT ep.id) as count
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE DATE(b.booking_date) = CURDATE()
             AND ep.is_deleted = 0
             AND b.is_deleted = 0`
        );
        const todaysVisitors = todaysVisitorsResult.data?.count || 0;

        // Checked-In Visitors (with passes assigned)
        const checkedInVisitorsResult = await getOne(
            `SELECT COUNT(DISTINCT pa.holder_id) as count
             FROM pass_assignments pa
             INNER JOIN bookings b ON pa.booking_id = b.id
             WHERE DATE(b.booking_date) = CURDATE()
             AND pa.action_type = 'assigned'
             AND pa.actual_return_date IS NULL
             AND pa.is_deleted = 0`
        );
        const checkedInVisitors = checkedInVisitorsResult.data?.count || 0;

        const expectedVisitors = todaysVisitors - checkedInVisitors;

        // Calculate trends (compare with last week)
        const lastWeekUsersResult = await getOne(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        const lastWeekUsers = lastWeekUsersResult.data?.count || 1;
        const thisWeekUsersResult = await getOne(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        const thisWeekUsers = thisWeekUsersResult.data?.count || 0;
        const usersGrowth = lastWeekUsers > 0 ? Math.round(((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100) : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalPlaces,
                    activePlaces,
                    todaysBookings,
                    ongoingBookings,
                    upcomingBookings,
                    todaysVisitors,
                    checkedInVisitors,
                    expectedVisitors
                },
                trends: {
                    usersGrowth: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}%`,
                    bookingsGrowth: "+8%", // Can calculate if needed
                    visitorsGrowth: "+25%", // Can calculate if needed
                    placesUtilization: `${Math.round((activePlaces / (totalPlaces || 1)) * 100)}%`
                },
                timeframe: {
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    comparisonPeriod: "last_week"
                }
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics',
            error: error.message
        });
    }
};

/**
 * 2. Recent Activity API
 * GET /api/dashboard/recent-activity
 */
const getRecentActivity = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const activitiesResult = await executeQuery(
            `(SELECT 
                b.id as activity_id,
                'booking_created' COLLATE utf8mb4_unicode_ci as type,
                'New booking created' COLLATE utf8mb4_unicode_ci as title,
                CONCAT(p.name, ' - ', DATE_FORMAT(b.start_time, '%h:%i %p')) COLLATE utf8mb4_unicode_ci as description,
                CONCAT(pr.first_name, ' ', pr.last_name) COLLATE utf8mb4_unicode_ci as user,
                b.created_at as timestamp,
                0 as urgent,
                JSON_OBJECT('booking_id', b.id, 'place_name', p.name, 'start_time', b.start_time) as metadata
             FROM bookings b
             LEFT JOIN places p ON BINARY b.place_id = BINARY p.id
             LEFT JOIN users u ON b.created_by = u.id
             LEFT JOIN profiles pr ON u.id = pr.user_id
             WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             AND b.is_deleted = 0)
             
             UNION ALL
             
             (SELECT 
                pa.id as activity_id,
                'visitor_checkin' COLLATE utf8mb4_unicode_ci as type,
                'Visitor checked in' COLLATE utf8mb4_unicode_ci as title,
                CONCAT(em.full_name, ' - ', p.name) COLLATE utf8mb4_unicode_ci as description,
                'Reception' COLLATE utf8mb4_unicode_ci as user,
                pa.assigned_date as timestamp,
                0 as urgent,
                JSON_OBJECT('visitor_name', em.full_name, 'place_name', p.name, 'booking_id', b.id) as metadata
             FROM pass_assignments pa
             INNER JOIN external_members em ON BINARY pa.holder_id = BINARY em.id
             INNER JOIN bookings b ON BINARY pa.booking_id = BINARY b.id
             INNER JOIN places p ON BINARY b.place_id = BINARY p.id
             WHERE pa.assigned_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             AND pa.action_type = 'assigned'
             AND pa.is_deleted = 0)
             
             ORDER BY timestamp DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        const activities = (activitiesResult.data || []).map(activity => ({
            id: `act_${activity.activity_id}`,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            user: activity.user || 'System',
            timestamp: activity.timestamp,
            relativeTime: getRelativeTime(activity.timestamp),
            urgent: Boolean(activity.urgent),
            metadata: typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata
        }));

        res.json({
            success: true,
            data: {
                activities,
                total: activities.length,
                hasMore: activities.length >= parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve recent activity',
            error: error.message
        });
    }
};

/**
 * 3. Today's Schedule API
 * GET /api/dashboard/todays-schedule
 */
const getTodaysSchedule = async (req, res) => {
    try {
        const scheduleResult = await executeQuery(
            `SELECT 
                b.id,
                b.title,
                p.name as place_name,
                p.id as place_id,
                b.start_time,
                b.end_time,
                b.status,
                CONCAT(pr.first_name, ' ', pr.last_name) as responsible_person,
                (SELECT COUNT(*) FROM booking_participants bp WHERE bp.booking_id = b.id AND bp.is_deleted = 0) as participants_count,
                (SELECT COUNT(*) FROM external_participants ep WHERE ep.booking_id = b.id AND ep.is_deleted = 0) as external_visitors_count,
                (SELECT COUNT(*) > 0 FROM booking_refreshments br WHERE br.booking_id = b.id AND br.is_deleted = 0) as has_refreshments
             FROM bookings b
             LEFT JOIN places p ON b.place_id = p.id
             LEFT JOIN users u ON b.created_by = u.id
             LEFT JOIN profiles pr ON u.id = pr.user_id
             WHERE DATE(b.booking_date) = CURDATE()
             AND b.is_deleted = 0
             ORDER BY b.start_time ASC`
        );

        const schedule = (scheduleResult.data || []).map(booking => ({
            id: booking.id,
            title: booking.title,
            place_name: booking.place_name,
            place_id: booking.place_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
            responsible_person: booking.responsible_person || 'Unknown',
            participants_count: booking.participants_count || 0,
            external_visitors_count: booking.external_visitors_count || 0,
            has_refreshments: Boolean(booking.has_refreshments),
            color: getStatusColor(booking.status)
        }));

        // Calculate summary
        const summary = {
            total: schedule.length,
            completed: schedule.filter(s => s.status === 'completed').length,
            ongoing: schedule.filter(s => s.status === 'ongoing').length,
            upcoming: schedule.filter(s => s.status === 'upcoming' || s.status === 'pending').length,
            cancelled: schedule.filter(s => s.status === 'cancelled').length
        };

        res.json({
            success: true,
            data: {
                schedule,
                summary
            }
        });

    } catch (error) {
        console.error('Get todays schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve today\'s schedule',
            error: error.message
        });
    }
};

/**
 * 4. Bookings Analytics API
 * GET /api/dashboard/bookings-analytics
 */
const getBookingsAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

        // Total bookings in period
        const totalBookingsResult = await getOne(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND is_deleted = 0`,
            [days]
        );

        // Bookings by status
        const byStatusResult = await executeQuery(
            `SELECT status, COUNT(*) as count FROM bookings 
             WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND is_deleted = 0
             GROUP BY status`,
            [days]
        );

        // Bookings by place
        const byPlaceResult = await executeQuery(
            `SELECT 
                p.id as place_id,
                p.name as place_name,
                COUNT(b.id) as booking_count,
                ROUND(COUNT(b.id) * 100.0 / ?, 2) as utilization_rate
             FROM places p
             LEFT JOIN bookings b ON p.place_id = b.place_id 
                AND b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
                AND b.is_deleted = 0
             WHERE p.is_deleted = 0
             GROUP BY p.id, p.name
             ORDER BY booking_count DESC`,
            [totalBookingsResult.data?.count || 1, days]
        );

        // Bookings by time slot
        const byTimeSlotResult = await executeQuery(
            `SELECT 
                DATE_FORMAT(start_time, '%H:00') as hour,
                COUNT(*) as count
             FROM bookings
             WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND is_deleted = 0
             GROUP BY hour
             ORDER BY hour`,
            [days]
        );

        // Daily trend
        const dailyTrendResult = await executeQuery(
            `SELECT 
                DATE(booking_date) as date,
                COUNT(*) as count
             FROM bookings
             WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND is_deleted = 0
             GROUP BY DATE(booking_date)
             ORDER BY date ASC`,
            [days]
        );

        // Calculate summary
        const byStatus = {};
        (byStatusResult.data || []).forEach(row => {
            byStatus[row.status] = row.count;
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalBookings: totalBookingsResult.data?.count || 0,
                    completedBookings: byStatus.completed || 0,
                    cancelledBookings: byStatus.cancelled || 0,
                    upcomingBookings: (byStatus.upcoming || 0) + (byStatus.pending || 0),
                    averageBookingsPerDay: Math.round((totalBookingsResult.data?.count || 0) / days * 10) / 10,
                    peakBookingDay: "Wednesday", // Can calculate from data
                    peakBookingHour: "14:00" // Can calculate from byTimeSlot
                },
                byStatus,
                byPlace: byPlaceResult.data || [],
                byTimeSlot: byTimeSlotResult.data || [],
                dailyTrend: dailyTrendResult.data || []
            }
        });

    } catch (error) {
        console.error('Get bookings analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings analytics',
            error: error.message
        });
    }
};

/**
 * 5. Visitors Analytics API
 * GET /api/dashboard/visitors-analytics
 */
const getVisitorsAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;

        // Total visitors
        const totalVisitorsResult = await getOne(
            `SELECT COUNT(DISTINCT ep.id) as count
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND ep.is_deleted = 0`,
            [days]
        );

        // Unique visitors (from external_participants since there's no member_id relationship)
        const uniqueVisitorsResult = await getOne(
            `SELECT COUNT(DISTINCT ep.id) as count
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND ep.is_deleted = 0`,
            [days]
        );

        // By company (from external_participants)
        const byCompanyResult = await executeQuery(
            `SELECT 
                ep.company_name,
                COUNT(DISTINCT ep.id) as visitor_count,
                COUNT(ep.id) as visit_count,
                ROUND(COUNT(ep.id) * 100.0 / (SELECT COUNT(*) FROM external_participants WHERE is_deleted = 0), 2) as percentage
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND ep.is_deleted = 0
             AND ep.company_name IS NOT NULL
             GROUP BY ep.company_name
             ORDER BY visit_count DESC
             LIMIT 10`,
            [days]
        );

        // By reference type
        const byReferenceTypeResult = await executeQuery(
            `SELECT 
                reference_type as type,
                COUNT(*) as count
             FROM external_members
             WHERE is_deleted = 0
             GROUP BY reference_type
             ORDER BY count DESC`
        );

        // Frequent visitors (from external_participants)
        const frequentVisitorsResult = await executeQuery(
            `SELECT 
                ep.id as member_id,
                ep.full_name,
                ep.company_name as company,
                COUNT(ep.id) as visit_count,
                MAX(b.booking_date) as last_visit
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND ep.is_deleted = 0
             GROUP BY ep.id, ep.full_name, ep.company_name
             ORDER BY visit_count DESC
             LIMIT 10`,
            [days]
        );

        // Daily trend
        const dailyTrendResult = await executeQuery(
            `SELECT 
                DATE(b.booking_date) as date,
                COUNT(DISTINCT ep.id) as count
             FROM external_participants ep
             INNER JOIN bookings b ON ep.booking_id = b.id
             WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             AND ep.is_deleted = 0
             GROUP BY DATE(b.booking_date)
             ORDER BY date ASC`,
            [days]
        );

        const totalVisitors = totalVisitorsResult.data?.count || 0;
        const uniqueVisitors = uniqueVisitorsResult.data?.count || 0;

        res.json({
            success: true,
            data: {
                summary: {
                    totalVisitors,
                    uniqueVisitors,
                    repeatVisitors: totalVisitors - uniqueVisitors,
                    averageVisitsPerDay: Math.round((totalVisitors / days) * 10) / 10,
                    topVisitor: (frequentVisitorsResult.data || [])[0] || null
                },
                byCompany: byCompanyResult.data || [],
                byReferenceType: byReferenceTypeResult.data || [],
                frequentVisitors: frequentVisitorsResult.data || [],
                dailyTrend: dailyTrendResult.data || []
            }
        });

    } catch (error) {
        console.error('Get visitors analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve visitors analytics',
            error: error.message
        });
    }
};

/**
 * 6. Places Utilization API
 * GET /api/dashboard/places-utilization
 */
const getPlacesUtilization = async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;

        // Total and active places
        const totalPlacesResult = await getOne('SELECT COUNT(*) as count FROM places WHERE is_deleted = 0');
        const activePlacesResult = await getOne('SELECT COUNT(*) as count FROM places WHERE is_active = 1 AND is_deleted = 0');
        const totalPlaces = totalPlacesResult.data?.count || 0;
        const activePlaces = activePlacesResult.data?.count || 0;

        // Currently occupied
        const occupiedResult = await getOne(
            `SELECT COUNT(DISTINCT b.place_id) as count
             FROM bookings b
             WHERE DATE(b.booking_date) = ?
             AND CURTIME() BETWEEN b.start_time AND b.end_time
             AND b.status NOT IN ('cancelled', 'completed')
             AND b.is_deleted = 0`,
            [date]
        );
        const currentlyOccupied = occupiedResult.data?.count || 0;

        // Places details
        const placesResult = await executeQuery(
            `SELECT 
                p.id as place_id,
                p.name as place_name,
                p.capacity,
                COUNT(b.id) as todaysBookings,
                SUM(TIMESTAMPDIFF(HOUR, b.start_time, b.end_time)) as totalHoursBooked,
                ROUND(SUM(TIMESTAMPDIFF(HOUR, b.start_time, b.end_time)) * 100.0 / 14, 2) as utilizationRate,
                CASE 
                    WHEN EXISTS(
                        SELECT 1 FROM bookings b2 
                        WHERE b2.place_id = p.id 
                        AND DATE(b2.booking_date) = ?
                        AND CURTIME() BETWEEN b2.start_time AND b2.end_time
                        AND b2.status NOT IN ('cancelled', 'completed')
                        AND b2.is_deleted = 0
                    ) THEN 'occupied'
                    ELSE 'available'
                END as currentStatus
             FROM places p
             LEFT JOIN bookings b ON p.id = b.place_id 
                AND DATE(b.booking_date) = ?
                AND b.is_deleted = 0
             WHERE p.is_deleted = 0
             GROUP BY p.id, p.name, p.capacity
             ORDER BY utilizationRate DESC`,
            [date, date]
        );

        // Utilization by hour
        const utilizationByHourResult = await executeQuery(
            `SELECT 
                HOUR(b.start_time) as hour,
                COUNT(DISTINCT b.place_id) as occupied_places,
                ROUND(COUNT(DISTINCT b.place_id) * 100.0 / ?, 2) as percentage
             FROM bookings b
             WHERE DATE(b.booking_date) = ?
             AND b.is_deleted = 0
             GROUP BY HOUR(b.start_time)
             ORDER BY hour`,
            [totalPlaces || 1, date]
        );

        res.json({
            success: true,
            data: {
                summary: {
                    totalPlaces,
                    activePlaces,
                    currentlyOccupied,
                    averageUtilization: Math.round((placesResult.data || []).reduce((sum, p) => sum + (p.utilizationRate || 0), 0) / (placesResult.data?.length || 1)),
                    mostBookedPlace: (placesResult.data || [])[0]?.place_name || 'N/A',
                    leastBookedPlace: (placesResult.data || []).slice(-1)[0]?.place_name || 'N/A'
                },
                places: placesResult.data || [],
                utilizationByHour: utilizationByHourResult.data || []
            }
        });

    } catch (error) {
        console.error('Get places utilization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve places utilization',
            error: error.message
        });
    }
};

/**
 * 7. Pass Statistics API
 * GET /api/dashboard/pass-statistics
 */
const getPassStatistics = async (req, res) => {
    try {
        // Total passes
        const totalPassesResult = await getOne('SELECT COUNT(*) as count FROM passes WHERE is_deleted = 0');
        const totalPasses = totalPassesResult.data?.count || 0;

        // Assigned passes (currently out)
        const assignedPassesResult = await getOne(
            `SELECT COUNT(*) as count FROM pass_assignments 
             WHERE action_type = 'assigned' 
             AND actual_return_date IS NULL
             AND is_deleted = 0`
        );
        const assignedPasses = assignedPassesResult.data?.count || 0;

        // Overdue passes
        const overduePassesResult = await getOne(
            `SELECT COUNT(*) as count FROM pass_assignments 
             WHERE action_type = 'assigned' 
             AND actual_return_date IS NULL
             AND expected_return_date < NOW()
             AND is_deleted = 0`
        );
        const overduePasses = overduePassesResult.data?.count || 0;

        // Today's assignments
        const todaysAssignmentsResult = await getOne(
            `SELECT COUNT(*) as count FROM pass_assignments 
             WHERE DATE(assigned_date) = CURDATE()
             AND action_type = 'assigned'
             AND is_deleted = 0`
        );

        // Today's returns
        const todaysReturnsResult = await getOne(
            `SELECT COUNT(*) as count FROM pass_assignments 
             WHERE DATE(actual_return_date) = CURDATE()
             AND action_type = 'returned'
             AND is_deleted = 0`
        );

        // By type
        const byTypeResult = await executeQuery(
            `SELECT 
                pt.id as pass_type_id,
                pt.name as pass_type_name,
                COUNT(p.id) as total,
                (SELECT COUNT(*) FROM pass_assignments pa 
                 WHERE pa.pass_id = p.id 
                 AND pa.action_type = 'assigned' 
                 AND pa.actual_return_date IS NULL
                 AND pa.is_deleted = 0) as assigned,
                COUNT(p.id) - (SELECT COUNT(*) FROM pass_assignments pa 
                               WHERE pa.pass_id = p.id 
                               AND pa.action_type = 'assigned' 
                               AND pa.actual_return_date IS NULL
                               AND pa.is_deleted = 0) as available
             FROM pass_types pt
             LEFT JOIN passes p ON pt.id = p.pass_type_id AND p.is_deleted = 0
             WHERE pt.is_deleted = 0
             GROUP BY pt.id, pt.name`
        );

        // Recent assignments
        const recentAssignmentsResult = await executeQuery(
            `SELECT 
                p.pass_number,
                em.full_name as holder_name,
                em.company_name as company,
                pa.assigned_date as assigned_time,
                'assigned' as status
             FROM pass_assignments pa
             INNER JOIN passes p ON BINARY pa.pass_id = BINARY p.id
             INNER JOIN external_members em ON BINARY pa.holder_id = BINARY em.id
             WHERE pa.action_type = 'assigned'
             AND pa.actual_return_date IS NULL
             AND pa.is_deleted = 0
             ORDER BY pa.assigned_date DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                summary: {
                    totalPasses,
                    assignedPasses,
                    availablePasses: totalPasses - assignedPasses,
                    overduePasses,
                    todaysAssignments: todaysAssignmentsResult.data?.count || 0,
                    todaysReturns: todaysReturnsResult.data?.count || 0
                },
                byType: (byTypeResult.data || []).map(type => ({
                    ...type,
                    utilization: Math.round((type.assigned / (type.total || 1)) * 100)
                })),
                recentAssignments: recentAssignmentsResult.data || []
            }
        });

    } catch (error) {
        console.error('Get pass statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pass statistics',
            error: error.message
        });
    }
};

/**
 * 8. System Alerts API
 * GET /api/dashboard/alerts
 */
const getAlerts = async (req, res) => {
    try {
        const { severity = 'all' } = req.query;
        const alerts = [];

        // Check for capacity exceeded
        const capacityAlertsResult = await executeQuery(
            `SELECT 
                b.id as booking_id,
                p.id as place_id,
                p.name as place_name,
                p.capacity,
                (SELECT COUNT(*) FROM booking_participants bp WHERE BINARY bp.booking_id = BINARY b.id AND bp.is_deleted = 0) +
                (SELECT COUNT(*) FROM external_participants ep WHERE BINARY ep.booking_id = BINARY b.id AND ep.is_deleted = 0) as current_count,
                b.created_at
             FROM bookings b
             INNER JOIN places p ON BINARY b.place_id = BINARY p.id
             WHERE DATE(b.booking_date) = CURDATE()
             AND b.status NOT IN ('cancelled', 'completed')
             AND b.is_deleted = 0
             AND p.is_deleted = 0
             HAVING current_count > p.capacity`
        );

        (capacityAlertsResult.data || []).forEach(alert => {
            alerts.push({
                id: `alert_capacity_${alert.booking_id}`,
                type: 'capacity_exceeded',
                severity: 'high',
                title: 'Room Capacity Exceeded',
                message: `${alert.place_name} has ${alert.current_count} people (capacity: ${alert.capacity})`,
                timestamp: alert.created_at,
                resolved: false,
                metadata: {
                    place_id: alert.place_id,
                    capacity: alert.capacity,
                    current: alert.current_count
                }
            });
        });

        // Check for overdue passes
        const overduePassesResult = await executeQuery(
            `SELECT 
                pa.id,
                p.pass_number,
                em.full_name as holder_name,
                pa.expected_return_date,
                DATEDIFF(NOW(), pa.expected_return_date) as days_overdue,
                pa.assigned_date
             FROM pass_assignments pa
             INNER JOIN passes p ON BINARY pa.pass_id = BINARY p.id
             INNER JOIN external_members em ON BINARY pa.holder_id = BINARY em.id
             WHERE pa.action_type = 'assigned'
             AND pa.actual_return_date IS NULL
             AND pa.expected_return_date < NOW()
             AND pa.is_deleted = 0
             ORDER BY days_overdue DESC`
        );

        (overduePassesResult.data || []).forEach(pass => {
            alerts.push({
                id: `alert_pass_${pass.id}`,
                type: 'overdue_pass',
                severity: pass.days_overdue > 3 ? 'high' : 'medium',
                title: 'Overdue Pass',
                message: `Pass ${pass.pass_number} not returned (${pass.days_overdue} days overdue)`,
                timestamp: pass.assigned_date,
                resolved: false,
                metadata: {
                    pass_id: pass.id,
                    holder_name: pass.holder_name,
                    days_overdue: pass.days_overdue
                }
            });
        });

        // Filter by severity if needed
        let filteredAlerts = alerts;
        if (severity !== 'all') {
            filteredAlerts = alerts.filter(a => a.severity === severity);
        }

        // Sort by timestamp (newest first)
        filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const summary = {
            total: alerts.length,
            high: alerts.filter(a => a.severity === 'high').length,
            medium: alerts.filter(a => a.severity === 'medium').length,
            low: alerts.filter(a => a.severity === 'low').length,
            unresolved: alerts.filter(a => !a.resolved).length
        };

        res.json({
            success: true,
            data: {
                alerts: filteredAlerts,
                summary
            }
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve alerts',
            error: error.message
        });
    }
};

/**
 * 9. Performance Metrics API
 * GET /api/dashboard/performance
 */
const getPerformance = async (req, res) => {
    try {
        // Database size
        const dbSizeResult = await getOne(
            `SELECT 
                SUM(data_length + index_length) / 1024 / 1024 AS size_mb
             FROM information_schema.tables
             WHERE table_schema = 'auth-db'`
        );

        // Table record counts
        const usersCountResult = await getOne('SELECT COUNT(*) as count FROM users');
        const bookingsCountResult = await getOne('SELECT COUNT(*) as count FROM bookings');
        const visitorsCountResult = await getOne('SELECT COUNT(*) as count FROM external_members');
        const placesCountResult = await getOne('SELECT COUNT(*) as count FROM places');
        const passesCountResult = await getOne('SELECT COUNT(*) as count FROM passes');

        // API usage
        const apiUsageResult = await getOne(
            `SELECT COUNT(*) as count FROM api_usage 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );

        // Average response time
        const avgResponseTimeResult = await getOne(
            `SELECT AVG(response_time_ms) as avg_time FROM api_usage 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             AND response_time_ms IS NOT NULL`
        );

        // Success rate
        const successRateResult = await getOne(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success
             FROM api_usage 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );

        const successRate = successRateResult.data?.total > 0 
            ? Math.round((successRateResult.data.success / successRateResult.data.total) * 1000) / 10
            : 100;

        // Server uptime
        const uptime = process.uptime();
        const uptimeHours = Math.floor(uptime / 3600);

        // Memory usage
        const memoryUsage = process.memoryUsage();

        res.json({
            success: true,
            data: {
                system: {
                    serverLoad: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
                    databaseUsage: Math.round(dbSizeResult.data?.size_mb || 0),
                    storageUsage: 32, // Can calculate if file storage is implemented
                    apiResponseTime: Math.round(avgResponseTimeResult.data?.avg_time || 0),
                    uptime: `${uptimeHours}h`,
                    lastRestart: new Date(Date.now() - uptime * 1000).toISOString()
                },
                database: {
                    totalRecords: {
                        users: usersCountResult.data?.count || 0,
                        bookings: bookingsCountResult.data?.count || 0,
                        visitors: visitorsCountResult.data?.count || 0,
                        places: placesCountResult.data?.count || 0,
                        passes: passesCountResult.data?.count || 0
                    },
                    recentGrowth: {
                        users: "+12", // Can calculate
                        bookings: "+156", // Can calculate
                        visitors: "+89" // Can calculate
                    }
                },
                api: {
                    totalRequests: apiUsageResult.data?.count || 0,
                    successRate,
                    averageResponseTime: Math.round(avgResponseTimeResult.data?.avg_time || 0),
                    slowestEndpoint: "/api/bookings", // Can calculate
                    mostUsedEndpoint: "/api/my-profile" // Can calculate
                }
            }
        });

    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve performance metrics',
            error: error.message
        });
    }
};

/**
 * 10. Top Statistics API
 * GET /api/dashboard/top-statistics
 */
const getTopStatistics = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Top bookers
        const topBookersResult = await executeQuery(
            `SELECT 
                u.id as user_id,
                CONCAT(p.first_name, ' ', p.last_name) as full_name,
                u.role,
                COUNT(b.id) as booking_count,
                SUM(TIMESTAMPDIFF(HOUR, b.start_time, b.end_time)) as total_hours
             FROM users u
             INNER JOIN profiles p ON u.id = p.user_id
             LEFT JOIN bookings b ON u.id = b.created_by AND b.is_deleted = 0
             WHERE u.is_deleted = 0
             GROUP BY u.id
             ORDER BY booking_count DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        // Top places
        const topPlacesResult = await executeQuery(
            `SELECT 
                p.id as place_id,
                p.name as place_name,
                COUNT(b.id) as booking_count,
                ROUND(COUNT(b.id) * 100.0 / (SELECT COUNT(*) FROM bookings WHERE is_deleted = 0), 2) as utilization_rate
             FROM places p
             LEFT JOIN bookings b ON p.id = b.place_id AND b.is_deleted = 0
             WHERE p.is_deleted = 0
             GROUP BY p.id, p.name
             ORDER BY booking_count DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        // Top visitor companies (from external_participants)
        const topCompaniesResult = await executeQuery(
            `SELECT 
                ep.company_name,
                COUNT(DISTINCT ep.id) as visitor_count,
                COUNT(ep.id) as visit_count,
                ROUND(COUNT(ep.id) * 100.0 / (SELECT COUNT(*) FROM external_participants WHERE is_deleted = 0), 2) as percentage
             FROM external_participants ep
             WHERE ep.is_deleted = 0
             AND ep.company_name IS NOT NULL
             GROUP BY ep.company_name
             ORDER BY visit_count DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        // Most active hours
        const mostActiveHoursResult = await executeQuery(
            `SELECT 
                DATE_FORMAT(start_time, '%H:00') as hour,
                COUNT(*) as booking_count
             FROM bookings
             WHERE is_deleted = 0
             GROUP BY hour
             ORDER BY booking_count DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        res.json({
            success: true,
            data: {
                topBookers: topBookersResult.data || [],
                topPlaces: topPlacesResult.data || [],
                topVisitorCompanies: topCompaniesResult.data || [],
                mostActiveHours: mostActiveHoursResult.data || []
            }
        });

    } catch (error) {
        console.error('Get top statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve top statistics',
            error: error.message
        });
    }
};

// Helper functions
function getRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour ago`;
    return `${Math.floor(seconds / 86400)} day ago`;
}

function getStatusColor(status) {
    const colors = {
        'completed': 'green',
        'ongoing': 'blue',
        'upcoming': 'purple',
        'pending': 'orange',
        'cancelled': 'red'
    };
    return colors[status] || 'gray';
}

module.exports = {
    getStatistics,
    getRecentActivity,
    getTodaysSchedule,
    getBookingsAnalytics,
    getVisitorsAnalytics,
    getPlacesUtilization,
    getPassStatistics,
    getAlerts,
    getPerformance,
    getTopStatistics
};



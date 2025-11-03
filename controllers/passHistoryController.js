const { executeQuery, getOne } = require('../config/database');

/**
 * Get pass assignment history with proper date filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPassHistory = async (req, res) => {
    try {
        const { 
            dateFilter = 'all', 
            statusFilter = 'all', 
            search = '',
            page = 1,
            limit = 20
        } = req.query;

        // Calculate date range based on filter
        let dateCondition = '';
        let dateParams = [];

        switch (dateFilter) {
            case 'today':
                // Use UTC date to avoid timezone issues
                dateCondition = 'DATE(CONVERT_TZ(pa.assigned_date, "+00:00", "+05:30")) = CURDATE()';
                break;
            case 'yesterday':
                dateCondition = 'DATE(CONVERT_TZ(pa.assigned_date, "+00:00", "+05:30")) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
                break;
            case 'last_7_days':
                dateCondition = 'DATE(CONVERT_TZ(pa.assigned_date, "+00:00", "+05:30")) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'last_30_days':
                dateCondition = 'DATE(CONVERT_TZ(pa.assigned_date, "+00:00", "+05:30")) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            case 'custom_range':
                const { startDate, endDate } = req.query;
                if (startDate && endDate) {
                    dateCondition = 'DATE(CONVERT_TZ(pa.assigned_date, "+00:00", "+05:30")) BETWEEN ? AND ?';
                    dateParams = [startDate, endDate];
                }
                break;
            default:
                // 'all' - no date filter
                break;
        }

        // Status filter
        let statusCondition = '';
        switch (statusFilter) {
            case 'assigned':
                statusCondition = "AND pa.action_type = 'assigned' AND pa.actual_return_date IS NULL";
                break;
            case 'returned':
                statusCondition = "AND pa.action_type = 'returned'";
                break;
            case 'lost':
                statusCondition = "AND pa.action_type = 'lost'";
                break;
            case 'overdue':
                statusCondition = "AND pa.action_type = 'assigned' AND pa.actual_return_date IS NULL AND pa.expected_return_date < NOW()";
                break;
            default:
                // 'all' - no status filter
                break;
        }

        // Search condition
        let searchCondition = '';
        if (search) {
            searchCondition = `AND (
                p.pass_number LIKE ? OR 
                em.full_name LIKE ? OR 
                em.company_name LIKE ? OR
                b.title LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            dateParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Build the main query
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT 
                pa.id,
                pa.action_type,
                pa.assigned_date,
                pa.actual_return_date,
                pa.expected_return_date,
                pa.notes,
                p.id as pass_id,
                p.pass_number,
                pt.name as pass_type_name,
                em.id as holder_id,
                em.full_name as holder_name,
                em.phone as holder_phone,
                em.company_name as holder_company,
                em.member_type,
                b.id as booking_id,
                b.title as booking_title,
                pl.name as place_name,
                u.id as assigned_by_id,
                CONCAT(pr.first_name, ' ', pr.last_name) as assigned_by_name,
                CASE 
                    WHEN pa.action_type = 'assigned' AND pa.actual_return_date IS NULL THEN 'ACTIVE'
                    WHEN pa.action_type = 'returned' THEN 'RETURNED'
                    WHEN pa.action_type = 'lost' THEN 'LOST'
                    WHEN pa.action_type = 'assigned' AND pa.actual_return_date IS NULL AND pa.expected_return_date < NOW() THEN 'OVERDUE'
                    ELSE 'UNKNOWN'
                END as status,
                CASE 
                    WHEN pa.action_type = 'assigned' AND pa.actual_return_date IS NULL THEN
                        CASE 
                            WHEN pa.expected_return_date < NOW() THEN 'OVERDUE'
                            ELSE 'ACTIVE'
                        END
                    ELSE pa.action_type
                END as display_status,
                TIMESTAMPDIFF(HOUR, pa.assigned_date, COALESCE(pa.actual_return_date, NOW())) as duration_hours,
                CASE 
                    WHEN pa.actual_return_date IS NOT NULL THEN 'Returned'
                    WHEN pa.expected_return_date < NOW() THEN 'Overdue'
                    ELSE 'Ongoing'
                END as duration_status
            FROM pass_assignments pa
            INNER JOIN passes p ON pa.pass_id = p.id
            INNER JOIN pass_types pt ON p.pass_type_id = pt.id
            INNER JOIN external_members em ON pa.holder_id = em.id
            LEFT JOIN bookings b ON pa.booking_id = b.id
            LEFT JOIN places pl ON b.place_id = pl.id
            LEFT JOIN users u ON pa.assigned_by = u.id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE pa.is_deleted = 0
            ${dateCondition ? `AND ${dateCondition}` : ''}
            ${statusCondition}
            ${searchCondition}
            ORDER BY pa.assigned_date DESC
            LIMIT ? OFFSET ?
        `;

        const params = [...dateParams, parseInt(limit), offset];
        const result = await executeQuery(query, params);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM pass_assignments pa
            INNER JOIN passes p ON pa.pass_id = p.id
            INNER JOIN external_members em ON pa.holder_id = em.id
            LEFT JOIN bookings b ON pa.booking_id = b.id
            WHERE pa.is_deleted = 0
            ${dateCondition ? `AND ${dateCondition}` : ''}
            ${statusCondition}
            ${searchCondition}
        `;

        const countResult = await getOne(countQuery, dateParams);
        const total = countResult.data?.total || 0;

        // Get filter counts
        const filterCounts = await getFilterCounts();

        res.json({
            success: true,
            message: 'Pass assignment history retrieved successfully',
            data: {
                records: result.data || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                filters: {
                    dateFilter,
                    statusFilter,
                    search
                },
                counts: filterCounts
            }
        });

    } catch (error) {
        console.error('Error getting pass history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pass assignment history',
            error: error.message
        });
    }
};

/**
 * Get filter counts for the UI
 */
const getFilterCounts = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const counts = await Promise.all([
            // All
            getOne('SELECT COUNT(*) as count FROM pass_assignments WHERE is_deleted = 0'),
            
            // Overdue
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE action_type = 'assigned' 
                   AND actual_return_date IS NULL 
                   AND expected_return_date < NOW() 
                   AND is_deleted = 0`),
            
            // Assigned
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE action_type = 'assigned' 
                   AND actual_return_date IS NULL 
                   AND is_deleted = 0`),
            
            // Returned
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE action_type = 'returned' 
                   AND is_deleted = 0`),
            
            // Lost
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE action_type = 'lost' 
                   AND is_deleted = 0`),
            
            // Today
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE DATE(CONVERT_TZ(assigned_date, "+00:00", "+05:30")) = CURDATE() 
                   AND is_deleted = 0`),
            
            // Yesterday
            getOne(`SELECT COUNT(*) as count FROM pass_assignments 
                   WHERE DATE(CONVERT_TZ(assigned_date, "+00:00", "+05:30")) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
                   AND is_deleted = 0`)
        ]);

        return {
            all: counts[0].data?.count || 0,
            overdue: counts[1].data?.count || 0,
            assigned: counts[2].data?.count || 0,
            returned: counts[3].data?.count || 0,
            lost: counts[4].data?.count || 0,
            today: counts[5].data?.count || 0,
            yesterday: counts[6].data?.count || 0
        };
    } catch (error) {
        console.error('Error getting filter counts:', error);
        return {
            all: 0,
            overdue: 0,
            assigned: 0,
            returned: 0,
            lost: 0,
            today: 0,
            yesterday: 0
        };
    }
};

/**
 * Set return time for a pass
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const setReturnTime = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { expectedReturnDate, notes } = req.body;
        const userId = req.user.id;

        if (!expectedReturnDate) {
            return res.status(400).json({
                success: false,
                message: 'Expected return date is required'
            });
        }

        // Update the pass assignment
        await executeQuery(
            `UPDATE pass_assignments 
             SET expected_return_date = ?, 
                 notes = COALESCE(?, notes),
                 updated_at = NOW(),
                 updated_by = ?
             WHERE id = ? AND is_deleted = 0`,
            [expectedReturnDate, notes, userId, assignmentId]
        );

        res.json({
            success: true,
            message: 'Return time set successfully',
            data: {
                assignmentId,
                expectedReturnDate,
                setBy: userId,
                setAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error setting return time:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set return time',
            error: error.message
        });
    }
};

module.exports = {
    getPassHistory,
    setReturnTime
};



'use strict';

// Get sales data
const getSaleTableQuery =           (saleId)        => `SELECT * FROM sales WHERE id =      '${saleId}'`;
const getSalesByUserTableQuery =    (userId, limit) => `SELECT * FROM sales WHERE user_id = '${userId}' LIMIT ${limit}`;

// Get user data
const getUsersByGroupTableQuery = (groupId) => `SELECT user_id FROM user_groups WHERE group_id = '${groupId}'`;

const filterByMonthYear = (month, year) => `SELECT * FROM sales WHERE (EXTRACT(MONTH FROM date) = '${month}' AND EXTRACT(YEAR FROM date) = '${year}')`;
const filterByMonthYearRange = (fromMonth, fromYear, toMonth, toYear) => `SELECT * FROM sales WHERE CONCAT(EXTRACT(YEAR FROM date), '-', EXTRACT(MONTH FROM date)) between '${fromYear}-${fromMonth}' AND '${toYear}-${toMonth}'`;

// Aggregations - averages
// Keep the cast commands - they ensure we don't only return full dollars.  The decimals may be expanded in the future if necessary to avoid rounding issues.
const getAverageRevenueByUserTableQuery = (userId) => 
    `SELECT 
        cast(cast
            (SUM(amount) as DECIMAL(11, 3)) / COUNT(*)
        as DECIMAL(10, 2)) as average 
        FROM sales WHERE user_id = '${userId}'`;
const getAverageRevenueByGroupTableQuery = (groupId) => 
    `SELECT 
        cast(cast
            (SUM(amount) as DECIMAL(11, 3)) / COUNT(*)
        as DECIMAL(10, 2)) as average 
        FROM sales INNER JOIN (${getUsersByGroupTableQuery(groupId)}) as Users ON sales.user_id = Users.user_id`;

// Aggregations - totals
const getTotalRevenueByUserTableQuery =     (userId)    => `SELECT SUM(amount) as total FROM sales WHERE user_id = '${userId}'`;
const getTotalRevenueByGroupTableQuery =    (groupId, month, year)   => `SELECT SUM(amount) as total FROM (${filterByMonthYear(month, year)}) s INNER JOIN (${getUsersByGroupTableQuery(groupId)}) 
                                                                as Users ON s.user_id = Users.user_id 
                                                                `;
const getTotalRevenueByGroupTableQueryRange =    (groupId, fromMonth, fromYear, toMonth, toYear)   => `SELECT SUM(amount) as total FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) s INNER JOIN (${getUsersByGroupTableQuery(groupId)}) 
                                                                as Users ON s.user_id = Users.user_id 
                                                                `;

exports.getSaleTableQuery = getSaleTableQuery;
exports.getSalesByUserTableQuery = getSalesByUserTableQuery;
exports.getAverageRevenueByUserTableQuery = getAverageRevenueByUserTableQuery;
exports.getAverageRevenueByGroupTableQuery = getAverageRevenueByGroupTableQuery;
exports.getTotalRevenueByUserTableQuery = getTotalRevenueByUserTableQuery;
exports.getTotalRevenueByGroupTableQuery = getTotalRevenueByGroupTableQuery;
exports.getTotalRevenueByGroupTableQueryRange = getTotalRevenueByGroupTableQueryRange;

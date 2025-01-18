'use strict';

// Get sales data
const getSaleTableQuery =           (saleId)        => `SELECT * FROM sales WHERE id =      '${saleId}'`;
const getSalesByUserTableQuery =    (userId, limit) => `SELECT * FROM sales WHERE user_id = '${userId}' LIMIT ${limit}`;

// Get user data
const getUsersByGroupTableQuery = (groupId) => `SELECT user_id FROM user_groups WHERE group_id = '${groupId}'`;

// Helpers
const getMonthYearFromDate = `SUBSTR(CAST(date as text), 1, 7)`;
// Keep the cast commands - they ensure we don't only return full dollars.  The decimals may be expanded in the future if necessary to avoid rounding issues.
const getAverage = `cast(cast
                        (SUM(amount) as DECIMAL(11, 3)) / COUNT(*)
                    as DECIMAL(10, 2)) as average `;
const filterByMonthYearRange = (fromMonth, fromYear, toMonth, toYear) => `SELECT * FROM sales WHERE ${getMonthYearFromDate} between '${fromYear}-${fromMonth}' AND '${toYear}-${toMonth}'`;

// Aggregations
const getRevenueByUserTableQuery =     (userId)    => 
                                                        `SELECT 
                                                            SUM(amount) as total,
                                                            COUNT(*) as count,
                                                            ${getAverage}
                                                        FROM sales 
                                                        WHERE user_id = '${userId}'`;
const getRevenueByGroupTableQueryRange =    (groupId, fromMonth, fromYear, toMonth, toYear)   => 
                                                        `SELECT 
                                                            ${getMonthYearFromDate} as month,
                                                            SUM(amount) as total, 
                                                            COUNT(*) as count,
                                                            ${getAverage}
                                                        FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales INNER JOIN (${getUsersByGroupTableQuery(groupId)}) 
                                                                as Users ON Sales.user_id = Users.user_id 
                                                                GROUP BY ${getMonthYearFromDate}`;

exports.getSaleTableQuery = getSaleTableQuery;
exports.getSalesByUserTableQuery = getSalesByUserTableQuery;
exports.getRevenueByUserTableQuery = getRevenueByUserTableQuery;
exports.getRevenueByGroupTableQueryRange = getRevenueByGroupTableQueryRange;

'use strict';

// Get sales data
const getSaleTableQuery =           (saleId)        => `SELECT * FROM sales WHERE id =      '${saleId}'`;
const getSalesByUserTableQuery =    (userId, limit) => `SELECT * FROM sales WHERE user_id = '${userId}' LIMIT ${limit}`;

// Get user data
const getUsersByGroupTableQuery = (groupId) => `SELECT user_id FROM user_groups WHERE group_id = '${groupId}'`;

// Helpers
const getMonthYearFromDate = `SUBSTR(CAST(date as text), 1, 7)`;
const filterByMonthYearRange = (fromMonth, fromYear, toMonth, toYear) => `SELECT * FROM sales WHERE ${getMonthYearFromDate} between '${fromYear}-${fromMonth}' AND '${toYear}-${toMonth}'`;
// Keep these cast commands - ensures we don't only return full dollars.  The decimals can be expanded in the future if necessary to avoid rounding issues.
const getAverage = `cast(cast
                        (SUM(amount) as DECIMAL(11, 3)) / COUNT(*)
                    as DECIMAL(10, 2))`;

// Aggregations
const getRevenueByUserTableQuery =     (userId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection)    => 
                                                        `SELECT 
                                                            ${getMonthYearFromDate} as month,
                                                            SUM(amount) as totalSaleRevenue,
                                                            COUNT(*) as numberOfSales,
                                                            ${getAverage} as averageRevenueBySales
                                                        FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales 
                                                        WHERE user_id = '${userId}'
                                                        GROUP BY ${getMonthYearFromDate}
                                                        ORDER BY ${sortBy} ${sortDirection}`;
const getRevenueByGroupTableQueryRange =    (groupId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection)   => 
                                                        `SELECT 
                                                            ${getMonthYearFromDate} as month,
                                                            SUM(amount) as totalSaleRevenue, 
                                                            COUNT(*) as numberOfSales,
                                                            ${getAverage} as averageRevenueBySales
                                                        FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales 
                                                        INNER JOIN (${getUsersByGroupTableQuery(groupId)}) as Users ON Sales.user_id = Users.user_id 
                                                        GROUP BY ${getMonthYearFromDate}
                                                        ORDER BY ${sortBy} ${sortDirection}`;

exports.getSaleTableQuery = getSaleTableQuery;
exports.getSalesByUserTableQuery = getSalesByUserTableQuery;
exports.getRevenueByUserTableQuery = getRevenueByUserTableQuery;
exports.getRevenueByGroupTableQueryRange = getRevenueByGroupTableQueryRange;

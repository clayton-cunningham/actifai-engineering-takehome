'use strict';

/**
 * Sales data
 */
const getSaleTableQuery =           (saleId)        => `SELECT * FROM sales WHERE id =      '${saleId}'`;
const getSalesByUserTableQuery =    (userId, limit) => `SELECT * FROM sales WHERE user_id = '${userId}' LIMIT ${limit}`;
const deleteSaleTableQuery =        (saleId)        => `DELETE FROM sales   WHERE id =      '${saleId}'`;
const createSaleTableQuery =        (saleId, userId, amount, date)  => `INSERT INTO sales (id, user_id, amount, date) VALUES (${saleId}, ${userId}, ${amount}, '${date}')`;

/**
 * User data
 */
const getUserTableQuery =                (userId)        => `SELECT * FROM users WHERE id =      '${userId}'`;
const getUsersByGroupTableQuery =        (groupId)       => `SELECT user_id FROM user_groups WHERE group_id = '${groupId}'`;
const getUsersByGroupAndRoleTableQuery = (groupId, role) => `SELECT user_id 
                                                                FROM user_groups Groups
                                                                INNER JOIN users as Users 
                                                                    ON Groups.user_id = Users.id
                                                                WHERE (group_id = '${groupId}' AND role = '${role}')`;
const addUserTableQuery =                (userId, name, role)          => `INSERT INTO users       (id, name, role)    VALUES (${userId}, '${name}', '${role}')`;
const addUserToGroupTableQuery =         (userId, groupId)             => `INSERT INTO user_groups (user_id, group_id) VALUES (${userId}, '${groupId}')`;
const createUserTableQuery =             (userId, name, role, groupId) => `BEGIN TRANSACTION;
                                                                             ${addUserTableQuery(userId, name, role)};
                                                                             ${addUserToGroupTableQuery(userId, groupId)};
                                                                           COMMIT;`;
const removeUserTableQuery =             (userId)        => `DELETE FROM users       WHERE id =      '${userId}'`;
const removeUserFromGroupTableQuery =    (userId)        => `DELETE FROM user_groups WHERE user_id = '${userId}'`;
const removeUserSalesTableQuery =        (userId)        => `DELETE FROM sales       WHERE user_id = '${userId}'`;
const deleteUserTableQuery =             (userId)        => `BEGIN TRANSACTION;
                                                               ${removeUserSalesTableQuery(userId)};
                                                               ${removeUserFromGroupTableQuery(userId)};
                                                               ${removeUserTableQuery(userId)};
                                                               COMMIT;`;


/**
 * Group data
 */
const getGroupTableQuery =           (groupId)        => `SELECT * FROM groups WHERE id =      '${groupId}'`;

/**
 * Helpers
 */
const getNewIdTableQuery =          (table)         => `SELECT MAX(id) as id FROM ${table}`;
const getMonthYearFromDate = `SUBSTR(CAST(date as text), 1, 7)`;
const filterByMonthYearRange = (fromMonth, fromYear, toMonth, toYear) => `SELECT * FROM sales WHERE ${getMonthYearFromDate} between '${fromYear}-${fromMonth}' AND '${toYear}-${toMonth}'`;
// Keep these cast commands - ensures we don't only return full dollars.  The decimals can be expanded in the future if necessary to avoid rounding issues.
const getAverage = `cast(cast
                        (SUM(amount) as DECIMAL(11, 3)) / COUNT(*)
                    as DECIMAL(10, 2))`;

/**
 * Aggregations
 */
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
const getRevenueByGroupTableQueryRange =    (groupId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection, role)   => 
                                                        `SELECT 
                                                            ${getMonthYearFromDate} as month,
                                                            SUM(amount) as totalSaleRevenue, 
                                                            COUNT(*) as numberOfSales,
                                                            ${getAverage} as averageRevenueBySales
                                                        FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales 
                                                        INNER JOIN (${role ? getUsersByGroupAndRoleTableQuery(groupId, role) : getUsersByGroupTableQuery(groupId)}) as Users 
                                                            ON Sales.user_id = Users.user_id 
                                                        GROUP BY ${getMonthYearFromDate}
                                                        ORDER BY ${sortBy} ${sortDirection}`;

module.exports = {
    getSaleTableQuery,
    getSalesByUserTableQuery,
    createSaleTableQuery,
    deleteSaleTableQuery,
    getUserTableQuery,
    createUserTableQuery,
    deleteUserTableQuery,
    getGroupTableQuery,
    getNewIdTableQuery,
    getRevenueByUserTableQuery,
    getRevenueByGroupTableQueryRange
}
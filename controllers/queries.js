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
const getUsersByRoleTableQuery =         (role)          => `SELECT id as user_id FROM users WHERE role = '${role}'`;
const getUsersByRolesTableQuery =        (roles)         => `SELECT id as user_id FROM users WHERE role in (${roles.toString()})`;
const getUsersByGroupsAndRolesQuery = (groupIds, roles) => `SELECT id as user_id, name FROM users as Users
                                                            ${groupIds ? `INNER JOIN user_groups as Groups ON Groups.user_id = Users.id` : ""}
                                                            ${groupIds ? roles ? `WHERE (group_id in (${groupIds.toString()}) AND role in (${roles.toString()}))`   // Group and role
                                                                             : `WHERE group_id in (${groupIds.toString()})`                                         // Group
                                                                      : roles ? `WHERE role in (${roles.toString()})`                                               // Role
                                                                             : "" }`;                                                                               // Neither
const removeUserTableQuery =             (userId)        => `DELETE FROM users       WHERE id =      '${userId}'`;
const removeUserFromGroupTableQuery =    (userId)        => `DELETE FROM user_groups WHERE user_id = '${userId}'`;
const removeUserSalesTableQuery =        (userId)        => `DELETE FROM sales       WHERE user_id = '${userId}'`;
const deleteUserTableQuery =             (userId)        => `BEGIN TRANSACTION;
                                                               ${removeUserSalesTableQuery(userId)};
                                                               ${removeUserFromGroupTableQuery(userId)};
                                                               ${removeUserTableQuery(userId)};
                                                               COMMIT;`;
const addUserTableQuery =                (userId, name, role)          => `INSERT INTO users       (id, name, role)    VALUES (${userId}, '${name}', '${role}')`;
const addUserToGroupTableQuery =         (userId, groupId)             => `INSERT INTO user_groups (user_id, group_id) VALUES (${userId}, '${groupId}')`;
const createUserQuery =             (userId, name, role, groupId) => `BEGIN TRANSACTION;
                                                                             ${addUserTableQuery(userId, name, role)};
                                                                             ${addUserToGroupTableQuery(userId, groupId)};
                                                                           COMMIT;`;
const editUserTableQuery =               (userId, name, role)          => `UPDATE users
                                                                             SET
                                                                                ${name ? ` name = '${name}'` : ""}
                                                                                ${name && role ? "," : ""}
                                                                                ${role ? ` role = '${role}'` : ""}
                                                                             WHERE id = '${userId}'`;
const editUserGroupTableQuery =          (userId, groupId)             => `UPDATE user_groups SET group_id = ${groupId} WHERE user_id = ${userId}`;
const editUserQuery =                    (userId, name, role, groupId) => `BEGIN TRANSACTION;
                                                                             ${name || role ? `${editUserTableQuery(userId, name, role)};` : ""}
                                                                             ${groupId ? `${editUserGroupTableQuery(userId, groupId)};` : ""}
                                                                           COMMIT;`;


/**
 * Group data
 */
const getGroupTableQuery =           (groupId)             => `SELECT * FROM groups WHERE id =      '${groupId}'`;
const getGroupsTableQuery =           (groupIds)           => `SELECT * FROM groups WHERE id in     (${groupIds.toString()})`;
const deleteGroupTableQuery =        (groupId)             => `DELETE FROM groups   WHERE id =      '${groupId}'`;
const createGroupTableQuery =        (groupId, groupName)  => `INSERT INTO groups (id, name) VALUES (${groupId}, '${groupName}')`;

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
const getRevenueTableQuery =    (fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection, groupByUsers)   => 
                                                        `SELECT 
                                                            ${groupByUsers ? `Sales.user_id, Users.name,` : ""}
                                                            ${getMonthYearFromDate} as month,
                                                            SUM(amount) as totalSaleRevenue, 
                                                            COUNT(*) as numberOfSales,
                                                            ${getAverage} as averageRevenueBySales
                                                        FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales 
                                                        INNER JOIN (${getUsersByGroupsAndRolesQuery(groupIds, roles)}) as Users 
                                                            ON Sales.user_id = Users.user_id 
                                                        GROUP BY ${getMonthYearFromDate} ${groupByUsers ? `, Sales.user_id, Users.name` : ""}
                                                        ORDER BY ${sortBy} ${sortDirection}`;
// const getRevenueForUsersTableQuery =    (fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection)   => 
//                                                         `SELECT 
//                                                             Sales.user_id,
//                                                             Users.name,
//                                                             ${getMonthYearFromDate} as month,
//                                                             SUM(amount) as totalSaleRevenue, 
//                                                             COUNT(*) as numberOfSales,
//                                                             ${getAverage} as averageRevenueBySales
//                                                         FROM (${filterByMonthYearRange(fromMonth, fromYear, toMonth, toYear)}) Sales 
//                                                         INNER JOIN (${getUsersByGroupsAndRolesQuery(groupIds, roles)}) as Users 
//                                                             ON Sales.user_id = Users.user_id 
//                                                         GROUP BY ${getMonthYearFromDate}, Sales.user_id, Users.name
//                                                         ORDER BY ${sortBy} ${sortDirection}`;

module.exports = {
    getSaleTableQuery,
    getSalesByUserTableQuery,
    deleteSaleTableQuery,
    createSaleTableQuery,
    getUserTableQuery,
    getUsersByGroupTableQuery,
    getUsersByRoleTableQuery,
    getUsersByRolesTableQuery,
    deleteUserTableQuery,
    createUserQuery,
    editUserQuery,
    getGroupTableQuery,
    getGroupsTableQuery,
    deleteGroupTableQuery,
    createGroupTableQuery,
    getNewIdTableQuery,
    getRevenueByUserTableQuery,
    getRevenueTableQuery
}
'use strict';

const { Client } = require('pg');
const queries = require("./queries");

const pgclient = new Client({
    host: 'db',
    port: '5432',
    user: 'user',
    password: 'pass',
    database: 'actifai'
});

pgclient.connect();

const sortOptions = [ 'month', 'totalsalerevenue', 'numberofsales', 'averagerevenuebysales' ];

/**
 * Retrieves the sales revenue for a user.
 * @param {userId}      req The user to retrieve sales for
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 */
const getRevenueByUser = async (req, res, next) => {
    const userId = req.params.userId;
    const { fromMonth, fromYear, toMonth, toYear } = req.query;
    let { sortBy, sortDirection } = req.query;

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        const error = new Error("Please add appropriate to and from dates, with a month and a year.", 400);
        return next(error);
    }
    if (!sortBy) sortBy = 'month';
    else if (sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) {
        return next(new Error("Input sortBy is not supported.  Please use one of the following: " + sortOptions.toString(), 400));
    }
    if (!sortDirection) sortDirection = 'ASC';
    else if (sortDirection.toUpperCase() != 'DESC' && sortDirection.toUpperCase() != 'ASC') {
        return next(new Error("Input sortDirection is not supported.  Please use ASC or DESC.", 400));
    }

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByUserTableQuery(userId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again at a later time', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ revenueByMonth : revenue });
}

/**
 * Retrieves the sales revenue for a selection of users.
 *  Allows for up to one group and one role selection.
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {groupId}             query Optional - additional filter, to only aggregate on users of a specific group
 * @param {role}                query Optional - additional filter, to only aggregate on users with a specific role
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 * @param {getUserInfo}         query Optional - if true, returns information for each user, within the entry for each month
 */
const getRevenue = async (req, res, next) => {
    const { fromMonth, fromYear, toMonth, toYear, groupId, role, getUserInfo } = req.query;
    let { sortBy, sortDirection } = req.query;

    // Validate the query parameters
    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        return next(new Error("Please add appropriate to and from dates, with a month and a year.", 400));
    }
    if (!sortBy) sortBy = 'month';
    else if (sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) {
        return next(new Error("Input sortBy is not supported.  Please use one of the following: " + sortOptions.toString(), 400));
    }
    if (!sortDirection) sortDirection = 'ASC';
    else if (sortDirection.toUpperCase() != 'DESC' && sortDirection.toUpperCase() != 'ASC') {
        return next(new Error("Input sortDirection is not supported.  Please use ASC or DESC.", 400));
    }

    let revenue;
    try {
        let groupIds;
        if (groupId) {
            // Check that this group exists
            let group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
            if (!group) {
                return next(new Error("Could not find a group for the provided id.", 404));
            }
            groupIds = [];
            groupIds.push(groupId);
        }
        let roles;
        if (role) {
            // Check that this role exists
            let usersForRole = (await pgclient.query(queries.getUsersByRoleTableQuery(role))).rows;
            if (!usersForRole || usersForRole.length == 0) {
                return next(new Error("Could not find any users with the provided role.", 404));
            }
            roles = [];
            roles.push(`'${role}'`)
        }

        // Aggregate the revenue
        revenue = (await pgclient.query(queries.getRevenueTableQuery(fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection))).rows;

        if (getUserInfo && getUserInfo.toLowerCase() == "true") {
            // Retrieve info specific to each user, and add them in the appropriate month.
            // Note - this will sort on the same field as the month aggregation for the group/role
            let userInfo = (await pgclient.query(queries.getRevenueForUsersTableQuery(fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection))).rows;

            userInfo.forEach(u => {
                let revenueMonth = revenue.find(r => r.month == u.month);
                revenueMonth.users = revenueMonth.users || [];
                revenueMonth.users.push(u);
            })
        }
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again at a later time', 500);
        return next(error);
    }

    if (!revenue || revenue.length == 0) {
        const error = new Error("Could not find any revenue for the provided filters.", 404);
        return next(error);
    }

    res.json({ revenueByMonth : revenue });
}

/**
 * Retrieves the sales revenue for a selection of users.
 *  Allows for multiple group and role selections.
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {groupIds}             body  Optional - additional filter, to only aggregate on users of specific groups
 * @param {roles}                body  Optional - additional filter, to only aggregate on users with specific roles
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 * @param {getUserInfo}         query Optional - if true, returns information for each user, within the entry for each month
 */
const revenuePostQuery = async (req, res, next) => {
    const { fromMonth, fromYear, toMonth, toYear, getUserInfo } = req.query;
    let { groupIds, roles } = req.body;
    let { sortBy, sortDirection } = req.query;

    // Validate the query parameters
    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        return next(new Error("Please add appropriate to and from dates, with a month and a year.", 400));
    }
    if (!sortBy) sortBy = 'month';
    else if (sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) {
        return next(new Error("Input sortBy is not supported.  Please use one of the following: " + sortOptions.toString(), 400));
    }
    if (!sortDirection) sortDirection = 'ASC';
    else if (sortDirection.toUpperCase() != 'DESC' && sortDirection.toUpperCase() != 'ASC') {
        return next(new Error("Input sortDirection is not supported.  Please use ASC or DESC.", 400));
    }

    let revenue;
    try {
        if (groupIds) {
            // Check that this group exists
            let group = (await pgclient.query(queries.getGroupsTableQuery(groupIds))).rows[0];
            if (!group) {
                return next(new Error("Could not find any groups for the provided ids.", 404));
            }
        }
        if (roles) {
            // Check that this role exists
            roles = roles.map(r => `'${r}'`);
            let usersForRole = (await pgclient.query(queries.getUsersByRolesTableQuery(roles))).rows;
            if (!usersForRole || usersForRole.length == 0) {
                return next(new Error("Could not find any users with the provided roles.", 404));
            }
        }

        // Aggregate the revenue
        revenue = (await pgclient.query(queries.getRevenueTableQuery(fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection))).rows;

        if (getUserInfo && getUserInfo.toLowerCase() == "true") {
            // Retrieve info specific to each user, and add them in the appropriate month.
            // Note - this will sort on the same field as the month aggregation for the group/role
            let userInfo = (await pgclient.query(queries.getRevenueForUsersTableQuery(fromMonth, fromYear, toMonth, toYear, groupIds, roles, sortBy, sortDirection))).rows;

            userInfo.forEach(u => {
                let revenueMonth = revenue.find(r => r.month == u.month);
                revenueMonth.users = revenueMonth.users || [];
                revenueMonth.users.push(u);
            })
        }
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again at a later time', 500);
        return next(error);
    }

    if (!revenue || revenue.length == 0) {
        const error = new Error("Could not find any revenue for the provided filters.", 404);
        return next(error);
    }

    res.json({ revenueByMonth : revenue });
}

module.exports = {
    getRevenueByUser,
    getRevenue,
    revenuePostQuery
}

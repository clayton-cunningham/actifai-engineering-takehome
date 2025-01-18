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


/**
 * Retrieves a sale by id.
 * @param {saleId} req The sale to retrieve
 */
const getSaleById = async (req, res, next) => {
    const saleId = req.params.saleId;

    let sale;
    try {
        sale = await pgclient.query(queries.getSaleTableQuery(saleId));
    } catch (e) {
        const error = new Error(
            'Failed to retrieve a sale, please try again',
            500
        );
        return next (error);
    }

    if (!sale) {
        const error = new Error(
            "Could not find a sale for the provided id.", 404
        );
        return next (error);
    }

    res.json({ sale: sale.rows[0] });
}

/**
 * Retrieves a user's sales
 * @param {userId} req The user to retrieve sales for
 * @param {limit} req Optional; specifies a maximum number of sales to retrieve.  Default is 10.
 */
const getSalesByUserId = async (req, res, next) => {
    const userId = req.params.userId;
    let limit = req.query.limit;

    if (!limit) {
        limit = 10
    } 
    else if (limit > 50) {
        limit = 50;
    } 

    let sales;
    try {
        sales = await pgclient.query(queries.getSalesByUserTableQuery(userId, limit));
    } catch (e) {
        const error = new Error(
            `Failed to retrieve a user's sales, please try again`,
            500
        );
        return next (error);
    }

    if (!sales) {
        const error = new Error(
            "Could not find any sales for the provided id.", 404
        );
        return next (error);
    }

    res.json({ sales: sales.rows });
}

exports.getSaleById = getSaleById;
exports.getSalesByUserId = getSalesByUserId;

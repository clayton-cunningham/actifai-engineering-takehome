'use strict';

const { Client } = require('pg');
const queries = require("./queries");
const { validationResult } = require('express-validator');

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
 * @param {saleId} params The sale to retrieve
 */
const getSaleById = async (req, res, next) => {
    const saleId = req.params.saleId;

    let sale;
    try {
        sale = (await pgclient.query(queries.getSaleTableQuery(saleId))).rows[0];
    } catch (e) {
        const error = new Error('Failed to retrieve a sale, please try again', 500);
        return next (error);
    }

    if (!sale) {
        const error = new Error("Could not find a sale for the provided id.", 404);
        return next (error);
    }

    res.json({ sale });
}

/**
 * Retrieves a user's sales
 * @param {userId} params The user to retrieve sales for
 * @param {limit}  query  Optional; specifies a maximum number of sales to retrieve.  Default is 10.
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
        sales = (await pgclient.query(queries.getSalesByUserTableQuery(userId, limit))).rows;
    } catch (e) {
        const error = new Error(`Failed to retrieve a user's sales, please try again`, 500);
        return next (error);
    }

    if (!sales || sales.length == 0) {
        const error = new Error("Could not find any sales for the provided id.", 404);
        return next (error);
    }

    res.json({ sales });
}

/**
 * Creates a sale record
 *  * Note: we currently generate an id, but we may want to require a sale id to be input for consistency with other records external to this system.
 * @param {userId}  body The user to add a sale for
 * @param {amount}  body The sale amount
 * @param {date}    body The sale date (format: YYYY-MM-DD)
 */
const createSale = async (req, res, next) => {
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new Error("Invalid input.", 422));
    }

    const { userId, amount, date } = req.body;

    // Obtain the user to confirm they exist.
    // Obtain the maximum id for a sale to generate a new id (*see note in function comment header)
    let user;
    let newSaleId;
    try {
        user = await pgclient.query(queries.getUserTableQuery(userId));
        newSaleId = parseInt((await pgclient.query(queries.getNewIdTableQuery('sales'))).rows[0].id) + 1;
    } catch (e) {
        const error = new Error('Failed to access database, please try again', 500);
        return next (error);
    }

    // If the user specified doesn't exist, we cannot create a sale
    if (!user) {
        const error = new Error("Could not find a user for the provided id.", 404);
        return next (error);
    }

    // Create a sale
    try {
        await pgclient.query(queries.createSaleTableQuery(newSaleId, userId, amount, date));
    } catch (e) {
        const error = new Error('Failed to access database, please try again', 500);
        return next (error);
    }
    
    res.status(201).json({ id: newSaleId });
}

/**
 * Deletes a sale record
 * @param {saleId} params The sale to delete
 */
const deleteSale = async (req, res, next) => {
    const { saleId } = req.params;

    try {
        await pgclient.query(queries.deleteSaleTableQuery(saleId));
    } catch (e) {
        const error = new Error('Failed to access database, please try again', 500);
        return next (error);
    }
    
    res.status(204).json({});
}

module.exports = {
    getSaleById,
    getSalesByUserId,
    createSale,
    deleteSale
}

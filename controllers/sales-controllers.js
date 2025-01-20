'use strict';

const { Client } = require('pg');
const queries = require("./queries");
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');

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
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    let sale;
    try {
        sale = (await pgclient.query(queries.getSaleTableQuery(saleId))).rows[0];
    } catch (e) {
        return next(new HttpError('Failed to retrieve a sale, please try again at a later time', 500));
    }

    if (!sale) {
        return next(new HttpError("Could not find a sale for the provided id.", 404));
    }

    res.json({ sale });
}

/**
 * Retrieves a user's sales
 * @param {userId} params The user to retrieve sales for
 * @param {limit}  query  Optional; specifies a maximum number of sales to retrieve.  (default: 10)
 */
const getSalesByUserId = async (req, res, next) => {
    const userId = req.params.userId;
    let limit = req.query.limit;
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

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
        return next(new HttpError(`Failed to retrieve a user's sales, please try again at a later time`, 500));
    }

    if (!sales || sales.length == 0) {
        return next(new HttpError("Could not find any sales for the provided id.", 404));
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
        return next(new HttpError("Invalid input.", 422));
    }

    const { userId, amount, date } = req.body;

    let newSaleId;
    try {
        // Obtain the user to confirm they exist. If not, we cannot create a sale
        let user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
        if (!user) {
            return next(new HttpError("Could not find a user for the provided id.", 404));
        }

        // Obtain the maximum id for a sale to generate a new id (*see note in function comment header)
        newSaleId = parseInt((await pgclient.query(queries.getNewIdTableQuery('sales'))).rows[0].id) + 1;

        // Create a sale
        await pgclient.query(queries.createSaleTableQuery(newSaleId, userId, amount, date));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(201).json({ id: newSaleId });
}

/**
 * Deletes a sale record
 * @param {saleId} params The sale to delete
 */
const deleteSale = async (req, res, next) => {
    const { saleId } = req.params;
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    try {
        // Check if the sale exists
        let sale = (await pgclient.query(queries.getSaleTableQuery(saleId))).rows[0];
        if (!sale) {
            return next(new HttpError("Could not find a sale for the provided id.", 404));
        }

        // Delete the sale
        await pgclient.query(queries.deleteSaleTableQuery(saleId));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(204).json({});
}

module.exports = {
    getSaleById,
    getSalesByUserId,
    createSale,
    deleteSale
}

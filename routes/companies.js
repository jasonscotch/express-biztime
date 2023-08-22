
const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    // Get a list of all companies
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
})

router.get('/:code', async (req, res, next) => {
    // Get a single company with invoices
    try {
        const { code } = req.params;
        const results = await db.query(`
            SELECT 
            * 
            FROM companies AS c
            LEFT JOIN invoices AS i ON c.code = i.comp_code
            WHERE code = $1
            `, [code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }
        const companyData = results.rows[0];
        const invoices = results.rows.map(row => ({
            id: companyData.id,
            comp_code: companyData.comp_code,
            amt: companyData.amt,
            paid: companyData.paid,
            add_date: companyData.add_date,
            paid_date: companyData.paid_date
        }))
        
        const company = {
            company: {
                code: companyData.code,
                name: companyData.name,
                description: companyData.description,
                invoices: invoices
            }
        }
        return res.send(company);
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    // Create a single company
    try {
        const { code, name, description } = req.body;
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch (e) {
        return next(e);
    }
})

router.patch('/:code', async (req, res, next) => {
    // Updates a single company
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404);
          }
          return res.send({company: results.rows[0]});
    } catch (e) {
        return next(e);
    }
})

router.delete('/:code', async (req, res, next) => {
    // Delete a single company
    try {
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code = $1`, [code]);
        if (results.rowCount === 0) {
            throw new ExpressError(`Can't delete company with code of ${code}`, 404);
          }
        return res.send({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
})

module.exports = router;
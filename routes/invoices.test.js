process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async () => {
    await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('taz', 'Taz Inc.', 'A dog treat company specializing in extra large bones');
    `);
    
    const result = await db.query(`
        INSERT INTO invoices (comp_code, amt, paid, paid_date)
        VALUES ('taz', 100, false, null) RETURNING *;
    `);
    testInvoice = result.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
    await db.end()
})

describe("GET /invoices", () => {
    test("Get a list of all invoices", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }] })
    })
})

describe("GET /invoices/:id", () => {
    test("Get a single invoice", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: {id: expect.any(Number), add_date: expect.anything(), comp_code: testInvoice.comp_code, amt: 100, paid: false, paid_date: null } });
    })
})

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: testInvoice.comp_code, amt: 500 });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {id: expect.any(Number), add_date: expect.anything(), comp_code: testInvoice.comp_code, amt: 500, paid: false, paid_date: null }
        });
    })
})

describe("PATCH /invoices", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app).patch(`/invoices/${testInvoice.id}`).send({ comp_code: testInvoice.comp_code, amt: 700 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {id: expect.any(Number), add_date: expect.anything(), comp_code: testInvoice.comp_code, amt: 700, paid: false, paid_date: null }
        })
    })
    test("Updates a single invoice", async () => {
        const res = await request(app).patch(`/invoices/0`).send({ comp_code: testInvoice.comp_code, amt: 700 });
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /invoices", () => {
    test("Deletes a single invoice", async () => {
      const res = await request(app).delete(`/invoices/${testInvoice.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'deleted' });
    })
  })
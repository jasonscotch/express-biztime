process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('taz', 'Taz Inc.', 'A dog treat company specializing in extra large bones') RETURNING *`);
    await db.query(`
        INSERT INTO invoices (comp_code, amt, paid, paid_date)
        VALUES ('taz', 100, false, null) RETURNING *;
    `);
    testCompany = result.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
    await db.end()
})

describe("GET /companies", () => {
    test("Get a list of all companies", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [{ code: testCompany.code, name: testCompany.name }] })
    })
})

describe("GET /companies/:code", () => {
    test("Get a single company with invoices", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ 
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description,
                invoices: [ {
                    id: expect.any(Number), 
                    comp_code: testCompany.code,
                    amt: 100, 
                    paid: false,
                    add_date: expect.anything(), 
                    paid_date: null 
                }]
            }
        });
    })
})

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ code: 'jas', name: 'Jasons Company', description: 'A random company.' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {code: 'jas', name: 'Jasons Company', description: 'A random company.'}
        })
    })
})

describe("PATCH /companies", () => {
    test("Updates a single company", async () => {
        const res = await request(app).patch(`/companies/${testCompany.code}`).send({name: "Jason's Company", description: "Jason's random company."});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { name: "Jason's Company", description: "Jason's random company.", code: 'taz' }
        })
    })
    test("Updates a single company", async () => {
        const res = await request(app).patch(`/companies/0`).send({name: "Jason's Company", description: "Jason's random company."});
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /companies", () => {
    test("Deletes a single company", async () => {
      const res = await request(app).delete(`/companies/${testCompany.code}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'deleted' });
    })
  })
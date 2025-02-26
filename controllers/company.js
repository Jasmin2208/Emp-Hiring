const { validationResult } = require("express-validator");
const { knex } = require("../database/db");
const { generateCoCode, response } = require("../helpers/helper");
const { TryCatch, ErrorHandler } = require("../middleware/error");

const createCompany = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }

    const { name,
        planId,
        type,
        dateAttach,
        panAttach,
        gstAttach,
        tanAttach,
        add1,
        add2,
        add3,
        city,
        state,
        pin,
        authName,
        authMail,
        authPhone,
        mgrIsActive,
        mgrEmpId,
        mgrFirstName,
        mgrMiddleName,
        mgrLastName,
        mgrPhone,
        mgrMail,
        whatsapp,
        website,
        linkedin,
        facebook,
        instagram,
        twitter } = req.body;

    const existingCompany = await knex('co-info').where('name', name).first();
    if (existingCompany) {
        return next(new ErrorHandler('This company is already created.', 409));
    }

    const [newCompany] = await knex("co_info").insert(req.body);

    response(res, 201, false, 'Company created successfully.', { coCode: newCompany });
})

const getAllCompany = TryCatch(async (req, res, next) => {
    let { limit, page, filter } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    filter = filter || null;

    let companyQuery = knex("co_info").orderBy("id", "desc");
    if (filter && filter !== "null") {
        companyQuery.andWhere(function () {
            this.where("name", "like", `%${filter}%`)
                .orWhere("id", "like", `%${filter}%`)
                .orWhere("authName", "like", `%${filter}%`)
                .orWhere("authMail", "like", `%${filter}%`)
                .orWhere("mgrFirstName", "like", `%${filter}%`)
                .orWhere("mgrMiddleName", "like", `%${filter}%`)
                .orWhere("mgrLastName", "like", `%${filter}%`)
                .orWhere("mgrMail", "like", `%${filter}%`)
        });
    }

    const totalCountResult = await companyQuery.clone().count("id as count").first();
    const totalCount = totalCountResult ? totalCountResult.count : 0;

    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    const companies = await companyQuery.offset(offset).limit(limit);

    response(res, 200, false, "Companies fetched successfully.", { companies, totalPages, totalCount });
})

const getCompanyById = TryCatch(async (req, res, next) => {
    const {id} = req.params

    const company = await knex('co_info').where('id', id).first();
    if(!company){
        return next(new ErrorHandler('Company not found.', 404));
    }
})

module.exports = { createCompany, getAllCompany }
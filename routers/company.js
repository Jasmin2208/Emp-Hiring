const express = require('express');
const { check, query } = require('express-validator');
const router = express.Router();

const { createCompany, getAllCompany } = require("../controllers/company")

router.get('/list', getAllCompany)

router.post('/create',
    check('name', 'Company name is required.').notEmpty(),
    check('planId', 'Company plan is required.').notEmpty(),
    check('type', 'Company type is required.').notEmpty(),
    check('dateAttach', 'Date of attachment is required.').notEmpty(),
    check('dateAttach', 'Please enter a valid date (YYYY-MM-DD).').isDate(),
    check('panAttach', 'PAN attachment is required.').notEmpty(),
    check('gstAttach', 'GST attachment is required.').notEmpty(),
    check('tanAttach', 'TAN attachment is required.').notEmpty(),
    check('add1', 'Address Line 1 is required.').notEmpty(),
    check('add2', 'Address Line 2 is required.').notEmpty(),
    check('add3', 'Address Line 3 is required.').notEmpty(),
    check('city', 'City is required.').notEmpty(),
    check('state', 'State is required.').notEmpty(),
    check('pin', 'PIN Code is required and must be exactly 6 digits.').notEmpty().isLength({ min: 6, max: 6 }),
    check('authName', 'Admin name is required.').notEmpty(),
    check('authMail', 'Admin email is required.').notEmpty(),
    check('authMail', 'Please enter a valid admin email.').isEmail(),
    check('authPhone', 'Admin phone number is required.').notEmpty(),
    check('authPhone', 'Admin phone number must be exactly 10 digits.').isLength({ min: 10, max: 10 }),
    check('mgrEmpId', 'Manager employee ID is required.').notEmpty(),
    check('mgrFirstName', 'Manager first name is required.').notEmpty(),
    check('mgrMiddleName', 'Manager middle name is required.').notEmpty(),
    check('mgrLastName', 'Manager last name is required.').notEmpty(),
    check('mgrMail', 'Manager email is required.').notEmpty(),
    check('mgrMail', 'Please enter a valid manager email.').isEmail(),
    check('mgrPhone', 'Manager phone number is required.').notEmpty(),
    check('mgrPhone', 'Manager phone number must be exactly 10 digits.').isLength({ min: 10, max: 10 }),
    createCompany
);


module.exports = router
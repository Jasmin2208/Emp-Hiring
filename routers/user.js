const express = require('express');
const { check, query } = require('express-validator');
const { auth } = require('../middleware/auth')
const router = express.Router();

const { getUserDetails, updateUserPersonalInfo, updateUserEducationInfo, updateUserFamilyInfo } = require("../controllers/user")

router.get("/details", auth, getUserDetails)

router.put("/update/personal/info",
    check('aadhaarNo', 'Aadhaar number is required.').notEmpty(),
    check('aadhaarNo', 'Aadhaar number must be 12 digits and should not start with 0 or 1.')
        .matches(/^[2-9]{1}[0-9]{11}$/),
    check('pan', 'PAN number is required.').notEmpty(),
    check('pan', 'PAN number must be in the format ABCDE1234F.')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    check('phone', 'Phone number is required.').notEmpty(),
    check('phone', 'Phone number must be exactly 10 digits.')
        .isLength({ min: 10, max: 10 })
        .isNumeric(),
    check('dob', 'Date of birth is required.').notEmpty(),
    check('dob', 'Enter a valid date of birth (YYYY-MM-DD).').isDate(),
    check('marital', 'Enter a valid marital ID').isInt(),
    check('bloodGroup', 'Enter a valid blood group ID').isInt(),
    auth, updateUserPersonalInfo
);

router.put("/update/education/info",
    check('degree', 'Enter a valid degree ID').isInt(),
    check('college', 'College name is required.').notEmpty(),
    check('university', 'Enter a valid university ID').isInt(),
    check('city', 'City name is required.').notEmpty(),
    check('state', 'Enter a valid state ID').isInt(),
    check('pincode', 'PIN code is required.').notEmpty(),
    check('pincode', 'PIN code must be exactly 6 digits.')
        .isLength({ min: 6, max: 6 })
        .isNumeric(),
    check('startYear', 'Start date is required.').notEmpty(),
    check('startYear', 'Invalid start date format. Please use YYYY-MM-DD.').isDate(),
    check('endYear', 'End date is required.').notEmpty(),
    check('endYear', 'Invalid end date format. Please use YYYY-MM-DD.').isDate(),
    auth, updateUserEducationInfo
);

router.put("/update/family/info",
    check('relationship', 'Enter a valid relationship ID').isInt(),
    check('firstName', 'First name is required.').notEmpty(),
    check('middleName', 'Middle name is required.').notEmpty(),
    check('lastName', 'Last name is required.').notEmpty(),
    check('phone', 'Phone number is required.').notEmpty(),
    check('phone', 'Phone number must be exactly 10 digits.')
        .isLength({ min: 10, max: 10 })
        .isNumeric(),
    auth, updateUserFamilyInfo
);

module.exports = router
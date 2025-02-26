const express = require('express');
const { check, query } = require('express-validator');
const router = express.Router();

const { loginUser, registerUser, forgotPassword, resetPassword } = require('../controllers/authentication')

router.post('/login',
    check('email', 'Email is required.').notEmpty(),
    check('email', 'Email is not valid.').isEmail(),
    check('password', 'Password is required').notEmpty(),
    check('password', 'Please enter a password with 8 or more characters.').isLength({ min: 8 }),
    loginUser);

router.post('/sign-up',
    check('firstName', 'First name is required.').notEmpty(),
    check('middleName', 'Middle name is required.').notEmpty(),
    check('lastName', 'Last name is required.').notEmpty(),
    check('email', 'Email is required.').notEmpty(),
    check('email', 'Enter a valid email address.').isEmail(),
    check('phone', 'Phone number is required.').notEmpty(),
    check('phone', 'Phone number must be exactly 10 digits.').isLength({ min: 10, max: 10 }).isNumeric(),
    check('password', 'Password is required.').notEmpty(),
    check('password', 'Please enter a password with 8 or more characters.').isLength({ min: 8 }),
    check('dob', 'Date of birth is required.').notEmpty(),
    check('dob', 'Enter a valid date of birth (YYYY-MM-DD).').isDate(),
    registerUser
);

router.post("/forgot-password",
    check('email', 'Email is required.').notEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    forgotPassword
)

router.put("/reset-password",
    query('token', 'Token is required.').notEmpty(),
    check('password', 'Password is required.').notEmpty(),
    check('password', 'Please enter a password with 8 or more characters.').isLength({ min: 8 }),
    resetPassword
)

module.exports = router
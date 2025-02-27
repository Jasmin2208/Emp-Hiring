const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt');
const fs = require("fs");
const hbs = require("handlebars");
const { promisify } = require('util');
const { knex } = require("../database/db");
const moment = require('moment');
const saltRounds = 10;

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS,
    },
});

const sendMailAsync = promisify(transporter.sendMail).bind(transporter);

const compile = function (data, template) {
    try {
        var html = fs.readFileSync(template, "utf8")
        const templateScript = hbs.compile(html)

        const res = templateScript(data)
        return res
    } catch (error) {
        console.error('Error reading the file:', error.message);
    }
}

const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.log(error);
    }
};

const comparePassword = async (password, hashPassword) => {
    try {
        return bcrypt.compare(password, hashPassword);
    } catch (error) {
        console.log(error);
    }
};

const response = (res, status = 200, error, message, data) => {
    return res.status(status).json({
        status: "success",
        message,
        data,
    });
}

const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email)) {
        return true;
    } else {
        return false;
    }
}

function validatePassword(password) {
    const hasCharacter = /[a-zA-Z]/;
    const hasDigit = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!password || !hasCharacter.test(password) || !hasDigit.test(password) || !hasSpecialChar.test(password)) {
        return "Password must contain at least one letter, one digit, and one special character.";
    }

    return null;
}

const generateCoCode = async (prefix = "CO") => {
    let isUnique = false;
    let coCode = "";

    while (!isUnique) {
        const randomNumber = Math.floor(10000 + Math.random() * 90000);
        coCode = `${prefix}${randomNumber}`;

        const existingCode = await knex("co_info").where("coCode", coCode).first();
        if (!existingCode) {
            isUnique = true;
        }
    }
    return coCode;
};

const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDate = (dateString) => {
    return moment(dateString).format('YYYY-MM-DD');
}

const getLookupLists = async (knex, roleId) => {
    const lookupTypes = [
        { key: 'maritalStatusOptions', type: 'marital' },
        { key: 'bloodGroupOptions', type: 'bloodGroup' },
        { key: 'degreeOptions', type: 'degree' },
        { key: 'universityOptions', type: 'university' },
        { key: 'stateOptions', type: 'state' },
        { key: 'addressTypeOptions', type: 'addrtype' },
        { key: 'relationOptions', type: 'relation' },
        { key: 'genderOptions', type: 'gender' },
    ];

    const lookupPromises = lookupTypes.map(({ key, type }) =>
        knex('commonLookup').select('id', 'code as value').where('type', type)
            .then(data => ({ [key]: data }))
    );

    const userRolePromise = knex('commonLookup')
        .select('code as value')
        .where({ type: 'role', id: roleId })
        .first()
        .then(role => ({ userRole: role }));

    // Execute all queries in parallel
    const results = await Promise.all([...lookupPromises, userRolePromise]);

    // Merge results into a single object
    return Object.assign({}, ...results);
};

// Extract Values Using Lookup Lists
const findValueFromLookupList = (list, id) => id ? list.find(item => item.id === id)?.value || null : null;

module.exports = {
    hashPassword,
    comparePassword,
    response,
    isEmail,
    validatePassword,
    sendMailAsync,
    compile,
    generateCoCode,
    capitalizeFirstLetter,
    formatDate,
    getLookupLists,
    findValueFromLookupList
}
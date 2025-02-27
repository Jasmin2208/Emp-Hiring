const { validationResult } = require("express-validator");
const { knex } = require("../database/db");
const { ErrorHandler, TryCatch } = require("../middleware/error");
const { hashPassword, comparePassword, response, compile, sendMailAsync, formatDate, getLookupLists, capitalizeFirstLetter, findValueFromLookupList, } = require("../helpers/helper");
const jwt = require("jsonwebtoken");

const loginUser = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await knex("emp_info").where({ email }).first();
    if (!user) {
        return next(new ErrorHandler("Invalid email or password.", 401));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return next(new ErrorHandler("You have entered an Incorrect Email or Password.", 401));
    }

    const lookupData = await getLookupLists(knex, user.roleId);

    const { password: _, ...sanitizedUser } = user;

    const loginUserDetails = {
        ...sanitizedUser,
        gender: sanitizedUser.gender ? capitalizeFirstLetter(findValueFromLookupList(lookupData.genderOptions, sanitizedUser.gender)) : null,
        doj: sanitizedUser.doj ? formatDate(sanitizedUser.doj) : null,
        dos: sanitizedUser.dos ? formatDate(sanitizedUser.dos) : null,
        dob: sanitizedUser.dob ? formatDate(sanitizedUser.dob) : null,
        role: lookupData?.userRole?.value ? capitalizeFirstLetter(lookupData.userRole.value) : null
    };

    const token = jwt.sign({ user: loginUserDetails }, process.env.JWT_SECRET_KEY, { expiresIn: "365d" });

    return response(res, 200, false, "Login successful!", { user: loginUserDetails, token });
});

const registerUser = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg });
    }

    const { firstName, middleName, lastName, email, password, phone, dob } = req.body;

    const existingEmail = await knex("emp_info").where({ email: email }).first();
    if (existingEmail) {
        return next(new ErrorHandler('This email is already registered.', 409));
    }

    const hashedPassword = await hashPassword(password);

    const userDetail = {
        firstName,
        middleName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        dob,
    };

    const [newUser] = await knex("emp_info").insert(userDetail);

    response(res, 201, false, 'Sign-up successfully.', { userId: newUser });
});

const forgotPassword = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg });
    }

    const { email } = req.body;

    const user = await knex("emp_info").where({ email: email }).first();
    if (!user) {
        return next(new ErrorHandler("User not found.", 404));
    }

    const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h", });

    const resetLink = `${CLIENT_SIDE_URL}/reset-password/${token}`;

    const data = {
        name: `${user.firstName} ${user.lastName}`,
        reset_password_link: resetLink,
        support_email: process.env.ADMIN_EMAIL,
        year: new Date().getFullYear()
    };

    const content = compile(data, "./templates/reset_password.html");

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: email,
        subject: "Password Reset Request - Your Action Required",
        html: content,
    };

    const mailResponse = await sendMailAsync(mailOptions);

    if (mailResponse?.accepted) {
        return response(res, 200, false, "Please check your email. A reset link has been sent successfully.");
    } else {
        return next(new ErrorHandler("Failed to send reset link. Please try again later.", 500));
    }
});

const resetPassword = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg });
    }

    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
        return next(new ErrorHandler('Token is required', 400));
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (error, decoded) => {
        if (error) {
            console.error("JWT Verification Error:", error.message);
            return next(new ErrorHandler('Invalid or expired token', 401));
        }

        const { user_id } = decoded;

        try {
            const user = await knex('emp_info').where({ id: user_id }).first();
            if (!user) {
                return next(new ErrorHandler('User not found.', 404));
            }

            const hashedPassword = await hashPassword(password);

            await knex('emp_info').where('id', user_id).update({ password: hashedPassword });

            response(res, 200, false, 'Your password has been reset successfully.');
        } catch (err) {
            console.error("Database Error:", err.message);
            return next(new ErrorHandler('Failed to activate account', 500));
        }
    });
});

module.exports = { loginUser, registerUser, forgotPassword, resetPassword }    